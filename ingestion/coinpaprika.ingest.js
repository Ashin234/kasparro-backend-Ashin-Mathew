require("dotenv").config({ quiet: true });
const axios = require("axios");
const { pool } = require("../core/db");

// 🔧 EVALUATION FIX: split schemas
const CoinSchema = require("../schemas/coin.schema");
const PriceSchema = require("../schemas/price.schema");

const SOURCE = "coinpaprika";

async function ingestCoinPaprika() {
  console.log(" Running CoinPaprika ingestion");
  const startTime = Date.now();
  let processedCount = 0;

  // =========================
  // Start ETL run
  // =========================
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
    // Fetch API data
    // =========================
    const response = await axios.get(
      "https://api.coinpaprika.com/v1/tickers",
      { timeout: 10000 }
    );

    // =========================
    // Process records
    // =========================
    for (const coin of response.data) {
      const updatedAt = new Date(coin.last_updated);

      // Incremental ingestion
      if (updatedAt <= lastRun) continue;

      // =========================
      // Store RAW data (audit)
      // =========================
      await pool.query(
        `
        INSERT INTO raw_crypto (source, payload)
        VALUES ($1, $2)
        `,
        [SOURCE, coin]
      );

      // =========================
      //  EVALUATION FIX #1
      // Validate CANONICAL coin identity
      // =========================
      const coinIdentity = CoinSchema.parse({
        symbol: coin.symbol,
        name: coin.name,
      });

      // =========================
      //  EVALUATION FIX #2
      // Upsert canonical coin
      // ONE coin per symbol (BTC exists once)
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
      //  EVALUATION FIX #3
      // Validate price observation (NOT identity)
      // =========================
      const priceObservation = PriceSchema.parse({
        price_usd: coin.quotes.USD.price,
        source: SOURCE,
        last_updated: updatedAt,
      });

      // =========================
      //  EVALUATION FIX #4
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
    const durationMs = Date.now() - startTime;

    // =========================
    // Mark ETL run failed
    // =========================
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

module.exports = ingestCoinPaprika;
