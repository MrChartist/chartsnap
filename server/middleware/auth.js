const fs = require('fs');
const path = require('path');

const KEYS_FILE = path.join(__dirname, '../data/keys.json');

function loadKeys() {
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function getApiKey(req) {
  // Support x-api-key header, Authorization Bearer, or ?key= query param
  if (req.headers['x-api-key']) return req.headers['x-api-key'];
  if (req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts[0] === 'Bearer' && parts[1]) return parts[1];
  }
  if (req.query.key) return req.query.key;
  return null;
}

function authMiddleware(req, res, next) {
  const key = getApiKey(req);
  if (!key) {
    return res.status(401).json({ error: true, message: 'API key is required. Use x-api-key header, Authorization: Bearer, or ?key= query param.' });
  }

  const keys = loadKeys();
  const keyData = keys[key];
  if (!keyData || !keyData.active) {
    return res.status(401).json({ error: true, message: 'Invalid or inactive API key.' });
  }

  // Attach key info to request
  req.apiKey = key;
  req.keyData = keyData;
  next();
}

module.exports = authMiddleware;
