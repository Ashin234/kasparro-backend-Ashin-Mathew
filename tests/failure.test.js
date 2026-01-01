const request = require("supertest");
const app = require("../api/app");
const { pool } = require("../core/db");

describe("Failure Handling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("DB failure causes /health to return 500", async () => {
    // 🔧 Simulate DB being completely unavailable
    jest.spyOn(pool, "query").mockRejectedValue(new Error("DB down"));

    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error");

    // Optional but nice: ensure error message is generic
    expect(res.body.error).toBeDefined();
  });
});
