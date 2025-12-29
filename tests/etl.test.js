const schema = require("../schemas/unified.schema");

describe("ETL Transformation", () => {
  test("valid raw data transforms into clean schema", () => {
    const raw = {
      coin_id: "btc-bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      price_usd: "42000",
      last_updated: "2024-01-01T00:00:00Z",
      source: "csv"
    };

    const clean = schema.parse({
      coin_id: raw.coin_id,
      name: raw.name,
      symbol: raw.symbol,
      price_usd: Number(raw.price_usd),
      source: raw.source,
      last_updated: new Date(raw.last_updated)
    });

    expect(clean.price_usd).toBe(42000);
    expect(clean.symbol).toBe("BTC");
  });
});
