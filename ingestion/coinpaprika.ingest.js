require("dotenv").config();
const axios = require("axios");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "coinpaprika";

async function ingestCoinPaprika() {

  // Start ETL run
 
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

  //  Read checkpoint

  const checkpointRes = await pool.query(
    "SELECT last_run FROM etl_checkpoint WHERE source = $1",
    [SOURCE]
  );

  const lastRun =
    checkpointRes.rows[0]?.last_run || new Date("1970-01-01T00:00:00Z");

  let maxProcessedTimestamp = lastRun;

  try {

    //  Fetch API data

    const response = await axios.get(
      "https://api.coinpaprika.com/v1/tickers",
      { timeout: 10000 }
    );

    //  Process data incrementally
 
    for (const coin of response.data) {
      const updatedAt = new Date(coin.last_updated);

      // Skip already-processed records
      if (updatedAt <= lastRun) continue;

      //  Store RAW data (audit)

      await pool.query(
        `
        INSERT INTO raw_crypto (source, payload)
        VALUES ($1, $2)
        `,
        [SOURCE, coin]
      );

      //  Normalize & validate

      const cleanData = schema.parse({
        coin_id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price_usd: coin.quotes.USD.price,
        source: SOURCE,
        last_updated: updatedAt,
      });

      //  Idempotent insert into clean table
    
      await pool.query(
        `
        INSERT INTO clean_crypto_prices
        (coin_id, name, symbol, price_usd, source, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (coin_id, source, last_updated)
        DO NOTHING
        `,
        [
          cleanData.coin_id,
          cleanData.name,
          cleanData.symbol,
          cleanData.price_usd,
          cleanData.source,
          cleanData.last_updated,
        ]
      );

      // Count successfully processed records
      processedCount++;

      // Track latest timestamp
      if (updatedAt > maxProcessedTimestamp) {
        maxProcessedTimestamp = updatedAt;
      }
    }

    //  Update checkpoint AFTER successful run

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

    //  Mark ETL run as SUCCESS
    
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

    console.log(" CoinPaprika ingestion complete");
  } catch (err) {

    // Handle failure properly
   
    const durationMs = Date.now() - startTime;

    // Mark ETL run failed
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

    // Mark checkpoint failed (do NOT advance last_run)
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
