'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');
const MAX_HISTORY = 500;

/**
 * GET /api/history?limit=50&offset=0
 * Returns paginated history entries, newest first.
 * Response: { items: [...], total: N }
 */
router.get('/', authenticate, (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  let history;
  try {
    history = readJSON(HISTORY_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read history' });
  }

  const total = history.length;
  const items = history.slice(offset, offset + limit);

  return res.json({ items, total });
});

/**
 * POST /api/history
 * Saves a history entry. Caps the store at MAX_HISTORY entries (removes oldest).
 * Body: history entry object (see API contract for shape).
 * Returns: saved entry.
 */
router.post('/', authenticate, (req, res) => {
  let history;
  try {
    history = readJSON(HISTORY_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read history' });
  }

  const entry = {
    id: uuidv4(),
    methodId: req.body.methodId || null,
    methodName: req.body.methodName || '',
    projectName: req.body.projectName || '',
    request: req.body.request || {},
    response: req.body.response || {},
    timestamp: new Date().toISOString(),
    userId: req.user.id,
  };

  // Prepend so newest is first
  history.unshift(entry);

  // Cap at MAX_HISTORY
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }

  try {
    writeJSON(HISTORY_FILE, history);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save history entry' });
  }

  return res.status(201).json(entry);
});

/**
 * DELETE /api/history/:id
 * Deletes a single history entry by id.
 */
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  let history;
  try {
    history = readJSON(HISTORY_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read history' });
  }

  const idx = history.findIndex((h) => h.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'History entry not found' });
  }

  history.splice(idx, 1);

  try {
    writeJSON(HISTORY_FILE, history);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save history' });
  }

  return res.json({ success: true });
});

/**
 * DELETE /api/history
 * Clears all history.
 */
router.delete('/', authenticate, (req, res) => {
  try {
    writeJSON(HISTORY_FILE, []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear history' });
  }

  return res.json({ success: true });
});

module.exports = router;
