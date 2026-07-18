// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Initialise the PostgreSQL connection pool
// Connect using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Example schema – change to match your actual data model
// This creates a simple "jobs" table that mimics the Supabase "jobs" table used elsewhere.
// You can add more tables as needed for the jury demonstration.
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        location TEXT,
        posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database tables verified/created successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};
initDb();

// ----- READ‑ONLY endpoint -----
app.get('/jobs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM jobs');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Optional: a seed endpoint to populate demo data (only for local demo)
app.post('/seed', async (req, res) => {
  const { title, company, location } = req.body;
  try {
    await pool.query(
      'INSERT INTO jobs (title, company, location) VALUES ($1, $2, $3)',
      [title, company, location]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error seeding job:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend API listening on http://localhost:${PORT}`));
