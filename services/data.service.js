const { pool } = require("../core/db");

async function getData({ limit, offset, symbol }) {
  let query = "SELECT * FROM clean_crypto_prices";
  const params = [];
  let paramIndex = 1;

  if (symbol) {
    query += ` WHERE symbol = $${paramIndex}`;
    params.push(symbol);
    paramIndex++;
  }

  query += ` ORDER BY last_updated DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  getData,
};
