const dbService = require('../services/db');

// Tier config
const TIERS = {
    BASIC: { dailyLimit: 50, ratePerSec: 1, maxWidth: 800, maxHeight: 600, maxStudies: 3 },
    PRO: { dailyLimit: 500, ratePerSec: 10, maxWidth: 1920, maxHeight: 1080, maxStudies: 5 },
    MEGA: { dailyLimit: 1000, ratePerSec: 15, maxWidth: 1920, maxHeight: 1600, maxStudies: 10 },
    ULTRA: { dailyLimit: 3000, ratePerSec: 35, maxWidth: 2048, maxHeight: 1920, maxStudies: 25 },
    ENTERPRISE: { dailyLimit: 99999, ratePerSec: 50, maxWidth: 4096, maxHeight: 4096, maxStudies: 64 },
};

function getTierConfig(tier) {
    return TIERS[tier] || TIERS.BASIC;
}

function rateLimitMiddleware(req, res, next) {
    const tenant = req.tenant;
    if (!tenant) return next();

    const tier = tenant.tier || 'BASIC';
    const config = getTierConfig(tier);
    const now = Date.now();
    const db = dbService.getDb();

    // Keys for token buckets
    const day = new Date().toISOString().split('T')[0];
    const dailyKey = `quota:${tenant.id}:${day}`;
    const secKey = `rl:${tenant.id}:${Math.floor(now / 1000)}`;

    let limitError = null;

    if (db) {
        const checkLimits = db.transaction(() => {
            // Check Daily Limit
            let daily = db.prepare('SELECT count FROM rate_limits WHERE key = ?').get(dailyKey);
            if (!daily) {
                db.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)').run(dailyKey, now + 86400000);
            } else {
                if (daily.count >= config.dailyLimit) return { type: 'daily', limit: config.dailyLimit };
                db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(dailyKey);
            }

            // Check Per-Second Burst
            let sec = db.prepare('SELECT count FROM rate_limits WHERE key = ?').get(secKey);
            if (!sec) {
                db.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)').run(secKey, now + 2000);
            } else {
                if (sec.count >= config.ratePerSec) return { type: 'rate', limit: config.ratePerSec };
                db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(secKey);
            }

            return null;
        });

        try {
            limitError = checkLimits();
        } catch (e) {
            console.error('Rate limit DB transaction error', e);
        }
    }

    // Set standard RateLimit headers
    res.setHeader('RateLimit-Policy', `${config.ratePerSec};w=1, ${config.dailyLimit};w=86400`);

    if (limitError) {
        const retryAfter = limitError.type === 'rate' ? 1 : 86400;
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('RateLimit', `limit=${limitError.limit}, remaining=0, reset=${retryAfter}`);

        return res.status(429).json({
            type: "https://chartsnap.com/problems/rate-limit-exceeded",
            title: "Rate limit exceeded",
            status: 429,
            detail: limitError.type === 'daily'
                ? `Daily request limit of ${config.dailyLimit} reached for ${tier} tier. Upgrade at chartsnap.dev/pricing`
                : `Rate limit exceeded. ${tier} tier allows ${config.ratePerSec} request(s)/second.`,
            extensions: {
                plan: tier,
                retry_after_seconds: retryAfter
            }
        });
    }

    req.tierConfig = config;
    next();
}

module.exports = { rateLimitMiddleware, getTierConfig, TIERS };
