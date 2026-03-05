const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { rateLimitMiddleware } = require('../middleware/ratelimit');

// Major exchange list
const EXCHANGES = [
    'AMEX', 'ASX', 'B3', 'BITSTAMP', 'BITFINEX', 'BINANCE', 'BINANCEUS',
    'BYBIT', 'CBOE', 'CME', 'COINBASE', 'CRYPTO', 'EURONEXT', 'FWB',
    'FXOPEN', 'GLOBEX', 'HKG', 'HKEX', 'IDX', 'KRX', 'LSE', 'MIL',
    'MOEX', 'NASDAQ', 'NSE', 'NYSE', 'OKX', 'OANDA', 'SGX', 'SIX',
    'SSE', 'SZSE', 'TVC', 'TSX', 'TWSE', 'UNISWAP', 'XETR', 'XTSX',
];

// Symbol map per exchange (subset for demo purposes)
const EXCHANGE_SYMBOLS = {
    BINANCE: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:BNBUSDT', 'BINANCE:ADAUSDT', 'BINANCE:SOLUSDT', 'BINANCE:DOTUSDT', 'BINANCE:XRPUSDT', 'BINANCE:AVAXUSDT'],
    NASDAQ: ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:GOOGL', 'NASDAQ:AMZN', 'NASDAQ:META', 'NASDAQ:NVDA', 'NASDAQ:TSLA', 'NASDAQ:NFLX'],
    NYSE: ['NYSE:JPM', 'NYSE:BAC', 'NYSE:JNJ', 'NYSE:PG', 'NYSE:WMT', 'NYSE:V', 'NYSE:MA', 'NYSE:DIS'],
    COINBASE: ['COINBASE:BTCUSD', 'COINBASE:ETHUSD', 'COINBASE:SOLUSD', 'COINBASE:ADAUSD'],
    OANDA: ['OANDA:EURUSD', 'OANDA:GBPUSD', 'OANDA:USDJPY', 'OANDA:XAUUSD', 'OANDA:XAGUSD'],
    NSE: ['NSE:RELIANCE', 'NSE:TCS', 'NSE:INFY', 'NSE:HDFCBANK', 'NSE:ICICIBANK', 'NSE:WIPRO', 'NSE:NIFTY', 'NSE:BANKNIFTY'],
};

// GET /v3/tradingview/exchange/list
router.get('/tradingview/exchange/list', auth, rateLimitMiddleware, (req, res) => {
    res.json({
        updatedAt: new Date().toISOString(),
        payload: EXCHANGES,
    });
});

// GET /v3/tradingview/exchange/symbols
router.get('/tradingview/exchange/symbols', auth, rateLimitMiddleware, (req, res) => {
    const { exchange } = req.query;
    if (!exchange) {
        return res.status(400).json({ error: true, message: 'exchange query parameter is required.' });
    }
    const upper = exchange.toUpperCase();
    const symbols = EXCHANGE_SYMBOLS[upper];
    if (!symbols) {
        return res.status(404).json({ error: true, message: `Exchange "${upper}" not found or has no cached symbols.` });
    }
    res.json({
        updatedAt: new Date().toISOString(),
        exchange: upper,
        payload: symbols,
    });
});

module.exports = router;
