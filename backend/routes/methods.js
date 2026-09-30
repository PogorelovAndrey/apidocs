'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

const METHODS_DIR = path.join(__dirname, '..', 'data', 'methods');
const METHOD_INDEX_FILE = path.join(__dirname, '..', 'data', 'methodIndex.json');
const PROJECTS_FILE = path.join(__dirname, '..', 'data', 'projects.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function methodsFilePath(projectId) {
  return path.join(METHODS_DIR, `${projectId}.json`);
}

function ensureMethodsFile(projectId) {
  const filePath = methodsFilePath(projectId);
  if (!fs.existsSync(filePath)) {
    writeJSON(filePath, []);
  }
  return filePath;
}

function projectExists(projectId) {
  try {
    const projects = readJSON(PROJECTS_FILE);
    return projects.some((p) => p.id === projectId);
  } catch {
    return false;
  }
}

// ─── Validators ───────────────────────────────────────────────────────────────

const methodValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('method')
    .trim()
    .notEmpty()
    .isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
    .withMessage('method must be a valid HTTP verb'),
  body('url').trim().notEmpty().withMessage('url is required'),
  body('description').optional(),
  body('headers').optional().isArray().withMessage('headers must be an array'),
  body('queryParams').optional().isArray().withMessage('queryParams must be an array'),
  body('pathParams').optional().isArray().withMessage('pathParams must be an array'),
  body('body').optional(),
  body('auth').optional().isObject().withMessage('auth must be an object'),
  body('responses').optional().isArray().withMessage('responses must be an array'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/projects/:projectId/methods
 * Returns summary list (id, projectId, name, method, url, createdAt, updatedAt).
 */
router.get('/projects/:projectId/methods', authenticate, (req, res) => {
  const { projectId } = req.params;

  if (!projectExists(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  let methods;
  try {
    const filePath = ensureMethodsFile(projectId);
    methods = readJSON(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read methods' });
  }

  const summaries = methods.map(({ id, projectId, name, method, url, createdAt, updatedAt }) => ({
    id,
    projectId,
    name,
    method,
    url,
    createdAt,
    updatedAt,
  }));

  return res.json(summaries);
});

/**
 * POST /api/projects/:projectId/methods
 * Admin only. Creates a new method under the given project.
 */
router.post('/projects/:projectId/methods', authenticate, requireAdmin, methodValidators, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { projectId } = req.params;

  if (!projectExists(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  let methods;
  try {
    const filePath = ensureMethodsFile(projectId);
    methods = readJSON(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read methods' });
  }

  const now = new Date().toISOString();
  const newMethod = {
    id: uuidv4(),
    projectId,
    name: (req.body.name || '').trim(),
    method: (req.body.method || '').trim().toUpperCase(),
    url: (req.body.url || '').trim(),
    description: req.body.description || '',
    headers: req.body.headers || [],
    queryParams: req.body.queryParams || [],
    pathParams: req.body.pathParams || [],
    body: req.body.body || '',
    auth: req.body.auth || {
      type: 'none',
      token: '',
      apiKey: '',
      apiKeyName: 'X-API-Key',
      username: '',
      password: '',
    },
    responses: req.body.responses || [],
    createdAt: now,
    updatedAt: now,
  };

  methods.push(newMethod);

  try {
    const filePath = methodsFilePath(projectId);
    writeJSON(filePath, methods);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save method' });
  }

  // Update method index
  try {
    const index = readJSON(METHOD_INDEX_FILE);
    index[newMethod.id] = projectId;
    writeJSON(METHOD_INDEX_FILE, index);
  } catch (err) {
    console.error('Warning: could not update method index:', err.message);
  }

  return res.status(201).json(newMethod);
});

/**
 * GET /api/methods/:id
 * Returns the full method object.
 */
router.get('/methods/:id', authenticate, (req, res) => {
  const { id } = req.params;

  let index;
  try {
    index = readJSON(METHOD_INDEX_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read method index' });
  }

  const projectId = index[id];
  if (!projectId) {
    return res.status(404).json({ error: 'Method not found' });
  }

  let methods;
  try {
    const filePath = methodsFilePath(projectId);
    methods = readJSON(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read methods' });
  }

  const method = methods.find((m) => m.id === id);
  if (!method) {
    return res.status(404).json({ error: 'Method not found' });
  }

  return res.json(method);
});

/**
 * PUT /api/methods/:id
 * Admin only. Updates an existing method.
 */
router.put('/methods/:id', authenticate, requireAdmin, methodValidators, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  let index;
  try {
    index = readJSON(METHOD_INDEX_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read method index' });
  }

  const projectId = index[id];
  if (!projectId) {
    return res.status(404).json({ error: 'Method not found' });
  }

  let methods;
  try {
    const filePath = methodsFilePath(projectId);
    methods = readJSON(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read methods' });
  }

  const idx = methods.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Method not found' });
  }

  const existing = methods[idx];
  methods[idx] = {
    ...existing,
    name: (req.body.name || existing.name).trim(),
    method: ((req.body.method || existing.method).trim()).toUpperCase(),
    url: (req.body.url || existing.url).trim(),
    description: req.body.description !== undefined ? req.body.description : existing.description,
    headers: req.body.headers !== undefined ? req.body.headers : existing.headers,
    queryParams: req.body.queryParams !== undefined ? req.body.queryParams : existing.queryParams,
    pathParams: req.body.pathParams !== undefined ? req.body.pathParams : existing.pathParams,
    body: req.body.body !== undefined ? req.body.body : existing.body,
    auth: req.body.auth !== undefined ? req.body.auth : existing.auth,
    responses: req.body.responses !== undefined ? req.body.responses : existing.responses,
    updatedAt: new Date().toISOString(),
  };

  try {
    const filePath = methodsFilePath(projectId);
    writeJSON(filePath, methods);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save method' });
  }

  return res.json(methods[idx]);
});

/**
 * DELETE /api/methods/:id
 * Admin only. Removes a method and cleans up the index.
 */
router.delete('/methods/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;

  let index;
  try {
    index = readJSON(METHOD_INDEX_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read method index' });
  }

  const projectId = index[id];
  if (!projectId) {
    return res.status(404).json({ error: 'Method not found' });
  }

  let methods;
  try {
    const filePath = methodsFilePath(projectId);
    methods = readJSON(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read methods' });
  }

  const idx = methods.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Method not found' });
  }

  methods.splice(idx, 1);

  try {
    const filePath = methodsFilePath(projectId);
    writeJSON(filePath, methods);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save methods' });
  }

  // Remove from index
  delete index[id];
  try {
    writeJSON(METHOD_INDEX_FILE, index);
  } catch (err) {
    console.error('Warning: could not update method index:', err.message);
  }

  return res.json({ success: true });
});

module.exports = router;
