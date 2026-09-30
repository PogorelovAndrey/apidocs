'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const PROJECTS_FILE = path.join(__dirname, '..', 'data', 'projects.json');
const METHODS_DIR = path.join(__dirname, '..', 'data', 'methods');
const METHOD_INDEX_FILE = path.join(__dirname, '..', 'data', 'methodIndex.json');

const projectValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('description').optional().trim(),
];

/**
 * GET /api/projects
 * Returns all projects. Accessible by authenticated users.
 */
router.get('/', authenticate, (req, res) => {
  try {
    const projects = readJSON(PROJECTS_FILE);
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read projects' });
  }
});

/**
 * POST /api/projects
 * Admin only. Creates a new project.
 * Body: { name, description }
 */
router.post('/', authenticate, requireAdmin, projectValidators, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description = '' } = req.body;

  let projects;
  try {
    projects = readJSON(PROJECTS_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read projects' });
  }

  const newProject = {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
  };

  projects.push(newProject);

  try {
    writeJSON(PROJECTS_FILE, projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save project' });
  }

  // Initialise an empty methods file for this project
  const methodsFile = path.join(METHODS_DIR, `${newProject.id}.json`);
  if (!fs.existsSync(methodsFile)) {
    try {
      writeJSON(methodsFile, []);
    } catch (err) {
      // Non-fatal – the file will be created on first method write
    }
  }

  return res.status(201).json(newProject);
});

/**
 * PUT /api/projects/:id
 * Admin only. Updates name and/or description of a project.
 */
router.put('/:id', authenticate, requireAdmin, projectValidators, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description = '' } = req.body;

  let projects;
  try {
    projects = readJSON(PROJECTS_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read projects' });
  }

  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects[idx] = {
    ...projects[idx],
    name: name.trim(),
    description: description.trim(),
  };

  try {
    writeJSON(PROJECTS_FILE, projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save project' });
  }

  return res.json(projects[idx]);
});

/**
 * DELETE /api/projects/:id
 * Admin only. Deletes project and its methods file.
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;

  let projects;
  try {
    projects = readJSON(PROJECTS_FILE);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read projects' });
  }

  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects.splice(idx, 1);

  try {
    writeJSON(PROJECTS_FILE, projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save projects' });
  }

  // Remove per-project methods file
  const methodsFile = path.join(METHODS_DIR, `${id}.json`);
  if (fs.existsSync(methodsFile)) {
    try {
      fs.unlinkSync(methodsFile);
    } catch (err) {
      // Log but don't fail the request
      console.error(`Warning: could not delete methods file for project ${id}:`, err.message);
    }
  }

  // Clean up the method index for all methods belonging to this project
  try {
    const index = readJSON(METHOD_INDEX_FILE);
    for (const [methodId, projectId] of Object.entries(index)) {
      if (projectId === id) {
        delete index[methodId];
      }
    }
    writeJSON(METHOD_INDEX_FILE, index);
  } catch (err) {
    console.error('Warning: could not clean method index after project deletion:', err.message);
  }

  return res.json({ success: true });
});

module.exports = router;
