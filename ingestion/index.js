const { waitForDB } = require("../core/db");
const ingestCoinPaprika = require("./coinpaprika.ingest");
const ingestCSV = require("./csv.ingest");
const ingestLocalCSV = require("./localcsv.ingest");

async function runETL() {
  console.log(" ETL started");

  //  Ensure DB is ready
  await waitForDB();

  //  Run CoinPaprika ingestion safely
  try {
    await ingestCoinPaprika();
    console.log(" CoinPaprika ingestion done");
  } catch (err) {
    console.error(" CoinPaprika ingestion failed:", err.message);
  }

  //  Run CSV ingestion safely
  try {
    await ingestCSV();
    console.log(" CSV ingestion done");
  } catch (err) {
    console.error(" CSV ingestion failed:", err.message);
  }

  //  Run Local CSV ingestion safely
  try {
    await ingestLocalCSV();
    console.log(" Local CSV ingestion done");
  } catch (err) {
    console.error(" Local CSV ingestion failed:", err.message);
  }

  console.log(" ETL completed");
}

// 🔑 KEY SAFETY CHECK
if (require.main === module) {
  runETL()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(" ETL failed", err);
      process.exit(1);
    });
}

module.exports = runETL;
