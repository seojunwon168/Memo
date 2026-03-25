const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query(`
  CREATE TABLE IF NOT EXISTS memos (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL
  )
`).catch(err => console.error("DB Init Error:", err));

module.exports = {
  query: (text, params) => pool.query(text, params),
};
