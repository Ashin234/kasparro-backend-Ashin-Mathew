const request = require("supertest");

/**
 * Load environment variables for tests
 */
require("dotenv").config({ quiet: true });

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

  test("GET /health returns system health and ETL status", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // SELECT 1 (DB check)
      .mockResolvedValueOnce({
        rows: [
          {
            source: "coinpaprika",
            last_run: new Date(),
            status: "success",
            updated_at: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            source: "coinpaprika",
            status: "success",
            records_processed: 100,
            started_at: new Date(),
            finished_at: new Date(),
            duration_ms: 5000,
          },
        ],
      });

    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("db", "connected");
    expect(res.body).toHaveProperty("etl");
    expect(res.body.etl).toHaveProperty("last_checkpoint");
    expect(res.body.etl).toHaveProperty("last_run");
  });

  /**
   * --------------------
   * PROTECTED ROUTES
   * --------------------
   */

  test("GET /stats returns ETL statistics (authorized)", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            success_runs: "5",
            failed_runs: "1",
            last_run: new Date(),
            last_success: new Date(),
            last_failure: null,
            total_records_processed: "500",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            source: "coinpaprika",
            status: "success",
            records_processed: 300,
            started_at: new Date(),
            finished_at: new Date(),
            duration_ms: 4000,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            source: "coinpaprika",
            last_run: new Date(),
            status: "success",
            updated_at: new Date(),
          },
        ],
      });

    const res = await request(app)
      .get("/stats")
      .set("x-api-key", process.env.API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("stats");
    expect(res.body.stats).toHaveProperty("summary");
    expect(res.body.stats).toHaveProperty("latest_runs_by_source");
    expect(res.body.stats).toHaveProperty("checkpoints");

  });

  test("GET /data returns paginated results (authorized)", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          symbol: "BTC",
          name: "Bitcoin",
          source: "coinpaprika",
          price_usd: 45000,
          last_updated: new Date(),
        },
      ],
    });

    const res = await request(app)
      .get("/data?limit=5")
      .set("x-api-key", process.env.API_KEY);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("api_latency_ms");
    expect(res.body).toHaveProperty("request_id");
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
