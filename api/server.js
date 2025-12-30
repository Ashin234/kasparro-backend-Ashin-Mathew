require("dotenv").config();

const app = require("./app");
const runETL = require("../ingestion/index");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    //  Run ETL BEFORE starting API
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
