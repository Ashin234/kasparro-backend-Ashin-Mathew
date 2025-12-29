const { pool } = require("../../core/db");

exports.healthCheck = async (req, res) => {
  try {
    // Check DB connectivity
    await pool.query("SELECT 1");

    // Get last ETL checkpoint
    const checkpoint = await pool.query(
      "SELECT source, last_run FROM etl_checkpoint ORDER BY last_run DESC LIMIT 1"
    );

    res.json({
      status: "ok",
      db: "connected",
      etl_last_checkpoint: checkpoint.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "disconnected",
      error: err.message,
    });
  }
};
