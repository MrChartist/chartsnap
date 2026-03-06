const express = require('express');
const router = express.Router();
const { generateChart, generateMiniChart } = require('../services/screenshot');

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
    const {
        symbol = 'BINANCE:BTCUSDT',
        interval = '1D',
        width = 800,
        height = 600,
        style = 'candle',
        theme = 'dark',
        format = 'png'
    } = req.query;
    try {
        const { buffer, type } = await generateChart({ symbol, interval, width: parseInt(width), height: parseInt(height), style, theme, format });
        res.set('Content-Type', `image/${type}`);
        res.send(buffer);
    } catch (err) {
        console.error('[v1/advanced-chart]', err.message);
        res.status(500).json({ error: true, message: err.message });
    }
});

module.exports = router;
