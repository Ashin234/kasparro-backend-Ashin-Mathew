const schema = require("../schemas/unified.schema");

describe("ETL Schema Validation", () => {
  test("valid crypto record passes schema", () => {
    const data = {
      coin_id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      price_usd: 45000,
      source: "localcsv",
      last_updated: new Date(),
    };

    const parsed = schema.parse(data);
    expect(parsed.symbol).toBe("BTC");
  });

  test("invalid price should fail", () => {
    const badData = {
      coin_id: "eth",
      name: "Ethereum",
      symbol: "ETH",
      price_usd: "not-a-number",
      source: "csv",
      last_updated: new Date(),
    };

    expect(() => schema.parse(badData)).toThrow();
  });
});
