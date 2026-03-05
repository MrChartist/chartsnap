const fs = require('fs');
const path = require('path');

const USAGE_FILE = path.join(__dirname, '../data/usage.json');

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

function loadUsage() {
    try {
        return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveUsage(usage) {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

function todayKey() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function rateLimitMiddleware(req, res, next) {
    const key = req.apiKey;
    const tier = (req.keyData && req.keyData.tier) || 'BASIC';
    const config = getTierConfig(tier);

    const usage = loadUsage();
    const day = todayKey();
    const now = Date.now();

    if (!usage[key]) usage[key] = {};
    if (!usage[key][day]) usage[key][day] = { count: 0, lastRequest: 0 };

    const dayUsage = usage[key][day];

    // Check daily limit
    if (dayUsage.count >= config.dailyLimit) {
        return res.status(429).json({
            error: true,
            message: `Daily request limit of ${config.dailyLimit} reached for ${tier} tier. Upgrade at chartsnap.dev/pricing`,
            tier,
            dailyLimit: config.dailyLimit,
            usedToday: dayUsage.count,
        });
    }

    // Check rate limit (per second)
    const msSinceLast = now - dayUsage.lastRequest;
    const minGap = Math.floor(1000 / config.ratePerSec);
    if (msSinceLast < minGap) {
        return res.status(429).json({
            error: true,
            message: `Rate limit exceeded. ${tier} tier allows ${config.ratePerSec} request(s)/second.`,
            tier,
            rateLimit: config.ratePerSec,
        });
    }

    // Update usage
    dayUsage.count++;
    dayUsage.lastRequest = now;
    saveUsage(usage);

    // Expose tier config to route handlers
    req.tierConfig = config;
    next();
}

module.exports = { rateLimitMiddleware, getTierConfig, TIERS };
