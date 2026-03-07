const express = require('express');
const router = express.Router();
const { generateChart, generateMiniChart, generateLayoutChart } = require('../services/screenshot');

// GET /v1/tradingview/mini-chart
router.get('/tradingview/mini-chart', async (req, res) => {
    const { symbol = 'BINANCE:BTCUSDT', interval = '1D', width = 800, height = 400, theme = 'dark' } = req.query;
    try {
        const buffer = await generateMiniChart({ symbol, interval, width: parseInt(width), height: parseInt(height), theme });
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        console.error('[v1/mini-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

// GET /v1/tradingview/advanced-chart
router.get('/tradingview/advanced-chart', async (req, res) => {
    const { symbol = 'BINANCE:BTCUSDT', interval = '1D', width = 800, height = 600, theme = 'dark', format = 'png' } = req.query;
    try {
        const { buffer, type } = await generateChart({ symbol, interval, width: parseInt(width), height: parseInt(height), theme, format });
        res.set('Content-Type', `image/${type}`);
        res.send(buffer);
    } catch (err) {
        console.error('[v1/advanced-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

/**
 * POST /v1/tradingview/layout-chart/:layoutId
 * 
 * Synchronous — screenshots the user's saved TradingView layout and returns
 * the PNG directly (no job queue, no polling). Matches chart-img.com's API:
 *   POST https://api.chart-img.com/v2/tradingview/layout-chart/{layoutId}
 *   Body: { symbol, interval, width, height }
 */
router.post('/tradingview/layout-chart/:layoutId', async (req, res) => {
    const { layoutId } = req.params;
    const { symbol, interval = '1D', range, width = 1920, height = 1080 } = req.body;

    if (!layoutId) {
        return res.status(400).json({ error: true, message: 'Layout ID is required in the URL path.' });
    }

    console.log(`[layout-chart] layout=${layoutId} symbol=${symbol} interval=${interval} ${width}x${height}`);

    try {
        const { buffer, type } = await generateLayoutChart({
            layout: layoutId,
            symbol,
            interval,
            range,
            width: parseInt(width),
            height: parseInt(height),
        });
        res.set('Content-Type', `image/${type}`);
        res.set('X-Layout-Id', layoutId);
        res.send(buffer);
    } catch (err) {
        console.error('[v1/layout-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

// Also support GET for convenience:
// GET /v1/tradingview/layout-chart/:layoutId?symbol=NSE:SAIL&interval=1D
router.get('/tradingview/layout-chart/:layoutId', async (req, res) => {
    const { layoutId } = req.params;
    const { symbol, interval = '1D', range, width = 1920, height = 1080, theme = 'dark' } = req.query;

    console.log(`[layout-chart] layout=${layoutId} symbol=${symbol} interval=${interval} range=${range} theme=${theme} ${width}x${height}`);

    try {
        const { buffer, type } = await generateLayoutChart({
            layout: layoutId,
            symbol,
            interval,
            range,
            theme,
            width: parseInt(width),
            height: parseInt(height),
        });
        res.set('Content-Type', `image/${type}`);
        res.set('X-Layout-Id', layoutId);
        res.send(buffer);
    } catch (err) {
        console.error('[v1/layout-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

module.exports = router;
