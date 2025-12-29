require("dotenv").config();

const express = require("express");
const requestId = require("./middlewares/requestId");
const runETL = require("../ingestion/index");

const dataRoutes = require("./routes/data.routes");
const healthRoutes = require("./routes/health.routes");

const app = express();
app.use(express.json());
app.use(requestId);

app.use("/data", dataRoutes);
app.use("/health", healthRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 🔥 Run ETL BEFORE starting API
    await runETL();

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

startServer();
