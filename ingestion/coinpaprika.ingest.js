require("dotenv").config();
const axios = require("axios");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "coinpaprika";

async function ingestCoinPaprika() {
  //  Read checkpoint
  const checkpoint = await pool.query(
    "SELECT last_run FROM etl_checkpoint WHERE source = $1",
    [SOURCE]
  );

  const lastRun = checkpoint.rows[0]?.last_run || new Date(0);

  //  Fetch API data
  const response = await axios.get(
     "https://api.coinpaprika.com/v1/tickers",
   {
    timeout: 10000,
   }
  );

  for (const coin of response.data) {
    //  Store RAW data
    await pool.query(
      "INSERT INTO raw_coinpaprika (payload) VALUES ($1)",
      [coin]
    );

    const updatedAt = new Date(coin.last_updated);

    //  Incremental check
    if (updatedAt <= lastRun) continue;

    //  Normalize & validate
    const cleanData = schema.parse({
      coin_id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price_usd: coin.quotes.USD.price,
      source: SOURCE,
      last_updated: updatedAt,
    });

    //  Idempotent insert
    await pool.query(
      `
      INSERT INTO clean_crypto_prices 
      (coin_id, name, symbol, price_usd, source, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (coin_id, source)
      DO UPDATE SET
        price_usd = EXCLUDED.price_usd,
        last_updated = EXCLUDED.last_updated
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
  }

  //  Update checkpoint
  await pool.query(
    `
    INSERT INTO etl_checkpoint (source, last_run)
    VALUES ($1, NOW())
    ON CONFLICT (source)
    DO UPDATE SET last_run = NOW()
    `,
    [SOURCE]
  );

  console.log(" CoinPaprika ingestion complete");
}

module.exports = ingestCoinPaprika;
