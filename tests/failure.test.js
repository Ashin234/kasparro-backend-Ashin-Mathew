const request = require("supertest");
const app = require("../api/app");
const { pool } = require("../core/db");

describe("Failure Handling", () => {
  test("DB failure returns error", async () => {
    jest.spyOn(pool, "query").mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(500);

    pool.query.mockRestore();
  });
});
