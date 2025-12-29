const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "csv";

function ingestCSV() {
  return new Promise((resolve, reject) => {
    console.log(" Running CSV ingestion");

    //  Safe absolute path
    const csvPath = path.join(__dirname, "../data/crypto_prices.csv");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          //  Store RAW
          await pool.query(
            "INSERT INTO raw_csv_crypto (payload) VALUES ($1)",
            [row]
          );

          //  Validate & normalize
          const clean = schema.parse({
            coin_id: row.coin_id,
            name: row.name,
            symbol: row.symbol,
            price_usd: Number(row.price_usd),
            source: SOURCE,
            last_updated: new Date(row.last_updated),
          });

          //  Idempotent insert
          await pool.query(
            `
            INSERT INTO clean_crypto_prices
            (coin_id, name, symbol, price_usd, source, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (coin_id, source)
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
          reject(err); // propagate error to ETL
        }
      })
      .on("end", () => {
        console.log( "CSV ingestion complete");
        resolve(); // signal completion
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

module.exports = ingestCSV;
