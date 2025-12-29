const { pool } = require("../../core/db");

exports.getData = async (req, res) => {
  const start = Date.now();

  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  const symbol = req.query.symbol;

  let query = "SELECT * FROM clean_crypto_prices";
  let params = [];
  let paramIndex = 1;

  if (symbol) {
    query += ` WHERE symbol = $${paramIndex}`;
    params.push(symbol);
    paramIndex++;
  }

  query += ` ORDER BY last_updated DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  const latency = Date.now() - start;

  res.json({
    request_id: req.requestId,
    api_latency_ms: latency,
    count: result.rows.length,
    data: result.rows,
  });
};
