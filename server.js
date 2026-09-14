const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Read DB helper
function readDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return null;
}

// Write DB helper
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// GET /api/db
app.get('/api/db', (req, res) => {
  const data = readDb();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// POST /api/db (Full sync or update)
app.post('/api/db', (req, res) => {
  const newDb = req.body;
  if (!newDb || typeof newDb !== 'object') {
    return res.status(400).json({ error: 'Invalid database payload' });
  }
  const success = writeDb(newDb);
  if (success) {
    res.json({ success: true, message: 'Database saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to write database' });
  }
});

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // Default admin credentials (can be updated in settings)
  if ((username === 'admin@kivanta.com' || username === 'admin') && password === 'Kivanta2026!') {
    res.json({
      success: true,
      token: 'kivanta_admin_token_' + Date.now(),
      user: { name: 'Kivanta Administrator', email: 'admin@kivanta.com', role: 'Super Admin' }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin username or password' });
  }
});

app.listen(PORT, () => {
  console.log(`Kivanta Advisory Platform Server running at http://localhost:${PORT}`);
});
