/**
 * ChartSnap Screenshot Engine
 * Uses Puppeteer + TradingView to capture REAL chart images.
 * Standard charts: screenshots TradingView advanced chart
 * Layout charts: screenshots the user's saved TradingView layout
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

process.env.PUPPETEER_CACHE_DIR = '/tmp/chartsnap-run/.cache';
const puppeteer = require('puppeteer');

// Chrome user data dir — must be writable. /tmp is always allowed in this env.
const CHROME_DATA_DIR = '/tmp/chartsnap-run/.chrome';
fs.mkdirSync(CHROME_DATA_DIR, { recursive: true });

// ─── Browser Singleton ──────────────────────────────────────────────────────
let _executablePath = null;
function getHeadlessShellPath() {
    if (_executablePath) return _executablePath;
    try {
        _executablePath = puppeteer.executablePath('chrome-headless-shell');
    } catch (_) {
        const { execSync } = require('child_process');
        const cache = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');
        const result = execSync(`find "${cache}/chrome-headless-shell" -name "chrome-headless-shell" -type f 2>/dev/null | head -1`).toString().trim();
        _executablePath = result || null;
    }
    if (!_executablePath) throw new Error('chrome-headless-shell not found. Run: npx puppeteer browsers install chrome-headless-shell');
    return _executablePath;
}

let _browser = null;
async function getBrowser() {
    if (_browser) {
        try {
            // Check if browser is still alive
            await _browser.version();
            return _browser;
        } catch {
            _browser = null;
        }
    }
    _browser = await puppeteer.launch({
        headless: 'shell',
        executablePath: getHeadlessShellPath(),
        userDataDir: CHROME_DATA_DIR,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--disable-gpu',
            '--window-size=1920,1080',
        ]
    });
    return _browser;
}

// ─── TradingView Interval IDs ───────────────────────────────────────────────
// TradingView uses these in the URL query param
const TV_INTERVAL_MAP = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', '45m': '45',
    '1h': '60', '2h': '120', '3h': '180', '4h': '240',
    '6h': '360', '8h': '480', '12h': '720',
    '1D': 'D', '2D': '2D', '3D': '3D', '1W': 'W', '1M': 'M',
    '3M': '3M', '6M': '6M', '1Y': '12M',
};

// CSS to hide all TradingView UI chrome and expose only the chart canvas
const HIDE_UI_CSS = `
    /* Toolbar, header, sidebars, footers, popups */
    #header-toolbar-news,
    #header-toolbar-alerts,
    #header-toolbar-calendar,
    #header-toolbar-screenshot,
    #header-toolbar-publish,
    #header-toolbar-save-load,
    .header-chart-panel,
    .chart-toolbar,
    [class*="header-MainSeriesHover"],
    .layout__area--left,
    .layout__area--right,
    .layout__area--bottom,
    .widgetbar-wrap,
    #footer,
    #layout-top-area,
    header,
    .tv-header,
    .tv-dialogs,
    .tv-toasts,
    #cookie-banner,
    [data-role="toast-container"],
    .toast-container,
    [class*="Toast"],
    [class*="dialog"],
    [class*="Dialog"],
    .tv-dialog,
    .tv-widget-watchlist,
    [class*="loadingScreen"],
    [class*="LoadingScreen"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
    }

    /* Force chart center to fill the entire viewport */
    .layout__area--center,
    [class*="chart-container"],
    [class*="ChartContainer"] {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        right: 0 !important; bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
        overflow: hidden !important;
    }

    body, html {
        overflow: hidden !important;
        background: #131722 !important;
    }
`;

// ─── Standard Chart Screenshot (no layout) ──────────────────────────────────
// Navigates to tradingview.com/chart/ with the given symbol+interval
async function generateChart({
    symbol = 'BINANCE:BTCUSDT',
    interval = '1D',
    width = 800,
    height = 600,
    theme = 'dark',
    format = 'png',
} = {}) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: parseInt(width), height: parseInt(height) });

        const tvInterval = TV_INTERVAL_MAP[interval] || 'D';
        const encodedSymbol = encodeURIComponent(symbol);

        // Use TradingView's direct chart URL
        const url = `https://www.tradingview.com/chart/?symbol=${encodedSymbol}&interval=${tvInterval}&theme=${theme}`;
        console.log(`[Chart] Navigating to ${url}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for the chart to be present
        await page.waitForSelector('.chart-container, .layout__area--center, canvas', { timeout: 20000 });

        // Inject CSS to hide all UI
        await page.addStyleTag({ content: HIDE_UI_CSS });

        // Wait for chart to re-render and stabilise
        await new Promise(r => setTimeout(r, 3000));

        // Dismiss any pop-ups or cookie banners
        await page.evaluate(() => {
            document.querySelectorAll('[data-name="close"], .js-button-close, .close-button').forEach(el => el.click());
        });

        await new Promise(r => setTimeout(r, 500));

        const buffer = await page.screenshot({ type: format === 'jpeg' ? 'jpeg' : 'png', quality: format === 'jpeg' ? 92 : undefined, fullPage: false });

        return { buffer, type: format === 'jpeg' ? 'jpeg' : 'png' };

    } finally {
        await page.close();
    }
}

// ─── Mini Chart Screenshot ───────────────────────────────────────────────────
// Same as above but for smaller sizes using TradingView widget
async function generateMiniChart({
    symbol = 'BINANCE:BTCUSDT',
    interval = '1D',
    width = 600,
    height = 300,
    theme = 'dark',
} = {}) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: parseInt(width), height: parseInt(height) });

        const tvInterval = TV_INTERVAL_MAP[interval] || 'D';
        const encodedSymbol = encodeURIComponent(symbol);
        const url = `https://www.tradingview.com/chart/?symbol=${encodedSymbol}&interval=${tvInterval}&theme=${theme}`;

        console.log(`[MiniChart] Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.chart-container, .layout__area--center, canvas', { timeout: 20000 });
        await page.addStyleTag({ content: HIDE_UI_CSS });
        await new Promise(r => setTimeout(r, 2500));

        const buffer = await page.screenshot({ type: 'png', fullPage: false });
        return buffer;

    } finally {
        await page.close();
    }
}

// ─── Layout Chart Screenshot (User's saved TradingView layout) ──────────────
async function generateLayoutChart({ layout, symbol, interval, range, width = 1920, height = 1080 }) {
    if (!layout) throw new Error('Layout ID is required');
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: parseInt(width), height: parseInt(height) });

        let url = `https://in.tradingview.com/chart/${layout}/`;
        const params = new URLSearchParams();
        if (symbol) params.append('symbol', symbol);
        if (interval) {
            const tvInterval = TV_INTERVAL_MAP[interval] || interval;
            params.append('interval', tvInterval);
        }
        if ([...params].length > 0) url += `?${params.toString()}`;

        console.log(`[Layout] Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for the main chart area
        await page.waitForSelector('.layout__area--center', { timeout: 20000 });

        // Inject UI-hiding CSS  
        await page.addStyleTag({ content: HIDE_UI_CSS });

        // Handle Date Range (e.g., 1D, 5D, 1M, YTD, ALL)
        if (range) {
            const rangeTarget = range.trim().toUpperCase();
            console.log(`[Layout] Applying date range: ${rangeTarget}`);

            // Wait for bottom toolbar buttons to appear
            await page.waitForFunction(() => {
                const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
                return btns.some(b => b.textContent && b.textContent.trim().toUpperCase() === '1D');
            }, { timeout: 10000 }).catch(() => console.log('[Layout] Date range buttons not found or took too long'));

            // Click the matching button closest to the bottom (to avoid clicking top interval if text matches)
            await page.evaluate((r) => {
                const btns = Array.from(document.querySelectorAll('button, div[role="button"]'))
                    .filter(b => b.textContent && b.textContent.trim().toUpperCase() === r);

                if (btns.length === 1) {
                    btns[0].click();
                } else if (btns.length > 1) {
                    // Sort by bottom Y coordinate descending (closest to bottom of window)
                    const lowerBtn = btns.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
                    if (lowerBtn) lowerBtn.click();
                }
            }, rangeTarget);

            // Wait for chart to re-render after range change
            await new Promise(r => setTimeout(r, 2000));
        }

        // Let chart re-render after CSS injection
        await new Promise(r => setTimeout(r, 2500));

        // Screenshot just the chart center area
        const element = await page.$('.layout__area--center');
        if (!element) {
            // Fallback: screenshot full page
            const buffer = await page.screenshot({ type: 'png', fullPage: false });
            return { buffer, type: 'png' };
        }

        const buffer = await element.screenshot({ type: 'png' });
        return { buffer, type: 'png' };

    } finally {
        await page.close();
    }
}

module.exports = {
    generateChart,
    generateMiniChart,
    generateLayoutChart
};
