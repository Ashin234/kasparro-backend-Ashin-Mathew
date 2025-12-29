const { pool } = require("./db");

async function getCheckpoint(source) {
  const res = await pool.query(
    "SELECT source, last_run, status, updated_at FROM etl_checkpoint WHERE source = $1",
    [source]
  );
  return res.rows[0];
}

async function updateCheckpoint(source, lastRun, status = "success") {
  await pool.query(
    `
    INSERT INTO etl_checkpoint (source, last_run, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (source)
    DO UPDATE SET
      last_run = EXCLUDED.last_run,
      status = EXCLUDED.status,
      updated_at = NOW()
    `,
    [source, lastRun, status]
  );
}

module.exports = { getCheckpoint, updateCheckpoint };
