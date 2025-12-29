const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { once } = require("events");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "csv";

async function ingestCSV() {
  console.log("➡️ Running CSV ingestion (incremental + idempotent)");

  // ─────────────────────────────────────────────
  // 0️⃣ Start ETL run
  // ─────────────────────────────────────────────
  const startTime = Date.now();
  let processedCount = 0;

  const runRes = await pool.query(
    `
    INSERT INTO etl_runs (source, status, started_at)
    VALUES ($1, 'running', NOW())
    RETURNING id
    `,
    [SOURCE]
  );

  const runId = runRes.rows[0].id;

  // ─────────────────────────────────────────────
  // 1️⃣ Read checkpoint
  // ─────────────────────────────────────────────
  const checkpointRes = await pool.query(
    "SELECT last_run FROM etl_checkpoint WHERE source = $1",
    [SOURCE]
  );

  const lastRun =
    checkpointRes.rows[0]?.last_run || new Date("1970-01-01T00:00:00Z");

  let maxProcessedTimestamp = lastRun;

  try {
    // ─────────────────────────────────────────────
    // 2️⃣ Read CSV fully
    // ─────────────────────────────────────────────
    const csvPath = path.join(__dirname, "../data/crypto_prices.csv");
    const rows = [];

    const stream = fs.createReadStream(csvPath).pipe(csv());

    stream.on("data", (row) => rows.push(row));
    stream.on("error", (err) => {
      throw err;
    });

    await once(stream, "end");

    // ─────────────────────────────────────────────
    // 3️⃣ Process rows sequentially (incremental)
    // ─────────────────────────────────────────────
    for (const row of rows) {
      const updatedAt = new Date(row.last_updated);

      // Skip already processed records
      if (updatedAt <= lastRun) continue;

      // ─────────────────────────────────────────
      // 4️⃣ Store RAW data (audit/debug)
      // ─────────────────────────────────────────
      await pool.query(
        `
        INSERT INTO raw_crypto (source, payload)
        VALUES ($1, $2)
        `,
        [SOURCE, row]
      );

      // ─────────────────────────────────────────
      // 5️⃣ Normalize & validate
      // ─────────────────────────────────────────
      const clean = schema.parse({
        coin_id: row.coin_id,
        name: row.name,
        symbol: row.symbol,
        price_usd: Number(row.price_usd),
        source: SOURCE,
        last_updated: updatedAt,
      });

      // ─────────────────────────────────────────
      // 6️⃣ Idempotent insert (NO duplicates)
      // ─────────────────────────────────────────
      await pool.query(
        `
        INSERT INTO clean_crypto_prices
        (coin_id, name, symbol, price_usd, source, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (coin_id, source, last_updated)
        DO NOTHING
        `,
        [
          clean.coin_id,
          clean.name,
          clean.symbol,
          clean.price_usd,
          clean.source,
          clean.last_updated,
        ]
      );

      processedCount++;

      if (updatedAt > maxProcessedTimestamp) {
        maxProcessedTimestamp = updatedAt;
      }
    }

    // ─────────────────────────────────────────────
    // 7️⃣ Update checkpoint AFTER success
    // ─────────────────────────────────────────────
    await pool.query(
      `
      INSERT INTO etl_checkpoint (source, last_run, status)
      VALUES ($1, $2, 'success')
      ON CONFLICT (source)
      DO UPDATE SET
        last_run = EXCLUDED.last_run,
        status = 'success',
        updated_at = NOW()
      `,
      [SOURCE, maxProcessedTimestamp]
    );

    // ─────────────────────────────────────────────
    // 8️⃣ Mark ETL run SUCCESS
    // ─────────────────────────────────────────────
    const durationMs = Date.now() - startTime;

    await pool.query(
      `
      UPDATE etl_runs
      SET status = 'success',
          records_processed = $1,
          finished_at = NOW(),
          duration_ms = $2
      WHERE id = $3
      `,
      [processedCount, durationMs, runId]
    );

    console.log("✅ CSV ingestion complete (incremental + idempotent)");
  } catch (err) {
    // ─────────────────────────────────────────────
    // 9️⃣ Handle failure properly
    // ─────────────────────────────────────────────
    const durationMs = Date.now() - startTime;

    await pool.query(
      `
      UPDATE etl_runs
      SET status = 'failed',
          finished_at = NOW(),
          duration_ms = $1,
          error_message = $2
      WHERE id = $3
      `,
      [durationMs, err.message, runId]
    );

    await pool.query(
      `
      INSERT INTO etl_checkpoint (source, last_run, status)
      VALUES ($1, $2, 'failed')
      ON CONFLICT (source)
      DO UPDATE SET
        status = 'failed',
        updated_at = NOW()
      `,
      [SOURCE, lastRun]
    );

    throw err;
  }
}

module.exports = ingestCSV;
