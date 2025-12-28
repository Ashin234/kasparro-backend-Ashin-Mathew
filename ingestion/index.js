const ingestCoinPaprika = require("./coinpaprika.ingest");
const ingestCSV = require("./csv.ingest");

async function runETL() {
  await ingestCoinPaprika();
  console.log(`running csv ingestion`);
  await ingestCSV();
}

runETL();

