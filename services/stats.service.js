const { pool } = require("../core/db");

async function getStats() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'success') AS success_runs,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
      MAX(started_at) AS last_run,
      MAX(finished_at) FILTER (WHERE status = 'success') AS last_success,
      MAX(finished_at) FILTER (WHERE status = 'failed') AS last_failure,
      COALESCE(SUM(records_processed), 0) AS total_records_processed,
      MAX(duration_ms) AS last_duration_ms
    FROM etl_runs
  `);

  return result.rows[0];
}

module.exports = {
  getStats,
};
