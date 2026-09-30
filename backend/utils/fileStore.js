'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Reads and parses a JSON file synchronously.
 * Throws if the file cannot be read or parsed.
 *
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {*} Parsed JSON value.
 */
function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Serialises data to JSON and writes it to a file synchronously.
 * Creates parent directories if they do not exist.
 *
 * @param {string} filePath - Absolute path to the target JSON file.
 * @param {*} data - Value to serialise.
 */
function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readJSON, writeJSON };
