/**
 * ChartSnap Screenshot Engine
 * Uses @napi-rs/canvas for pure-JS chart rendering.
 * Fetches real OHLCV data from Binance (crypto) or generates realistic synthetic data.
 */

const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const axios = require('axios');
const path = require('path');

// ─── Data Fetching ─────────────────────────────────────────────────────────────

const BINANCE_INTERVAL_MAP = {
    '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m', '45m': '30m',
    '1h': '1h', '2h': '2h', '3h': '4h', '4h': '4h', '6h': '6h', '8h': '8h', '12h': '12h',
    '1D': '1d', '2D': '1d', '3D': '1d', '1W': '1w', '1M': '1M', '3M': '1M', '6M': '1M', '1Y': '1M',
};

async function fetchOHLCV(symbol, interval, limit = 120) {
    try {
        // Try Binance for crypto (EXCHANGE:SYMBOL → SYMBOL only)
        const parts = symbol.split(':');
        const exchange = parts[0];
        const ticker = parts[1] || parts[0];

        // Binance crypto symbols (USDT pairs)
        if (['BINANCE', 'COINBASE', 'BYBIT', 'OKX', 'BITFINEX', 'BITSTAMP', 'CRYPTO'].includes(exchange)) {
            const binanceTicker = ticker.replace(/[^A-Z]/g, '');
            const bInterval = BINANCE_INTERVAL_MAP[interval] || '1d';
            const resp = await axios.get('https://api.binance.com/api/v3/klines', {
                params: { symbol: binanceTicker, interval: bInterval, limit: Math.min(limit, 500) },
                timeout: 8000,
            });
            return resp.data.map(k => ({
                time: k[0],
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5]),
            }));
        }
        throw new Error('non-binance');
    } catch {
        // Fallback: generate realistic synthetic OHLCV data
        return generateSyntheticOHLCV(limit);
    }
}

function generateSyntheticOHLCV(count = 120) {
    const candles = [];
    let price = 40000 + Math.random() * 20000;
    const now = Date.now();
    const msPerBar = 86400000;

    for (let i = count; i >= 0; i--) {
        const change = (Math.random() - 0.48) * price * 0.025;
        const open = price;
        price = Math.max(100, price + change);
        const high = Math.max(open, price) * (1 + Math.random() * 0.015);
        const low = Math.min(open, price) * (1 - Math.random() * 0.015);
        candles.push({
            time: now - i * msPerBar,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(price.toFixed(2)),
            volume: Math.floor(1000 + Math.random() * 50000),
        });
    }
    return candles;
}

// ─── Indicator Calculations ────────────────────────────────────────────────────

function calcSMA(closes, period) {
    return closes.map((_, i) =>
        i < period - 1 ? null :
            closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
    );
}

function calcEMA(closes, period) {
    const k = 2 / (period + 1);
    let ema = closes[0];
    return closes.map((v, i) => {
        if (i === 0) { ema = v; return v; }
        ema = v * k + ema * (1 - k);
        return parseFloat(ema.toFixed(4));
    });
}

function calcRSI(closes, period = 14) {
    const result = new Array(period).fill(null);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) avgGain += diff; else avgLoss += Math.abs(diff);
    }
    avgGain /= period; avgLoss /= period;
    result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? Math.abs(diff) : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
    }
    return result;
}

function calcBB(closes, period = 20, mult = 2) {
    const sma = calcSMA(closes, period);
    return closes.map((_, i) => {
        if (i < period - 1) return { upper: null, middle: null, lower: null };
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
        return { upper: mean + mult * std, middle: mean, lower: mean - mult * std };
    });
}

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
    const fastEMA = calcEMA(closes, fast);
    const slowEMA = calcEMA(closes, slow);
    const macdLine = closes.map((_, i) => fastEMA[i] - slowEMA[i]);
    const signalLine = calcEMA(macdLine, signal);
    return macdLine.map((m, i) => ({ macd: m, signal: signalLine[i], hist: m - signalLine[i] }));
}

// ─── Theme Colors ──────────────────────────────────────────────────────────────

function getTheme(theme) {
    if (theme === 'light') {
        return {
            bg: '#ffffff', border: '#e0e3eb', text: '#131722', subText: '#787b86',
            upColor: '#26a69a', downColor: '#ef5350',
            upWick: '#26a69a', downWick: '#ef5350',
            grid: 'rgba(0,0,0,0.06)', toolbar: '#f0f3fa',
            volumeUp: 'rgba(38,166,154,0.3)', volumeDown: 'rgba(239,83,80,0.3)',
            crosshair: '#9598a1', axisLine: '#e0e3eb',
        };
    }
    return {
        bg: '#131722', border: '#2a2e39', text: '#d1d4dc', subText: '#787b86',
        upColor: '#26a69a', downColor: '#ef5350',
        upWick: '#26a69a', downWick: '#ef5350',
        grid: 'rgba(255,255,255,0.04)', toolbar: '#1e222d',
        volumeUp: 'rgba(38,166,154,0.25)', volumeDown: 'rgba(239,83,80,0.25)',
        crosshair: '#787b86', axisLine: '#2a2e39',
    };
}

// ─── Chart Renderers ───────────────────────────────────────────────────────────

function drawGrid(ctx, chartX, chartY, chartW, chartH, cols, rows, tc) {
    ctx.strokeStyle = tc.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= rows; i++) {
        const y = chartY + (chartH / rows) * i;
        ctx.beginPath(); ctx.moveTo(chartX, y); ctx.lineTo(chartX + chartW, y); ctx.stroke();
    }
    for (let i = 0; i <= cols; i++) {
        const x = chartX + (chartW / cols) * i;
        ctx.beginPath(); ctx.moveTo(x, chartY); ctx.lineTo(x, chartY + chartH); ctx.stroke();
    }
}

function drawPriceAxis(ctx, chartX, chartY, chartW, chartH, minP, maxP, tc) {
    const steps = 6;
    ctx.fillStyle = tc.subText;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i <= steps; i++) {
        const price = minP + (maxP - minP) * (1 - i / steps);
        const y = chartY + (chartH / steps) * i;
        ctx.fillText(price >= 1000 ? price.toFixed(0) : price >= 1 ? price.toFixed(2) : price.toFixed(4), chartX + chartW + 6, y + 4);
    }
}

function drawTimeAxis(ctx, chartX, chartY, chartW, chartH, candles, tc) {
    ctx.fillStyle = tc.subText;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const step = Math.floor(candles.length / 5);
    for (let i = 0; i < candles.length; i += step) {
        const x = chartX + (i / (candles.length - 1)) * chartW;
        const d = new Date(candles[i].time);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        ctx.fillText(label, x, chartY + chartH + 16);
    }
}

function mapPrice(price, minP, maxP, chartY, chartH) {
    return chartY + chartH - ((price - minP) / (maxP - minP)) * chartH;
}

function drawCandlesticks(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc) {
    const n = candles.length;
    const candleW = Math.max(1, Math.floor(chartW / n) - 1);
    const halfW = Math.max(0.5, candleW / 2 - 0.5);

    candles.forEach((c, i) => {
        const x = chartX + (i / n) * chartW + (chartW / n) / 2;
        const isUp = c.close >= c.open;
        const color = isUp ? tc.upColor : tc.downColor;
        const wickColor = isUp ? tc.upWick : tc.downWick;

        // Wick
        const highY = mapPrice(c.high, minP, maxP, chartY, chartH);
        const lowY = mapPrice(c.low, minP, maxP, chartY, chartH);
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, highY); ctx.lineTo(x, lowY); ctx.stroke();

        // Body
        const openY = mapPrice(c.open, minP, maxP, chartY, chartH);
        const closeY = mapPrice(c.close, minP, maxP, chartY, chartH);
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(1, Math.abs(closeY - openY));
        ctx.fillStyle = isUp ? color : color;
        ctx.strokeStyle = color;
        if (bodyH < 1.5) {
            ctx.fillRect(x - halfW, bodyTop - 0.5, candleW, 1.5);
        } else {
            if (isUp) {
                ctx.strokeRect(x - halfW, bodyTop, candleW, bodyH);
            } else {
                ctx.fillRect(x - halfW, bodyTop, candleW, bodyH);
            }
        }
    });
}

function drawLine(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc) {
    const closes = candles.map(c => c.close);
    ctx.strokeStyle = '#2962ff';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    candles.forEach((c, i) => {
        const x = chartX + (i / (candles.length - 1)) * chartW;
        const y = mapPrice(c.close, minP, maxP, chartY, chartH);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function drawArea(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc) {
    const baseY = chartY + chartH;
    const grad = ctx.createLinearGradient(0, chartY, 0, baseY);
    grad.addColorStop(0, 'rgba(41,98,255,0.4)');
    grad.addColorStop(1, 'rgba(41,98,255,0)');

    ctx.beginPath();
    candles.forEach((c, i) => {
        const x = chartX + (i / (candles.length - 1)) * chartW;
        const y = mapPrice(c.close, minP, maxP, chartY, chartH);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    const lastX = chartX + chartW;
    ctx.lineTo(lastX, baseY); ctx.lineTo(chartX, baseY); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    drawLine(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc);
}

function drawHeikinAshi(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc) {
    const haCandles = candles.map((c, i) => {
        const haClose = (c.open + c.high + c.low + c.close) / 4;
        const haOpen = i === 0 ? (c.open + c.close) / 2 :
            (candles[i - 1].open + candles[i - 1].close) / 2;
        const haHigh = Math.max(c.high, haOpen, haClose);
        const haLow = Math.min(c.low, haOpen, haClose);
        return { ...c, open: haOpen, high: haHigh, low: haLow, close: haClose };
    });
    drawCandlesticks(ctx, haCandles, chartX, chartY, chartW, chartH, minP, maxP, tc);
}

function drawVolumeBars(ctx, candles, chartX, chartY, chartW, chartH, tc) {
    const maxVol = Math.max(...candles.map(c => c.volume));
    const n = candles.length;
    const barW = Math.max(1, Math.floor(chartW / n) - 1);

    candles.forEach((c, i) => {
        const x = chartX + (i / n) * chartW;
        const barH = (c.volume / maxVol) * chartH * 0.9;
        ctx.fillStyle = c.close >= c.open ? tc.volumeUp : tc.volumeDown;
        ctx.fillRect(x, chartY + chartH - barH, barW, barH);
    });
}

function drawSMAOverlay(ctx, closes, period, color, chartX, chartY, chartW, chartH, minP, maxP) {
    const sma = calcSMA(closes, period);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    sma.forEach((v, i) => {
        if (v === null) return;
        const x = chartX + (i / (sma.length - 1)) * chartW;
        const y = mapPrice(v, minP, maxP, chartY, chartH);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function drawBBOverlay(ctx, closes, chartX, chartY, chartW, chartH, minP, maxP, tc) {
    const bb = calcBB(closes);
    ['upper', 'middle', 'lower'].forEach((band, bi) => {
        const colors = ['rgba(123,97,255,0.6)', 'rgba(123,97,255,0.9)', 'rgba(123,97,255,0.6)'];
        ctx.strokeStyle = colors[bi];
        ctx.lineWidth = bi === 1 ? 1.5 : 1;
        ctx.setLineDash(bi === 1 ? [4, 4] : []);
        ctx.beginPath();
        let started = false;
        bb.forEach((v, i) => {
            if (v[band] === null) return;
            const x = chartX + (i / (bb.length - 1)) * chartW;
            const y = mapPrice(v[band], minP, maxP, chartY, chartH);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke(); ctx.setLineDash([]);
    });
}

function drawRSIPane(ctx, closes, paneX, paneY, paneW, paneH, tc) {
    const rsi = calcRSI(closes);
    // Draw pane bg
    ctx.fillStyle = tc.toolbar;
    ctx.fillRect(paneX, paneY, paneW, paneH);
    // Grid lines at 30/50/70
    [30, 50, 70].forEach(level => {
        const y = paneY + paneH - (level / 100) * paneH;
        ctx.strokeStyle = level === 50 ? tc.grid : (level === 30 || level === 70 ? 'rgba(239,83,80,0.2)' : tc.grid);
        ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(paneX, y); ctx.lineTo(paneX + paneW, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = tc.subText; ctx.font = '9px monospace'; ctx.textAlign = 'right';
        ctx.fillText(level, paneX - 4, y + 3);
    });
    // RSI line
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); let started = false;
    rsi.forEach((v, i) => {
        if (v === null) return;
        const x = paneX + (i / (rsi.length - 1)) * paneW;
        const y = paneY + paneH - (v / 100) * paneH;
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Label
    ctx.fillStyle = '#e040fb'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('RSI(14)', paneX + 6, paneY + 14);
}

function drawMACDPane(ctx, closes, paneX, paneY, paneW, paneH, tc) {
    const macd = calcMACD(closes);
    ctx.fillStyle = tc.toolbar;
    ctx.fillRect(paneX, paneY, paneW, paneH);

    // Zero line
    const zeroY = paneY + paneH / 2;
    ctx.strokeStyle = tc.axisLine; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(paneX, zeroY); ctx.lineTo(paneX + paneW, zeroY); ctx.stroke();

    const vals = macd.flatMap(v => [v.macd, v.signal, v.hist]).filter(Boolean);
    const maxV = Math.max(...vals.map(Math.abs)) || 1;

    const mapMACD = v => paneY + paneH / 2 - (v / maxV) * (paneH / 2);

    // Histogram bars
    const barW = Math.max(1, Math.floor(paneW / macd.length) - 1);
    macd.forEach((v, i) => {
        const x = paneX + (i / macd.length) * paneW;
        const y = mapMACD(v.hist);
        ctx.fillStyle = v.hist >= 0 ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)';
        ctx.fillRect(x, Math.min(y, zeroY), barW, Math.abs(y - zeroY));
    });

    // MACD line
    ctx.strokeStyle = '#2196f3'; ctx.lineWidth = 1.5;
    ctx.beginPath(); let s1 = false;
    macd.forEach((v, i) => {
        const x = paneX + (i / (macd.length - 1)) * paneW;
        const y = mapMACD(v.macd);
        if (!s1) { ctx.moveTo(x, y); s1 = true; } else ctx.lineTo(x, y);
    }); ctx.stroke();

    // Signal line
    ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 1.5;
    ctx.beginPath(); let s2 = false;
    macd.forEach((v, i) => {
        const x = paneX + (i / (macd.length - 1)) * paneW;
        const y = mapMACD(v.signal);
        if (!s2) { ctx.moveTo(x, y); s2 = true; } else ctx.lineTo(x, y);
    }); ctx.stroke();

    ctx.fillStyle = '#2196f3'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('MACD(12,26,9)', paneX + 6, paneY + 14);
}

// ─── Main Chart Builder ────────────────────────────────────────────────────────

async function generateChart({
    symbol = 'BINANCE:BTCUSDT',
    interval = '1D',
    width = 800,
    height = 600,
    style = 'candle',
    theme = 'dark',
    studies = [],
    format = 'png',
} = {}) {
    const tc = getTheme(theme);
    const candles = await fetchOHLCV(symbol, interval, 150);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Normalize studies
    const studyNames = (Array.isArray(studies)
        ? studies.map(s => typeof s === 'string' ? s : (s.name || ''))
        : typeof studies === 'string' ? [studies] : []
    ).map(s => s.toLowerCase());

    // Determine panes
    const hasRSI = studyNames.some(s => s.includes('rsi') || s.includes('relative strength'));
    const hasMACD = studyNames.some(s => s.includes('macd'));
    const extraPanes = (hasRSI ? 1 : 0) + (hasMACD ? 1 : 0);
    const paneH = extraPanes > 0 ? Math.floor(height * 0.22) : 0;
    const mainH = height - paneH * extraPanes;

    // Layout
    const PAD = { top: 50, right: 70, bottom: 30, left: 10 };
    const chartX = PAD.left;
    const chartY = PAD.top;
    const chartW = width - PAD.left - PAD.right;
    const chartH = mainH - PAD.top - PAD.bottom;

    // Background
    ctx.fillStyle = tc.bg;
    ctx.fillRect(0, 0, width, height);

    // Toolbar bar
    ctx.fillStyle = tc.toolbar;
    ctx.fillRect(0, 0, width, 40);

    // Symbol + interval info in toolbar
    ctx.fillStyle = tc.text;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(symbol, 14, 26);
    ctx.fillStyle = tc.subText;
    ctx.font = '12px monospace';
    ctx.fillText(`• ${interval}`, 14 + ctx.measureText(symbol).width + 8, 26);

    // Live badge
    const lastCandle = candles[candles.length - 1];
    const price = lastCandle.close;
    const prevClose = candles[candles.length - 2]?.close || price;
    const change = ((price - prevClose) / prevClose * 100).toFixed(2);
    const isUp = parseFloat(change) >= 0;
    const priceStr = price >= 1000 ? price.toFixed(2) : price >= 1 ? price.toFixed(4) : price.toFixed(6);
    ctx.fillStyle = isUp ? tc.upColor : tc.downColor;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${priceStr}  ${isUp ? '+' : ''}${change}%`, width - PAD.right - 6, 26);

    // Price range for main chart
    let minP = Math.min(...candles.map(c => c.low));
    let maxP = Math.max(...candles.map(c => c.high));
    const pad = (maxP - minP) * 0.05;
    minP -= pad; maxP += pad;

    // Grid
    drawGrid(ctx, chartX, chartY, chartW, chartH, 6, 6, tc);

    // Border on chart
    ctx.strokeStyle = tc.axisLine; ctx.lineWidth = 1;
    ctx.strokeRect(chartX, chartY, chartW, chartH);

    // Volume (always in background)
    const hasVolume = studyNames.some(s => s.includes('volume')) || studies.length === 0;
    if (hasVolume) {
        const volH = Math.floor(chartH * 0.15);
        drawVolumeBars(ctx, candles, chartX, chartY + chartH - volH, chartW, volH, tc);
    }

    // Main chart style
    if (style === 'line') {
        drawLine(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc);
    } else if (style === 'area') {
        drawArea(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc);
    } else if (style === 'heikinAshi') {
        drawHeikinAshi(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc);
    } else {
        drawCandlesticks(ctx, candles, chartX, chartY, chartW, chartH, minP, maxP, tc);
    }

    // Overlays
    const closes = candles.map(c => c.close);
    if (studyNames.some(s => s.includes('bollinger') || s === 'bb')) {
        drawBBOverlay(ctx, closes, chartX, chartY, chartW, chartH, minP, maxP, tc);
    }
    if (studyNames.some(s => s.includes('ema') || s.includes('moving average exponential'))) {
        drawSMAOverlay(ctx, closes, 12, '#f39c12', chartX, chartY, chartW, chartH, minP, maxP);
        drawSMAOverlay(ctx, closes, 26, '#2980b9', chartX, chartY, chartW, chartH, minP, maxP);
    }
    if (studyNames.some(s => s === 'ma' || s.includes('moving average') && !s.includes('exp'))) {
        drawSMAOverlay(ctx, closes, 20, '#9b59b6', chartX, chartY, chartW, chartH, minP, maxP);
        drawSMAOverlay(ctx, closes, 50, '#e74c3c', chartX, chartY, chartW, chartH, minP, maxP);
    }

    // Price & time axes
    drawPriceAxis(ctx, chartX, chartY, chartW, chartH, minP, maxP, tc);
    drawTimeAxis(ctx, chartX, chartY, chartW, chartH, candles, tc);

    // Extra indicator panes
    let currentPaneY = mainH;
    if (hasRSI) {
        drawRSIPane(ctx, closes, chartX, currentPaneY, chartW, paneH - 10, tc);
        currentPaneY += paneH;
    }
    if (hasMACD) {
        drawMACDPane(ctx, closes, chartX, currentPaneY, chartW, paneH - 10, tc);
    }

    // ChartSnap watermark
    ctx.fillStyle = 'rgba(120,123,134,0.3)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('chartsnap.dev', width - PAD.right - 6, height - 8);

    // Render
    if (format === 'jpeg') {
        return { buffer: await canvas.encode('jpeg', 90), type: 'jpeg' };
    }
    return { buffer: await canvas.encode('png'), type: 'png' };
}

// ─── Mini Chart ────────────────────────────────────────────────────────────────

async function generateMiniChart({
    symbol = 'BINANCE:BTCUSDT',
    interval = '1D',
    width = 600,
    height = 300,
    theme = 'dark',
} = {}) {
    const tc = getTheme(theme);
    const candles = await fetchOHLCV(symbol, interval, 90);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = tc.bg;
    ctx.fillRect(0, 0, width, height);

    const lastCandle = candles[candles.length - 1];
    const price = lastCandle.close;
    const firstClose = candles[0].close;
    const isUp = price >= firstClose;
    const change = ((price - firstClose) / firstClose * 100).toFixed(2);

    // Draw info header
    ctx.fillStyle = tc.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(symbol, 14, 28);
    const priceStr = price >= 1000 ? price.toFixed(2) : price.toFixed(4);
    ctx.fillStyle = isUp ? tc.upColor : tc.downColor;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(priceStr, 14, 56);
    ctx.font = '13px monospace';
    ctx.fillText(`${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${change}%`, 14, 76);

    // Mini area chart
    const chartPad = { left: 14, right: 14, top: 90, bottom: 20 };
    const cW = width - chartPad.left - chartPad.right;
    const cH = height - chartPad.top - chartPad.bottom;
    const closes = candles.map(c => c.close);
    const minC = Math.min(...closes);
    const maxC = Math.max(...closes);
    const range = maxC - minC || 1;

    const lineColor = isUp ? '#26a69a' : '#ef5350';
    const grad = ctx.createLinearGradient(0, chartPad.top, 0, chartPad.top + cH);
    grad.addColorStop(0, isUp ? 'rgba(38,166,154,0.35)' : 'rgba(239,83,80,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    closes.forEach((v, i) => {
        const x = chartPad.left + (i / (closes.length - 1)) * cW;
        const y = chartPad.top + cH - ((v - minC) / range) * cH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    const lastX = chartPad.left + cW;
    const firstX = chartPad.left;
    ctx.lineTo(lastX, chartPad.top + cH);
    ctx.lineTo(firstX, chartPad.top + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    closes.forEach((v, i) => {
        const x = chartPad.left + (i / (closes.length - 1)) * cW;
        const y = chartPad.top + cH - ((v - minC) / range) * cH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(120,123,134,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('chartsnap.dev', width - 8, height - 5);

    return await canvas.encode('png');
}

module.exports = { generateChart, generateMiniChart };
