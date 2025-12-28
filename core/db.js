// require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const DATABASE_URL="postgres://postgres:sama123%40@127.0.0.1:5433/etl_db";

const pool = new Pool({
  connectionString: DATABASE_URL
});

// (async () => {
//   try {
//     const res = await pool.query("SELECT NOW()");
//     console.log(" DB connected:", res.rows[0]);
//   } catch (err) {
//     console.error(" DB connection failed:", err.message);
//   }
// })();

module.exports = pool;
