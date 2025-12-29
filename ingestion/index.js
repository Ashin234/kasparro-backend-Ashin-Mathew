const { waitForDB } = require("../core/db");
const ingestCoinPaprika = require("./coinpaprika.ingest");
const ingestCSV = require("./csv.ingest");
const ingestLocalCSV = require("./localcsv.ingest");

async function runETL() {
  console.log("ETL started");

  //  WAIT FOR DB BEFORE RUNNING ETL
  await waitForDB();

  await ingestCoinPaprika();
  console.log("CoinPaprika ingestion done");

  await ingestCSV();
  console.log("CSV ingestion done");

  await ingestLocalCSV();
  console.log("Local CSV ingestion done");

  console.log("ETL completed");
}

module.exports = runETL;
