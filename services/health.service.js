const { pool } = require("../core/db");

async function checkHealth() {
  // Check DB connectivity
  await pool.query("SELECT 1");

  // Get last ETL checkpoint
  const checkpoint = await pool.query(
    "SELECT source, last_run FROM etl_checkpoint ORDER BY last_run DESC LIMIT 1"
  );

  return {
    status: "ok",
    db: "connected",
    etl_last_checkpoint: checkpoint.rows[0] || null,
  };
}

module.exports = {
  checkHealth,
};
