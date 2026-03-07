const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../services/db');
const requireSession = require('../middleware/session');

// All routes require a valid session (JWT)
router.use(requireSession);

function maskKey(plain) {
    if (!plain || plain.length < 8) return '••••••••';
    return plain.slice(0, 3) + '•'.repeat(12) + plain.slice(-4);
}

function generateApiKeyPlain() {
    return 'pt_' + crypto.randomBytes(28).toString('hex');
}

// ---------- GET /api/dashboard/stats ----------
router.get('/stats', (req, res) => {
    const { tenantId, plan, email, name } = req.user;

    const PLAN_LIMITS = { FREE: 20, PRO: 100, ENTERPRISE: 500 };
    const rateLimit = PLAN_LIMITS[plan] || 20;

    const callsToday = db.getCallsToday(tenantId);
    const callsThisMonth = db.getCallsThisMonth(tenantId);

    res.json({ plan, rateLimit, callsToday, callsThisMonth, email, name, tenantId });
});

// ---------- GET /api/dashboard/usage ----------
router.get('/usage', (req, res) => {
    const days = db.getUsageByDay(req.user.tenantId, 7);
    res.json({ days });
});

// ---------- GET /api/dashboard/key ----------
router.get('/key', (req, res) => {
    const key = db.getApiKeyForTenant(req.user.tenantId);
    if (!key) return res.status(404).json({ error: true, message: 'No API key found.' });
    res.json({ masked: maskKey(key.stored_plain || '') });
});

// ---------- POST /api/dashboard/reveal-key ----------
router.post('/reveal-key', (req, res) => {
    const key = db.getApiKeyForTenant(req.user.tenantId);
    if (!key || !key.stored_plain) {
        return res.status(404).json({ error: true, message: 'Key not available. Please regenerate.' });
    }
    res.json({ plain: key.stored_plain });
});

// ---------- POST /api/dashboard/regenerate-key ----------
router.post('/regenerate-key', (req, res) => {
    const newPlain = generateApiKeyPlain();
    const newHash = crypto.createHash('sha256').update(newPlain).digest('hex');

    try {
        db.revokeAndReplaceKey(req.user.tenantId, newHash, newPlain);
    } catch (e) {
        console.error('[regenerate-key]', e.message);
        return res.status(500).json({ error: true, message: 'Failed to regenerate key.' });
    }

    res.json({ plain: newPlain, masked: maskKey(newPlain), message: 'API key regenerated successfully.' });
});

module.exports = router;
