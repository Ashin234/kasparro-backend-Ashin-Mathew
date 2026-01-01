const CoinSchema = require("../schemas/coin.schema");
const PriceSchema = require("../schemas/price.schema");

describe("ETL Schema Validation", () => {
  /**
   * --------------------
   * Coin Identity Schema
   * --------------------
   */
  test("valid coin identity passes CoinSchema", () => {
    const coin = {
      symbol: "BTC",
      name: "Bitcoin",
    };

    const parsed = CoinSchema.parse(coin);
    expect(parsed.symbol).toBe("BTC");
  });

  test("coin schema fails when symbol is missing", () => {
    const badCoin = {
      name: "Bitcoin",
    };

    expect(() => CoinSchema.parse(badCoin)).toThrow();
  });

  /**
   * --------------------
   * Price Observation Schema
   * --------------------
   */
  test("valid price observation passes PriceSchema", () => {
    const price = {
      price_usd: 45000,
      source: "localcsv",
      last_updated: new Date(),
    };

    const parsed = PriceSchema.parse(price);
    expect(parsed.price_usd).toBe(45000);
  });

  test("invalid price should fail PriceSchema", () => {
    const badPrice = {
      price_usd: "not-a-number",
      source: "csv",
      last_updated: new Date(),
    };

    expect(() => PriceSchema.parse(badPrice)).toThrow();
  });
});
