const request = require("supertest");

/**
 * Load environment variables for tests
 */
require("dotenv").config();

/**
 * MOCK core/db BEFORE importing app
 */
jest.mock("../core/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require("../core/db");
const app = require("../api/app");

describe("API Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * --------------------
   * PUBLIC ROUTES
   * --------------------
   */

  test("GET /health returns system status", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // SELECT 1
      .mockResolvedValueOnce({
        rows: [{ last_run: new Date() }],
      });

    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("etl_last_checkpoint");
  });

  /**
   * --------------------
   * PROTECTED ROUTES
   * --------------------
   */

  test("GET /stats returns ETL stats (authorized)", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          total_records: 100,
          last_run: new Date(),
        },
      ],
    });

    const res = await request(app)
      .get("/stats")
      .set("x-api-key", process.env.API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("stats");
  });

  test("GET /data returns paginated results (authorized)", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ symbol: "BTC", price_usd: 45000 }],
    });

    const res = await request(app)
      .get("/data?limit=5")
      .set("x-api-key", process.env.API_KEY);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  /**
   * --------------------
   * AUTH FAILURE TESTS
   * --------------------
   */

  test("GET /data without API key returns 401", async () => {
    const res = await request(app).get("/data");
    expect(res.statusCode).toBe(401);
  });

  test("GET /stats with invalid API key returns 401", async () => {
    const res = await request(app)
      .get("/stats")
      .set("x-api-key", "invalid_key");

    expect(res.statusCode).toBe(401);
  });
});
