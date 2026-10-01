'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const { writeJSON, readJSON } = require('./utils/fileStore');

// ─── Data directory bootstrap ─────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const METHODS_DIR = path.join(DATA_DIR, 'methods');

const REQUIRED_FILES = {
  [path.join(DATA_DIR, 'projects.json')]: [],
  [path.join(DATA_DIR, 'history.json')]: [],
  [path.join(DATA_DIR, 'methodIndex.json')]: {},
};

function initDataDirectory() {
  // Ensure base data directory and methods sub-directory exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(METHODS_DIR)) {
    fs.mkdirSync(METHODS_DIR, { recursive: true });
  }

  // Ensure required JSON files exist with sensible defaults
  for (const [filePath, defaultValue] of Object.entries(REQUIRED_FILES)) {
    if (!fs.existsSync(filePath)) {
      writeJSON(filePath, defaultValue);
    }
  }

  // Ensure users.json exists with a default admin account
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    writeJSON(usersFile, [
      {
        id: '1',
        username: 'admin',
        password: passwordHash,
        role: 'admin',
      },
    ]);
    console.log('Created default admin user (username: admin, password: admin123)');
  }
}

// Run bootstrap before anything else
try {
  initDataDirectory();
} catch (err) {
  console.error('Fatal: could not initialise data directory:', err.message);
  process.exit(1);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const methodsRouter = require('./routes/methods');
const historyRouter = require('./routes/history');
const proxyRouter = require('./routes/proxy');

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Mount routers ────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

// Methods router handles both /api/projects/:projectId/methods and /api/methods/:id
app.use('/api', methodsRouter);

app.use('/api/history', historyRouter);

// Proxy router — forwards requests server-side to bypass browser CORS
app.use('/api/proxy', proxyRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API Docs backend running on port ${PORT}`);
});

module.exports = app;
