const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../services/db');
const { sign } = require('../lib/jwt');
const requireSession = require('../middleware/session');

// ---------- helpers ----------
function hashPassword(password) {
    // Synchronous scrypt-like hash using pbkdf2 (sync, built-in)
    return crypto.pbkdf2Sync(password, 'pixeltrade-salt', 100000, 64, 'sha512').toString('hex');
}

function generateApiKeyPlain() {
    return 'pt_' + crypto.randomBytes(28).toString('hex'); // pt_56hex = 59 chars
}

function maskKey(plain) {
    // Show last 4 chars only: pt_••••••••••••XXXX
    return 'pt_' + '•'.repeat(12) + plain.slice(-4);
}

// ---------- POST /api/auth/signup ----------
router.post('/signup', (req, res) => {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
        return res.status(400).json({ error: true, message: 'email, password, and name are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: true, message: 'Password must be at least 8 characters.' });
    }

    // Check if email already exists
    const existing = db.findUserByEmail(email);
    if (existing) {
        return res.status(409).json({ error: true, message: 'An account with that email already exists.' });
    }

    const tenantId = 'tenant_' + crypto.randomBytes(8).toString('hex');
    const userId = 'user_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = hashPassword(password);
    const plainKey = generateApiKeyPlain();
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
    const keyId = 'key_' + crypto.randomBytes(8).toString('hex');

    try {
        db.createUser({ tenantId, userId, email, passwordHash, name, keyId, keyHash });
    } catch (e) {
        console.error('[signup]', e.message);
        return res.status(500).json({ error: true, message: 'Failed to create account. Please try again.' });
    }

    const token = sign({ tenantId, userId, email, name, plan: 'FREE' });

    res.status(201).json({
        token,
        apiKey: plainKey, // shown once at signup
        user: { email, name, plan: 'FREE', tenantId }
    });
});

// ---------- POST /api/auth/login ----------
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: true, message: 'email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: true, message: 'Invalid email or password.' });
    }

    const hash = hashPassword(password);
    if (hash !== user.password_hash) {
        return res.status(401).json({ error: true, message: 'Invalid email or password.' });
    }

    const token = sign({ tenantId: user.tenant_id, userId: user.id, email: user.email, name: user.name, plan: user.plan || 'FREE' });

    res.json({
        token,
        user: { email: user.email, name: user.name, plan: user.plan || 'FREE', tenantId: user.tenant_id }
    });
});

// ---------- GET /api/auth/me ----------
router.get('/me', requireSession, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
