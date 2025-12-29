const dataService = require("../../services/data.service");

exports.getData = async (req, res) => {
  const start = Date.now();

  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  const symbol = req.query.symbol;

  try {
    const data = await dataService.getData({ limit, offset, symbol });

    const latency = Date.now() - start;

    res.json({
      request_id: req.requestId,
      api_latency_ms: latency,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};
