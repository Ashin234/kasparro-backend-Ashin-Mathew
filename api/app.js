require("dotenv").config({ quiet: true });

const express = require("express");
const requestId = require("./middlewares/requestId");
const dataRoutes = require("./routes/data.routes");
const healthRoutes = require("./routes/health.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

app.use(express.json());
app.use(requestId);

// home route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend & ETL System is running",
    endpoints: {
      health: "/health",
      stats: "/stats",
      data: "/data",
    },
  });
});

//protected routes
app.use("/data", dataRoutes);
app.use("/stats", statsRoutes);

//public routes
app.use("/health", healthRoutes);

module.exports = app;
