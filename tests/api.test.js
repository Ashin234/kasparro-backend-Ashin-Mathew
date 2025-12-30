const request = require("supertest");

/**
 *  MOCK core/db BEFORE importing app
 * We must mock pool.query because the app uses pool
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

  test("GET /health returns system status", async () => {
    // /health usually runs 2 queries:
    // 1. SELECT 1 (db check)
    // 2. SELECT last_run FROM etl_checkpoint
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // DB check
      .mockResolvedValueOnce({
        rows: [{ last_run: new Date() }],
      });

    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("etl_last_checkpoint");
  });

  test("GET /stats returns ETL stats", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          total_records: 100,
          last_run: new Date(),
        },
      ],
    });

    const res = await request(app).get("/stats");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("stats");
    expect(res.body.stats).toHaveProperty("total_records");
    expect(res.body.stats).toHaveProperty("last_run");
  });

  test("GET /data returns paginated results", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ symbol: "BTC", price_usd: 45000 }],
    });

    const res = await request(app).get("/data?limit=5");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});
