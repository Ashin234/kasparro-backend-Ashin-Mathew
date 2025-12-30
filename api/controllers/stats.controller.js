const statsService = require("../../services/stats.service");

exports.getStats = async (req, res) => {
  try {
    const stats = await statsService.getStats();

    res.json({
      status: "ok",
      stats,
    });
  } catch (err) {
    console.error(" /stats failed:", err.message);
    res.status(500).json({ status: "error" });
  }
};
