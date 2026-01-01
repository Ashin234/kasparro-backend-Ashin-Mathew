const { pool } = require("../core/db");

async function getStats() {

  // Overall ETL statistics

  const overallRes = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'success') AS success_runs,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
      MAX(started_at) AS last_run,
      MAX(finished_at) FILTER (WHERE status = 'success') AS last_success,
      MAX(finished_at) FILTER (WHERE status = 'failed') AS last_failure,
      COALESCE(SUM(records_processed), 0) AS total_records_processed
    FROM etl_runs
  `);


  // Latest run per source

  const perSourceRunsRes = await pool.query(`
    SELECT DISTINCT ON (source)
      source,
      status,
      records_processed,
      started_at,
      finished_at,
      duration_ms
    FROM etl_runs
    ORDER BY source, started_at DESC
  `);


  // Checkpoint status per source

  const checkpointRes = await pool.query(`
    SELECT
      source,
      last_run,
      status,
      updated_at
    FROM etl_checkpoint
    ORDER BY source
  `);

  return {
    summary: overallRes.rows[0],
    latest_runs_by_source: perSourceRunsRes.rows,
    checkpoints: checkpointRes.rows,
  };
}

module.exports = {
  getStats,
};
