/**
 * ChartSnap Telegram Bot
 * Uses Telegram Bot API directly via Node.js built-in https — no external packages needed.
 *
 * Setup:
 *   1. Copy .env.example → .env
 *   2. Set TELEGRAM_BOT_TOKEN=your_token_from_botfather
 *   3. Restart the server
 *
 * Commands:
 *   /start            — Welcome message
 *   /help             — Usage guide
 *   /chart <symbol> [interval] [style] — Advanced chart
 *   /mini <symbol> [interval]          — Mini sparkline chart
 *   /studies <symbol> <study,...>      — Chart with specific studies
 *
 * Examples:
 *   /chart BTCUSDT 1D
 *   /chart BINANCE:ETHUSDT 4h candle
 *   /mini SOLUSDT 15m
 *   /studies BTCUSDT RSI,MACD,BB
 */

const https = require('https');
const http = require('http');

// Load .env if present
try { require('dotenv').config(); } catch (_) { }

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'demo-key-ultra-001';

if (!BOT_TOKEN) {
    console.warn('ℹ️  Telegram Bot disabled. Set TELEGRAM_BOT_TOKEN in .env to enable.');
    module.exports = { enabled: false };
    return;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function telegramRequest(method, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${BOT_TOKEN}/${method}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function fetchChartBuffer(endpoint, params) {
    return new Promise((resolve, reject) => {
        const qs = new URLSearchParams({ ...params, key: API_KEY }).toString();
        const url = new URL(`${API_URL}${endpoint}?${qs}`);
        const mod = url.protocol === 'https:' ? https : http;
        const req = mod.request(url, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    const body = Buffer.concat(chunks).toString();
                    return reject(new Error(JSON.parse(body)?.message || `HTTP ${res.statusCode}`));
                }
                resolve(Buffer.concat(chunks));
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function sendMessage(chatId, text, extra = {}) {
    return telegramRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra });
}

function sendPhoto(chatId, buffer, caption) {
    return new Promise((resolve, reject) => {
        const boundary = `----ChartSnapBoundary${Date.now()}`;
        const filename = 'chart.png';
        const cap = Buffer.from(caption || '');
        const header = Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`
        );
        const capHeader = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n`);
        const parseModeHeader = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown`);
        const chatHeader = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}`);
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
        const body = Buffer.concat([header, buffer, capHeader, cap, parseModeHeader, chatHeader, footer]);

        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${BOT_TOKEN}/sendPhoto`,
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function editMessageText(chatId, messageId, text) {
    return telegramRequest('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown' });
}

function deleteMessage(chatId, messageId) {
    return telegramRequest('deleteMessage', { chat_id: chatId, message_id: messageId }).catch(() => { });
}

// ─── Study name aliases ───────────────────────────────────────────────────────
const STUDY_ALIASES = {
    'rsi': 'Relative Strength Index',
    'macd': 'MACD',
    'bb': 'Bollinger Bands',
    'boll': 'Bollinger Bands',
    'sma': 'Moving Average',
    'ema': 'Moving Average Exponential',
    'vol': 'Volume',
};

function resolveStudy(name) {
    const lower = name.toLowerCase().trim();
    return STUDY_ALIASES[lower] || name;
}

// ─── Command handlers ─────────────────────────────────────────────────────────

const WELCOME = `*Welcome to ChartSnap Bot* 📸📈

I generate high-quality chart images from real market data.

*Available Commands:*

/chart BTCUSDT 1D — Candlestick chart with RSI & Bollinger Bands
/mini ETHUSDT 4h — Mini area sparkline
/studies SOLUSDT RSI,MACD — Chart with custom indicators
/help — Show this guide

*Supported intervals:* 1m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1D 3D 1W 1M
*Supported styles:* candle, line, area, heikinAshi, bar`;

async function handleChart(chatId, args) {
    const [rawSymbol, interval = '1D', style = 'candle'] = args;
    if (!rawSymbol) return sendMessage(chatId, '❌ Usage: `/chart BTCUSDT 1D`');

    const symbol = rawSymbol.includes(':') ? rawSymbol.toUpperCase() : `BINANCE:${rawSymbol.toUpperCase()}`;
    const pending = await sendMessage(chatId, `⏳ Generating chart for *${symbol}* (${interval})...`);

    try {
        const buffer = await fetchChartBuffer('/v1/tradingview/advanced-chart', {
            symbol, interval, style, theme: 'dark',
            studies: ['Relative Strength Index', 'Bollinger Bands']
        });
        await deleteMessage(chatId, pending.result.message_id);
        await sendPhoto(chatId, buffer, `📸 *${symbol}* · ${interval} · RSI + BB\nPowered by ChartSnap`);
    } catch (err) {
        editMessageText(chatId, pending.result.message_id, `❌ Error: ${err.message}`);
    }
}

async function handleMini(chatId, args) {
    const [rawSymbol, interval = '1D'] = args;
    if (!rawSymbol) return sendMessage(chatId, '❌ Usage: `/mini ETHUSDT 4h`');

    const symbol = rawSymbol.includes(':') ? rawSymbol.toUpperCase() : `BINANCE:${rawSymbol.toUpperCase()}`;
    const pending = await sendMessage(chatId, `⏳ Generating mini chart for *${symbol}*...`);

    try {
        const buffer = await fetchChartBuffer('/v1/tradingview/mini-chart', { symbol, interval, theme: 'dark' });
        await deleteMessage(chatId, pending.result.message_id);
        await sendPhoto(chatId, buffer, `📈 *${symbol}* · ${interval}\nPowered by ChartSnap`);
    } catch (err) {
        editMessageText(chatId, pending.result.message_id, `❌ Error: ${err.message}`);
    }
}

async function handleStudies(chatId, args) {
    const [rawSymbol, studiesCsv, interval = '1D'] = args;
    if (!rawSymbol || !studiesCsv) return sendMessage(chatId, '❌ Usage: `/studies BTCUSDT RSI,MACD,BB 1D`');

    const symbol = rawSymbol.includes(':') ? rawSymbol.toUpperCase() : `BINANCE:${rawSymbol.toUpperCase()}`;
    const studies = studiesCsv.split(',').map(resolveStudy);
    const pending = await sendMessage(chatId, `⏳ Generating chart for *${symbol}* with ${studies.join(', ')}...`);

    try {
        const qs = new URLSearchParams({ symbol, interval, theme: 'dark', key: API_KEY });
        studies.forEach(s => qs.append('studies', s));
        const url = new URL(`${API_URL}/v1/tradingview/advanced-chart?${qs.toString()}`);
        const mod = url.protocol === 'https:' ? https : http;

        const buffer = await new Promise((resolve, reject) => {
            const req = mod.request(url, (res) => {
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            });
            req.on('error', reject);
            req.end();
        });

        await deleteMessage(chatId, pending.result.message_id);
        await sendPhoto(chatId, buffer, `📊 *${symbol}* · ${interval} · ${studies.join(', ')}\nPowered by ChartSnap`);
    } catch (err) {
        editMessageText(chatId, pending.result.message_id, `❌ Error: ${err.message}`);
    }
}

// ─── Polling ──────────────────────────────────────────────────────────────────

let offset = 0;

async function poll() {
    try {
        const res = await telegramRequest('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
        if (!res.ok) return;

        for (const update of res.result || []) {
            offset = update.update_id + 1;
            const msg = update.message;
            if (!msg || !msg.text) continue;

            const chatId = msg.chat.id;
            const text = msg.text.trim();
            const [cmd, ...args] = text.split(/\s+/);
            const command = cmd.replace(/^\//, '').replace(/@.*$/, '').toLowerCase();

            try {
                switch (command) {
                    case 'start':
                    case 'help':
                        await sendMessage(chatId, WELCOME); break;
                    case 'chart':
                        await handleChart(chatId, args); break;
                    case 'mini':
                        await handleMini(chatId, args); break;
                    case 'studies':
                        await handleStudies(chatId, args); break;
                }
            } catch (err) {
                console.error(`[Bot] Handler error for ${command}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Bot] Poll error:', err.message);
    }
    setTimeout(poll, 1000);
}

// Start polling
poll();
console.log('🤖 Telegram Bot started (long polling, no external deps)');
module.exports = { enabled: true };
