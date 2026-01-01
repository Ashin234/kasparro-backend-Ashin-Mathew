const { pool } = require("../core/db");

async function checkHealth() {

  // Check DB connectivity
  
  await pool.query("SELECT 1");

  // Get latest ETL checkpoint

  const checkpointRes = await pool.query(`
    SELECT
      source,
      last_run,
      status,
      updated_at
    FROM etl_checkpoint
    ORDER BY last_run DESC NULLS LAST
    LIMIT 1
  `);


  // Get latest ETL run metadata

  const runRes = await pool.query(`
    SELECT
      source,
      status,
      records_processed,
      started_at,
      finished_at,
      duration_ms
    FROM etl_runs
    ORDER BY started_at DESC
    LIMIT 1
  `);

  return {
    status: "ok",
    db: "connected",

    etl: {
      last_checkpoint: checkpointRes.rows[0] || null,
      last_run: runRes.rows[0] || null,
    },
  };
}

module.exports = {
  checkHealth,
};
