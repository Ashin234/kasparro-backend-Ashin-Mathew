const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { once } = require("events");
const { pool } = require("../core/db");

//  EVALUATION FIX #1
// Split schemas: identity vs observation
const CoinSchema = require("../schemas/coin.schema");
const PriceSchema = require("../schemas/price.schema");

const SOURCE = "csv";

async function ingestCSV() {
  console.log(" Running CSV ingestion");

  // =========================
  // Start ETL run
  // =========================
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

  // =========================
  // Read checkpoint
  // =========================
  const checkpointRes = await pool.query(
    "SELECT last_run FROM etl_checkpoint WHERE source = $1",
    [SOURCE]
  );

  const lastRun =
    checkpointRes.rows[0]?.last_run || new Date("1970-01-01T00:00:00Z");

  let maxProcessedTimestamp = lastRun;

  try {
    // =========================
    // Read CSV fully
    // =========================
    const csvPath = path.join(__dirname, "../data/crypto_prices.csv");
    const rows = [];

    const stream = fs.createReadStream(csvPath).pipe(csv());

    stream.on("data", (row) => rows.push(row));
    stream.on("error", (err) => {
      throw err;
    });

    await once(stream, "end");

    // =========================
    // Process rows sequentially
    // =========================
    for (const row of rows) {
      const updatedAt = new Date(row.last_updated);

      // Incremental ingestion
      if (updatedAt <= lastRun) continue;

      // =========================
      // Store RAW data (audit/debug)
      // =========================
      await pool.query(
        `
        INSERT INTO raw_crypto (source, payload)
        VALUES ($1, $2)
        `,
        [SOURCE, row]
      );

      // =========================
      //  EVALUATION FIX #2
      // Validate CANONICAL coin identity
      // (Source is NOT part of identity)
      // =========================
      const coinIdentity = CoinSchema.parse({
        symbol: row.symbol,
        name: row.name,
      });

      // =========================
      //  EVALUATION FIX #3
      // Upsert canonical coin
      // BTC / ETH exists ONCE globally
      // =========================
      const coinRes = await pool.query(
        `
        INSERT INTO coins (symbol, name)
        VALUES ($1, $2)
        ON CONFLICT (symbol)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
        [coinIdentity.symbol, coinIdentity.name]
      );

      const canonicalCoinId = coinRes.rows[0].id;

      // =========================
      //  EVALUATION FIX #4
      // Validate price observation
      // (WHAT we saw, WHEN, and FROM WHERE)
      // =========================
      const priceObservation = PriceSchema.parse({
        price_usd: Number(row.price_usd),
        source: SOURCE,
        last_updated: updatedAt,
      });

      // =========================
      //  EVALUATION FIX #5
      // Store observation linked to canonical coin
      // =========================
      await pool.query(
        `
        INSERT INTO coin_prices
        (coin_id, source, price_usd, last_updated)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (coin_id, source, last_updated)
        DO NOTHING
        `,
        [
          canonicalCoinId,
          priceObservation.source,
          priceObservation.price_usd,
          priceObservation.last_updated,
        ]
      );

      processedCount++;

      if (updatedAt > maxProcessedTimestamp) {
        maxProcessedTimestamp = updatedAt;
      }
    }

    // =========================
    // Update checkpoint (SUCCESS)
    // =========================
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

    const durationMs = Date.now() - startTime;

    // =========================
    // Mark ETL run success
    // =========================
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

  } catch (err) {
    // =========================
    // Handle failure
    // =========================
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

    // Do NOT advance checkpoint on failure
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
