const crypto = require('crypto');
const db = require('../services/db');

function getApiKey(req) {
  // Support Authorization Bearer (primary) or x-api-key header
  if (req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts[0] === 'Bearer' && parts[1]) return parts[1];
  }
  if (req.headers['x-api-key']) return req.headers['x-api-key'];
  return null;
}

function authMiddleware(req, res, next) {
  const key = getApiKey(req);
  if (!key) {
    return res.status(401).json({
      type: "https://chartsnap.com/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "API key is required. Use Authorization: Bearer <token>."
    });
  }

  // Hash the key to prevent timing attacks and match DB lookup
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const tenant = db.findTenantByKeyHash(keyHash);
  if (!tenant || tenant.status !== 'active') {
    return res.status(403).json({
      type: "https://chartsnap.com/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Invalid or inactive API key."
    });
  }

  // Update last used timestamp in the background
  db.updateKeyUsageTime(keyHash);

  // Attach key and tenant info to request
  req.apiKey = key;
  req.tenant = tenant;
  // Fallback for older v1 routes that expect req.keyData.tier
  req.keyData = { tier: tenant.tier };

  next();
}

module.exports = authMiddleware;
