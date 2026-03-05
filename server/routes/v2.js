const express = require('express');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');
const { rateLimitMiddleware } = require('../middleware/ratelimit');
const { generateChart } = require('../services/screenshot');

// POST /v2/tradingview/advanced-chart
router.post('/tradingview/advanced-chart', auth, rateLimitMiddleware, async (req, res) => {
    const { symbol = 'BINANCE:BTCUSDT', interval = '1D', width = 800, height = 600,
        style = 'candle', theme = 'dark', studies = [], format = 'png' } = req.body || {};
    const cfg = req.tierConfig;
    const w = Math.min(parseInt(width) || 800, cfg.maxWidth);
    const h = Math.min(parseInt(height) || 600, cfg.maxHeight);
    const s = (Array.isArray(studies) ? studies : []).slice(0, cfg.maxStudies);
    try {
        const { buffer, type } = await generateChart({ symbol, interval, width: w, height: h, style, theme, studies: s, format });
        res.set('Content-Type', `image/${type}`);
        res.set('X-ChartSnap-Tier', req.keyData.tier);
        res.send(buffer);
    } catch (err) {
        console.error('[v2/advanced-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

// POST /v2/tradingview/advanced-chart/storage
router.post('/tradingview/advanced-chart/storage', auth, rateLimitMiddleware, async (req, res) => {
    const fs = require('fs');
    const { v4: uuidv4 } = require('uuid');
    const { symbol = 'BINANCE:BTCUSDT', interval = '1D', width = 800, height = 600,
        style = 'candle', theme = 'dark', studies = [], format = 'png' } = req.body || {};
    const cfg = req.tierConfig;
    const w = Math.min(parseInt(width) || 800, cfg.maxWidth);
    const h = Math.min(parseInt(height) || 600, cfg.maxHeight);
    try {
        const { buffer, type } = await generateChart({ symbol, interval, width: w, height: h, style, theme, studies, format });
        const storageDir = path.join(__dirname, '../../storage');
        fs.mkdirSync(storageDir, { recursive: true });
        const filename = `${uuidv4()}.${type}`;
        fs.writeFileSync(path.join(storageDir, filename), buffer);
        res.json({ success: true, filename, url: `/storage/${filename}`, size: buffer.length, createdAt: new Date().toISOString() });
    } catch (err) {
        console.error('[v2/storage]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

module.exports = router;
