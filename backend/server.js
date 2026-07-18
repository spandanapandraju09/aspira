// backend/server.js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialise or open the SQLite DB in the project folder
const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

// Example schema – change to match your actual data model
// This creates a simple "jobs" table that mimics the Supabase "jobs" table used elsewhere.
// You can add more tables as needed for the jury demonstration.
db.prepare(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    posted_at TEXT
  )
`).run();

// ----- READ‑ONLY endpoint -----
app.get('/jobs', (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs').all();
  res.json(rows);
});

// Optional: a seed endpoint to populate demo data (only for local demo)
app.post('/seed', (req, res) => {
  const { title, company, location } = req.body;
  const stmt = db.prepare('INSERT INTO jobs (title, company, location, posted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
  stmt.run(title, company, location);
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Backend API listening on http://localhost:${PORT}`));
