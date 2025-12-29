jest.mock("../core/db", () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] })
  },
  waitForDB: jest.fn()
}));

const request = require("supertest");
const app = require("../api/app");

describe("API Health Endpoint", () => {
  test("GET /health returns status OK", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("etl_last_checkpoint");
    expect(res.body).toHaveProperty("status");

  });
});



// const request = require("supertest");
// const app = require("../api/app"); // ✅ IMPORT APP ONLY

// describe("API Health Endpoint", () => {
//   test("GET /health returns status OK", async () => {
//     const res = await request(app).get("/health");

//     expect(res.statusCode).toBe(200);
//     expect(res.body).toHaveProperty("db");
//     expect(res.body).toHaveProperty("etl");
//   });
// });
