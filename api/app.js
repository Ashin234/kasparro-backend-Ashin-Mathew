// require("dotenv").config();
const express = require("express");
const requestId = require("./middlewares/requestId");

const dataRoutes = require("./routes/data.routes");
const healthRoutes = require("./routes/health.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

app.use(express.json());
app.use(requestId);

app.use("/data", dataRoutes);
app.use("/health", healthRoutes);
app.use("/stats", statsRoutes);

module.exports = app;
