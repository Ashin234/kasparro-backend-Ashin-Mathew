jest.mock("../core/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require("../core/db");
const {
  getCheckpoint,
  updateCheckpoint,
} = require("../core/checkpoint");

describe("ETL Checkpoint Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getCheckpoint returns checkpoint for a source", async () => {
    const mockRow = {
      source: "coinpaprika",
      last_run: new Date("2025-01-01T10:00:00Z"),
      status: "success",
      updated_at: new Date(),
    };

    pool.query.mockResolvedValueOnce({
      rows: [mockRow],
    });

    const checkpoint = await getCheckpoint("coinpaprika");

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(checkpoint).toEqual(mockRow);
  });

  test("updateCheckpoint stores last_run on success", async () => {
    pool.query.mockResolvedValueOnce({});

    const lastRun = new Date("2025-01-01T11:00:00Z");

    await updateCheckpoint("csv", lastRun, "success");

    expect(pool.query).toHaveBeenCalledTimes(1);

    const queryArgs = pool.query.mock.calls[0];
    expect(queryArgs[1]).toEqual(["csv", lastRun, "success"]);
  });

  test("updateCheckpoint does not throw on failure update", async () => {
    pool.query.mockResolvedValueOnce({});

    const lastRun = new Date("2025-01-01T11:00:00Z");

    await expect(
      updateCheckpoint("localcsv", lastRun, "failed")
    ).resolves.not.toThrow();
  });
});
