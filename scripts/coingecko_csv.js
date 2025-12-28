
const axios = require("axios");
const fs = require("fs");

async function generateCSV() {
  const response = await axios.get(
    "https://api.coingecko.com/api/v3/coins/markets",
    { params: { vs_currency: "usd" } }
  );

  const header = "coin_id,name,symbol,price_usd,last_updated\n";

  const rows = response.data.map(coin =>
    `${coin.id},${coin.name},${coin.symbol},${coin.current_price},${coin.last_updated}`
  );

  fs.writeFileSync("data/crypto_prices.csv", header + rows.join("\n"));

  console.log("✅ CoinGecko CSV generated");
}

generateCSV();
