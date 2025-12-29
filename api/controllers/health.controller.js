const healthService = require("../../services/health.service");

exports.healthCheck = async (req, res) => {
  try {
    const status = await healthService.checkHealth();
    res.json(status);
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "disconnected",
      error: err.message,
    });
  }
};
