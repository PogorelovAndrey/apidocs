'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const { readJSON } = require('../utils/fileStore');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-secret-key';
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, user: { id, username, role } }
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('username is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    let users;
    try {
      users = readJSON(USERS_FILE);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read user store' });
    }

    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  }
);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (no password).
 */
router.get('/me', authenticate, (req, res) => {
  return res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
  });
});

module.exports = router;
