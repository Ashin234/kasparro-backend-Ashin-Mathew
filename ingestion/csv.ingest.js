const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { once } = require("events");
const { pool } = require("../core/db");
const schema = require("../schemas/unified.schema");

const SOURCE = "csv";

async function ingestCSV() {
  console.log("➡️ Running CSV ingestion (idempotent)");

  const csvPath = path.join(__dirname, "../data/crypto_prices.csv");
  const rows = [];

  // 1️⃣ Read CSV fully
  const stream = fs.createReadStream(csvPath).pipe(csv());

  stream.on("data", (row) => rows.push(row));
  stream.on("error", (err) => {
    throw err;
  });

  await once(stream, "end");

  // 2️⃣ Process rows sequentially
  for (const row of rows) {
    const updatedAt = new Date(row.last_updated);

    // 3️⃣ Store RAW (audit/debug)
    await pool.query(
      "INSERT INTO raw_crypto (source, payload) VALUES ($1, $2)",
      [SOURCE, row]
    );

    // 4️⃣ Normalize & validate
    const clean = schema.parse({
      coin_id: row.coin_id,
      name: row.name,
      symbol: row.symbol,
      price_usd: Number(row.price_usd),
      source: SOURCE,
      last_updated: updatedAt,
    });

    // 5️⃣ Idempotent insert (NO duplicates)
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

  console.log("✅ CSV ingestion complete (idempotent)");
}

module.exports = ingestCSV;
