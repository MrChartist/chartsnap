const express = require('express');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');
const { rateLimitMiddleware } = require('../middleware/ratelimit');
const { generateChart, generateMiniChart } = require('../services/screenshot');

function parseStudies(s) {
    if (!s) return [];
    if (Array.isArray(s)) return s;
    return s.split(',').map(x => x.trim()).filter(Boolean);
}

// GET /v1/tradingview/mini-chart
router.get('/tradingview/mini-chart', auth, rateLimitMiddleware, async (req, res) => {
    const { symbol = 'BINANCE:BTCUSDT', interval = '1D', width = 800, height = 400, theme = 'dark' } = req.query;
    const cfg = req.tierConfig;
    const w = Math.min(parseInt(width) || 800, cfg.maxWidth);
    const h = Math.min(parseInt(height) || 400, cfg.maxHeight);
    try {
        const buffer = await generateMiniChart({ symbol, interval, width: w, height: h, theme });
        res.set('Content-Type', 'image/png');
        res.set('X-ChartSnap-Tier', req.keyData.tier);
        res.send(buffer);
    } catch (err) {
        console.error('[v1/mini-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

// GET /v1/tradingview/advanced-chart
router.get('/tradingview/advanced-chart', auth, rateLimitMiddleware, async (req, res) => {
    const { symbol = 'BINANCE:BTCUSDT', interval = '1D', width = 800, height = 600, style = 'candle', theme = 'dark', format = 'png' } = req.query;
    const studies = parseStudies(req.query.studies);
    const cfg = req.tierConfig;
    const w = Math.min(parseInt(width) || 800, cfg.maxWidth);
    const h = Math.min(parseInt(height) || 600, cfg.maxHeight);
    try {
        const { buffer, type } = await generateChart({ symbol, interval, width: w, height: h, style, theme, studies: studies.slice(0, cfg.maxStudies), format });
        res.set('Content-Type', `image/${type}`);
        res.set('X-ChartSnap-Tier', req.keyData.tier);
        res.send(buffer);
    } catch (err) {
        console.error('[v1/advanced-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

module.exports = router;
