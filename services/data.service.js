const { pool } = require("../core/db");

async function getData({ limit = 50, offset = 0, symbol }) {
  const params = [];
  let paramIndex = 1;

  let query = `
    SELECT
      c.symbol,
      c.name,
      p.source,
      p.price_usd,
      p.last_updated
    FROM coin_prices p
    JOIN coins c ON p.coin_id = c.id
  `;

  // 🔧 EVALUATION FIX #1
  // Filter by canonical coin identity (symbol lives in coins)
  if (symbol) {
    query += ` WHERE c.symbol = $${paramIndex}`;
    params.push(symbol);
    paramIndex++;
  }

  // 🔧 EVALUATION FIX #2
  // Order by observation timestamp (not ingestion order)
  query += `
    ORDER BY p.last_updated DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  getData,
};
