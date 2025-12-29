const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "csv";

function ingestCSV() {
  return new Promise((resolve, reject) => {
    console.log(" Running CSV ingestion");

    const csvPath = path.join(__dirname, "../data/crypto_prices.csv");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          //  Store RAW (unified raw table)
          await pool.query(
            "INSERT INTO raw_crypto (source, payload) VALUES ($1, $2)",
            [SOURCE, row]
          );

          //  Normalize & validate
          const clean = schema.parse({
            coin_id: row.coin_id,
            name: row.name,
            symbol: row.symbol,
            price_usd: Number(row.price_usd),
            source: SOURCE,
            last_updated: new Date(row.last_updated),
          });

          //  Idempotent insert (no duplicates)
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
        } catch (err) {
          reject(err);
        }
      })
      .on("end", () => {
        console.log(" CSV ingestion complete");
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

module.exports = ingestCSV;
