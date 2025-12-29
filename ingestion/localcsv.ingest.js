const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "localcsv";

async function ingestLocalCSV() {
  const rows = [];

  return new Promise((resolve, reject) => {
    console.log(" Running local CSV ingestion");

    // Docker-safe absolute path
    const csvPath = path.join(__dirname, "../data/crypto_local_feed.csv");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          for (const row of rows) {
            //  Store RAW data (unified raw table)
            await pool.query(
              "INSERT INTO raw_crypto (source, payload) VALUES ($1, $2)",
              [SOURCE, row]
            );

            // Normalize & validate
            const clean = schema.parse({
              coin_id: row.asset_id,
              name: row.asset_name,
              symbol: row.ticker,
              price_usd: Number(row.price),
              source: SOURCE,
              last_updated: new Date(row.last_seen),
            });

            //  Idempotent insert
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
          }

          console.log(" Local CSV ingestion complete");
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(err));
  });
}

module.exports = ingestLocalCSV;
