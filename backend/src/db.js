const { Pool } = require("pg");

const useSsl =
  process.env.DATABASE_SSL === "true" ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("supabase.co"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
