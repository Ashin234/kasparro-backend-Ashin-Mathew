const schema = require("../schemas/unified.schema");

describe("Failure Scenario", () => {
  test("schema rejects invalid data", () => {
    const badData = {
      name: "Bitcoin",
      symbol: "BTC"
      // missing coin_id and price
    };

    expect(() => schema.parse(badData)).toThrow();
  });
});
