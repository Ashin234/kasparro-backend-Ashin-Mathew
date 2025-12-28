const express = require("express");
const requestId = require("./middlewares/requestId");

const dataRoutes = require("./routes/data.routes");
const healthRoutes = require("./routes/health.routes");

const app = express();
app.use(express.json());
app.use(requestId);

app.use("/data", dataRoutes);
app.use("/health", healthRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
