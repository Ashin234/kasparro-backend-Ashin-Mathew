require("dotenv").config();
const axios = require("axios");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "coinpaprika";

async function ingestCoinPaprika() {
  // 1️⃣ Read checkpoint (use last_run)
  const checkpointRes = await pool.query(
    "SELECT last_run FROM etl_checkpoint WHERE source = $1",
    [SOURCE]
  );

  const lastRun =
    checkpointRes.rows[0]?.last_run || new Date("1970-01-01T00:00:00Z");

  let maxProcessedTimestamp = lastRun;

  try {
    // 2️⃣ Fetch API data
    const response = await axios.get(
      "https://api.coinpaprika.com/v1/tickers",
      { timeout: 10000 }
    );

    for (const coin of response.data) {
      const updatedAt = new Date(coin.last_updated);

      // 3️⃣ Incremental filter
      if (updatedAt <= lastRun) continue;

      // 4️⃣ Store RAW (audit)
      await pool.query(
        `
        INSERT INTO raw_crypto (source, payload)
        VALUES ($1, $2)
        `,
        [SOURCE, coin]
      );

      // 5️⃣ Normalize & validate
      const cleanData = schema.parse({
        coin_id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price_usd: coin.quotes.USD.price,
        source: SOURCE,
        last_updated: updatedAt,
      });

      // 6️⃣ Idempotent insert
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

      // 7️⃣ Track progress
      if (updatedAt > maxProcessedTimestamp) {
        maxProcessedTimestamp = updatedAt;
      }
    }

    // 8️⃣ Update checkpoint AFTER success
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

    console.log("✅ CoinPaprika ingestion complete");
  } catch (err) {
    // 9️⃣ Mark failure
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
