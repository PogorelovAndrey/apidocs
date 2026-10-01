'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/proxy
 * Proxies an HTTP request server-side to bypass browser CORS restrictions.
 *
 * Body: {
 *   url: string,
 *   method: string,
 *   headers: object,   // key-value
 *   body: string|null  // raw body string
 * }
 *
 * Returns: {
 *   status: number,
 *   statusText: string,
 *   headers: object,
 *   body: string,
 *   time: number  // ms
 * }
 */
router.post('/', authenticate, async (req, res) => {
  const { url, method = 'GET', headers = {}, body: reqBody } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  // Basic URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const start = Date.now();

  try {
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: headers || {},
      // Don't follow redirects silently — return them as-is
      redirect: 'follow',
    };

    if (reqBody && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
      fetchOptions.body = reqBody;
    }

    const upstream = await fetch(parsedUrl.toString(), fetchOptions);
    const time = Date.now() - start;

    // Read response body as text
    const responseBody = await upstream.text();

    // Collect response headers
    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return res.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
      body: responseBody,
      time,
    });
  } catch (err) {
    const time = Date.now() - start;
    return res.status(502).json({
      error: err.message,
      time,
    });
  }
});

module.exports = router;
