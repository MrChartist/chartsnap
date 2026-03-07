// Load .env if present
try { require('dotenv').config(); } catch (_) { }

const express = require('express');
const cors = require('cors');
const path = require('path');

// ── Auto-migration: ensure users table + stored_plain column exist ────────────
try {
    const { getDb } = require('./services/db');
    const _mdb = getDb();
    if (_mdb) {
        _mdb.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                tenant_id     TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                name          TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            );
        `);
        try { _mdb.exec(`ALTER TABLE api_keys ADD COLUMN stored_plain TEXT`); } catch (_) { }
        try { _mdb.exec(`ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''`); } catch (_) { }
        // Back-fill stored_plain for the default seeded key
        const _sk = _mdb.prepare(`SELECT id FROM api_keys WHERE id = 'key_default' AND stored_plain IS NULL`).get();
        if (_sk) _mdb.prepare(`UPDATE api_keys SET stored_plain = ? WHERE id = 'key_default'`).run('chartsnap_test_key_2026');
        console.log('✅ DB migration applied');
    }
} catch (migrateErr) {
    console.warn('⚠️  DB migration warning:', migrateErr.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ── Allowed origins ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') return cb(null, true);
        cb(new Error('CORS not allowed'));
    }
}));

// ── Inline request logger (replaces morgan) ──────────────────────────────────
app.use((req, _res, next) => {
    const t = new Date().toISOString();
    console.log(`[${t}] ${req.method} ${req.url}`);
    next();
});

// ── Inline rate limiter (replaces express-rate-limit) ────────────────────────
const _hits = new Map();
function rateLimit(maxPerMinute = 20) {
    return (req, res, next) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const windowMs = 60_000;
        const entry = _hits.get(ip) || { count: 0, reset: now + windowMs };
        if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
        entry.count++;
        _hits.set(ip, entry);
        res.set('X-RateLimit-Limit', maxPerMinute);
        res.set('X-RateLimit-Remaining', Math.max(0, maxPerMinute - entry.count));
        if (entry.count > maxPerMinute) {
            return res.status(429).json({ error: true, message: 'Too many requests — slow down.', retryAfter: Math.ceil((entry.reset - now) / 1000) });
        }
        next();
    };
}

// ── Inline simple image cache ────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 60_000;

function cacheGet(key) {
    const hit = _cache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expires) { _cache.delete(key); return null; }
    return hit.buf;
}
function cacheSet(key, buf) {
    _cache.set(key, { buf, expires: Date.now() + CACHE_TTL });
    if (_cache.size > 200) {
        const oldest = [..._cache.entries()].sort((a, b) => a[1].expires - b[1].expires)[0];
        if (oldest) _cache.delete(oldest[0]);
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Expose imageCache helpers to routes
app.locals.cacheGet = cacheGet;
app.locals.cacheSet = cacheSet;

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend-react/dist')));
app.use('/storage', express.static(path.join(__dirname, '../storage')));

const authMiddleware = require('./middleware/auth');

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/v1', rateLimit(20), require('./routes/v1'));
app.use('/v1/renders', authMiddleware, rateLimit(60), require('./routes/renders'));
app.use('/v1/jobs', authMiddleware, rateLimit(60), require('./routes/renders'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'PixelTrade API',
        version: '2.2.0',
        timestamp: new Date().toISOString(),
        cacheSize: _cache.size,
    });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => { console.log('SIGTERM received — shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received — shutting down'); process.exit(0); });

// ── SPA catch-all (React Router) ─────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend-react/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 PixelTrade running at http://localhost:${PORT}`);
    console.log(`⚡ Chart Builder: http://localhost:${PORT}/builder`);
    console.log(`📚 API Docs:     http://localhost:${PORT}/docs`);
    console.log(`💰 Pricing:      http://localhost:${PORT}/pricing`);
    console.log(`👤 Sign Up:      http://localhost:${PORT}/signup`);
    console.log(`📊 Dashboard:    http://localhost:${PORT}/dashboard\n`);
});
