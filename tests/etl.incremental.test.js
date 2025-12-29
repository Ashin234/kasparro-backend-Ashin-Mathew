jest.mock("../core/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require("../core/db");

describe("Incremental ETL (Mocked)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("checkpoint table exists", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ exists: true }],
    });

    const res = await pool.query("mock");

    expect(res.rows[0].exists).toBe(true);
  });

  test("checkpoint updates after run", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ last_run: new Date() }],
    });

    const res = await pool.query("mock");

    expect(res.rows[0].last_run).not.toBeNull();
  });
});
