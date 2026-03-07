import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Copy, Check, Code2, Terminal, Zap, BookOpen, Key, AlertCircle,
    Clock, LayoutTemplate, LineChart, BarChart2, ChevronRight, ExternalLink,
    Globe, Activity, Info
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */

const INTERVALS = [
    { val: '1m', label: '1 Minute' }, { val: '3m', label: '3 Minute' },
    { val: '5m', label: '5 Minute' }, { val: '15m', label: '15 Minute' },
    { val: '30m', label: '30 Minute' }, { val: '45m', label: '45 Minute' },
    { val: '1h', label: '1 Hour' }, { val: '2h', label: '2 Hour' },
    { val: '3h', label: '3 Hour' }, { val: '4h', label: '4 Hour' },
    { val: '1D', label: 'Daily' }, { val: '2D', label: '2 Day' },
    { val: '1W', label: 'Weekly' }, { val: '1M', label: 'Monthly' },
    { val: '3M', label: '3 Month' }, { val: '6M', label: '6 Month' },
    { val: '1Y', label: 'Yearly' },
];

const DATE_RANGES = [
    { val: '1D', label: '1 Day' }, { val: '5D', label: '5 Days' },
    { val: '1M', label: '1 Month' }, { val: '3M', label: '3 Months' },
    { val: '6M', label: '6 Months' }, { val: 'YTD', label: 'Year to Date' },
    { val: '1Y', label: '1 Year' }, { val: 'ALL', label: 'All Time' },
];

const ERRORS = [
    { code: '400', title: 'Bad Request', desc: 'Missing a required field such as layoutId, or an invalid parameter value was provided.' },
    { code: '401', title: 'Unauthorized', desc: 'No API key was provided. Include Authorization: Bearer <token> header.' },
    { code: '403', title: 'Forbidden', desc: 'The API key is invalid, revoked, or belongs to an inactive tenant.' },
    { code: '404', title: 'Not Found', desc: 'The job ID or result artifact could not be found.' },
    { code: '422', title: 'Unprocessable Entity', desc: 'Request body is missing required fields (engine, output, data) for async render jobs.' },
    { code: '429', title: 'Too Many Requests', desc: 'You have exceeded the rate limit. Check X-RateLimit-Remaining and wait for retryAfter seconds.' },
    { code: '500', title: 'Internal Server Error', desc: 'Puppeteer encountered an error loading TradingView. Usually caused by network issues or an invalid layout ID.' },
];

const ENDPOINTS = [
    {
        id: 'layout-chart',
        method: 'GET',
        path: '/v1/tradingview/layout-chart/:layoutId',
        badge: 'Layout',
        badgeColor: 'violet',
        icon: LayoutTemplate,
        tagline: 'Screenshot a saved TradingView layout',
        desc: 'Navigates to your shared TradingView layout URL, hides all UI chrome, optionally applies a date range, and returns a pixel-perfect PNG. This is the most powerful endpoint — your custom indicators, drawings, and settings are all preserved.',
        params: [
            { name: 'layoutId', in: 'path', required: true, type: 'string', default: '—', desc: 'The layout ID from your TradingView URL. Found at tradingview.com/chart/{layoutId}/. Share your chart to make it publicly accessible.' },
            { name: 'symbol', in: 'query', required: false, type: 'string', default: 'layout default', desc: 'Override the chart symbol without changing your saved layout. Format: EXCHANGE:TICKER e.g. BINANCE:BTCUSDT, NSE:SAIL, NASDAQ:AAPL.' },
            { name: 'interval', in: 'query', required: false, type: 'string', default: '1D', desc: 'Time interval for the candles. See the Intervals Reference table below for all accepted values.' },
            { name: 'range', in: 'query', required: false, type: 'string', default: 'layout default', desc: 'Date range to display. Puppeteer clicks the matching button in TradingView\'s bottom toolbar. See Date Ranges Reference.' },
            { name: 'width', in: 'query', required: false, type: 'integer', default: '1920', desc: 'Output image width in pixels. The browser viewport is set to this width.' },
            { name: 'height', in: 'query', required: false, type: 'integer', default: '1080', desc: 'Output image height in pixels. The browser viewport is set to this height.' },
            { name: 'theme', in: 'query', required: false, type: 'string', default: 'dark', desc: 'Color theme. Accepts: dark or light.' },
        ],
        response: { type: 'image/png', extra: 'X-Layout-Id: {layoutId} response header is included.' },
        examples: {
            curl: `curl "http://localhost:3000/v1/tradingview/layout-chart/hMZXawOv\\
  ?symbol=NSE:SAIL\\
  &interval=1D\\
  &range=1Y\\
  &theme=dark\\
  &width=1920&height=1080" \\
  --output chart.png`,
            javascript: `const params = new URLSearchParams({
  symbol: 'NSE:SAIL',
  interval: '1D',
  range: '1Y',
  theme: 'dark',
  width: 1920,
  height: 1080,
});

const resp = await fetch(
  \`http://localhost:3000/v1/tradingview/layout-chart/hMZXawOv?\${params}\`
);

if (!resp.ok) {
  const err = await resp.json();
  throw new Error(err.message);
}

const blob = await resp.blob();
const imageUrl = URL.createObjectURL(blob);
document.getElementById('chart-img').src = imageUrl;`,
            python: `import requests

resp = requests.get(
    "http://localhost:3000/v1/tradingview/layout-chart/hMZXawOv",
    params={
        "symbol": "NSE:SAIL",
        "interval": "1D",
        "range": "1Y",
        "theme": "dark",
        "width": 1920,
        "height": 1080,
    },
    timeout=60,
)
resp.raise_for_status()

with open("chart.png", "wb") as f:
    f.write(resp.content)

print("Saved chart.png")`,
        },
    },
    {
        id: 'advanced-chart',
        method: 'GET',
        path: '/v1/tradingview/advanced-chart',
        badge: 'Advanced',
        badgeColor: 'cyan',
        icon: BarChart2,
        tagline: 'Generate a chart for any symbol',
        desc: 'Opens TradingView\'s advanced chart for any symbol and interval, hides the UI, and returns a PNG or JPEG. Ideal for generating charts without a saved layout — works with any exchange and symbol.',
        params: [
            { name: 'symbol', in: 'query', required: false, type: 'string', default: 'BINANCE:BTCUSDT', desc: 'The charting symbol. Format: EXCHANGE:TICKER. Supports 500+ exchanges including NSE, BSE, BINANCE, NASDAQ, NYSE, FOREX.' },
            { name: 'interval', in: 'query', required: false, type: 'string', default: '1D', desc: 'Time interval for the candles. See the Intervals Reference table below.' },
            { name: 'width', in: 'query', required: false, type: 'integer', default: '800', desc: 'Output image width in pixels.' },
            { name: 'height', in: 'query', required: false, type: 'integer', default: '600', desc: 'Output image height in pixels.' },
            { name: 'theme', in: 'query', required: false, type: 'string', default: 'dark', desc: 'Color theme. Accepts: dark or light.' },
            { name: 'format', in: 'query', required: false, type: 'string', default: 'png', desc: 'Output format. Accepts: png or jpeg. JPEG is smaller but lossy (quality=92).' },
        ],
        response: { type: 'image/png or image/jpeg depending on format param.' },
        examples: {
            curl: `# BTC/USDT daily chart, dark theme, 1200×800
curl "http://localhost:3000/v1/tradingview/advanced-chart\\
  ?symbol=BINANCE:BTCUSDT\\
  &interval=1D\\
  &theme=dark\\
  &width=1200&height=800\\
  &format=png" \\
  --output btc_chart.png`,
            javascript: `const url = new URL(
  'http://localhost:3000/v1/tradingview/advanced-chart'
);
url.searchParams.set('symbol', 'BINANCE:BTCUSDT');
url.searchParams.set('interval', '1D');
url.searchParams.set('theme', 'dark');
url.searchParams.set('width', '1200');
url.searchParams.set('height', '800');

const resp = await fetch(url.toString());
const arrayBuffer = await resp.arrayBuffer();

// Save or process the PNG buffer
const buffer = Buffer.from(arrayBuffer);
require('fs').writeFileSync('chart.png', buffer);`,
            python: `import requests

resp = requests.get(
    "http://localhost:3000/v1/tradingview/advanced-chart",
    params={
        "symbol": "NASDAQ:AAPL",
        "interval": "1W",
        "theme": "light",
        "width": 1200,
        "height": 800,
        "format": "jpeg",
    },
    timeout=60,
)
resp.raise_for_status()

with open("aapl_weekly.jpg", "wb") as f:
    f.write(resp.content)`,
        },
    },
    {
        id: 'mini-chart',
        method: 'GET',
        path: '/v1/tradingview/mini-chart',
        badge: 'Mini',
        badgeColor: 'emerald',
        icon: LineChart,
        tagline: 'Compact thumbnail-sized chart',
        desc: 'Same as advanced-chart but optimized for smaller dimensions. Perfect for generating chart thumbnails, preview images in lists, or compact chart cards in a dashboard UI. Waits 2.5s for render (vs 3s for advanced) to reduce latency on smaller outputs.',
        params: [
            { name: 'symbol', in: 'query', required: false, type: 'string', default: 'BINANCE:BTCUSDT', desc: 'The charting symbol. Format: EXCHANGE:TICKER.' },
            { name: 'interval', in: 'query', required: false, type: 'string', default: '1D', desc: 'Time interval for the candles.' },
            { name: 'width', in: 'query', required: false, type: 'integer', default: '600', desc: 'Output image width in pixels. Keep under 800 for best results.' },
            { name: 'height', in: 'query', required: false, type: 'integer', default: '300', desc: 'Output image height in pixels. Keep under 500 for best results.' },
            { name: 'theme', in: 'query', required: false, type: 'string', default: 'dark', desc: 'Color theme. Accepts: dark or light.' },
        ],
        response: { type: 'image/png' },
        examples: {
            curl: `# Compact BTC chart thumbnail
curl "http://localhost:3000/v1/tradingview/mini-chart\\
  ?symbol=BINANCE:BTCUSDT\\
  &interval=1D\\
  &theme=dark\\
  &width=600&height=300" \\
  --output btc_mini.png`,
            javascript: `// Generate thumbnails for a list of symbols
const symbols = ['BINANCE:BTCUSDT', 'NSE:SAIL', 'NASDAQ:AAPL'];

const charts = await Promise.all(
  symbols.map(async (symbol) => {
    const resp = await fetch(
      \`http://localhost:3000/v1/tradingview/mini-chart?symbol=\${symbol}&interval=1D\`
    );
    const blob = await resp.blob();
    return { symbol, url: URL.createObjectURL(blob) };
  })
);`,
            python: `import requests, os

symbols = ["BINANCE:BTCUSDT", "NSE:SAIL", "NASDAQ:AAPL"]
os.makedirs("thumbnails", exist_ok=True)

for symbol in symbols:
    r = requests.get(
        "http://localhost:3000/v1/tradingview/mini-chart",
        params={"symbol": symbol, "interval": "1D"},
        timeout=60,
    )
    r.raise_for_status()
    fname = symbol.replace(":", "_") + ".png"
    open(f"thumbnails/{fname}", "wb").write(r.content)
    print(f"Saved {fname}")`,
        },
    },
];

const NAV_SECTIONS = [
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'rate-limiting', label: 'Rate Limiting', icon: Activity },
    { id: 'endpoints', label: 'Endpoints', icon: Code2 },
    { id: 'layout-chart', label: '↳ layout-chart', sub: true },
    { id: 'advanced-chart', label: '↳ advanced-chart', sub: true },
    { id: 'mini-chart', label: '↳ mini-chart', sub: true },
    { id: 'intervals', label: 'Intervals Reference', icon: Clock },
    { id: 'errors', label: 'Error Codes', icon: AlertCircle },
    { id: 'async', label: 'Async Jobs (v2)', icon: BookOpen },
];

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════════ */

function CopyBtn({ text, className = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-all ${className}`}>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

const BADGE_COLORS = {
    violet: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    cyan: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    green: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
};

function MethodBadge({ method }) {
    return (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
            {method}
        </span>
    );
}

function CodeBlock({ code, lang = 'bash' }) {
    return (
        <div className="relative rounded-xl overflow-hidden bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">{lang}</span>
                <CopyBtn text={code} />
            </div>
            <pre className="p-4 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto leading-7 whitespace-pre">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function InfoBox({ icon: Icon = Info, color = 'blue', children }) {
    const colors = {
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
    };
    return (
        <div className={`flex gap-3 p-4 rounded-xl border ${colors[color]}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{children}</p>
        </div>
    );
}

function ParamRow({ p }) {
    return (
        <tr className="border-b border-white/[0.05] last:border-0 hover:bg-black/[0.02] dark:bg-white/[0.02] transition-colors">
            <td className="py-3 pr-4 align-top">
                <div className="flex flex-col gap-1">
                    <code className="text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded text-xs font-mono w-fit">{p.name}</code>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold pl-0.5">
                        {p.in === 'path' ? '📍 path' : '🔍 query'}
                    </span>
                </div>
            </td>
            <td className="py-3 pr-4 align-top">
                <div className="flex flex-col gap-1">
                    {p.required
                        ? <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">required</span>
                        : <span className="text-[10px] text-gray-600 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">optional</span>
                    }
                    <span className="text-[10px] text-gray-600 font-mono pl-0.5">{p.type}</span>
                </div>
            </td>
            <td className="py-3 pr-4 align-top">
                <code className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-black/[0.03] dark:bg-white/[0.03] px-1.5 py-0.5 rounded">{p.default}</code>
            </td>
            <td className="py-3 align-top text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</td>
        </tr>
    );
}

function EndpointSection({ ep }) {
    const [lang, setLang] = useState('curl');
    const Icon = ep.icon;
    const langs = ['curl', 'javascript', 'python'];

    return (
        <section id={ep.id} className="scroll-mt-8 space-y-6">
            {/* Endpoint header */}
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.07] bg-gradient-to-r from-white/[0.02] to-transparent">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${BADGE_COLORS[ep.badgeColor]}`}>
                            <Icon className="w-3.5 h-3.5" /> {ep.badge}
                        </div>
                        <MethodBadge method={ep.method} />
                        <code className="text-sm font-mono text-gray-900 dark:text-white/80 break-all">{ep.path}</code>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mt-2">{ep.desc}</p>
                </div>

                {/* Parameters table */}
                <div className="px-6 py-5">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-4 h-px bg-gray-700" /> Parameters
                    </h4>
                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead>
                                <tr className="text-left text-[10px] text-gray-600 uppercase tracking-widest border-b border-white/[0.07]">
                                    <th className="pb-2.5 pr-4 font-bold w-36">Name</th>
                                    <th className="pb-2.5 pr-4 font-bold w-24">Required</th>
                                    <th className="pb-2.5 pr-4 font-bold w-28">Default</th>
                                    <th className="pb-2.5 font-bold">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ep.params.map(p => <ParamRow key={p.name} p={p} />)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Response */}
                <div className="px-6 py-4 border-t border-white/[0.07] bg-white/[0.01]">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider font-semibold">Response</span>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded font-mono">200 OK</span>
                        <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">{ep.response.type}</code>
                        {ep.response.extra && <span className="text-xs text-gray-600">· {ep.response.extra}</span>}
                    </div>
                </div>
            </div>

            {/* Code examples */}
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-1">
                        {langs.map(l => (
                            <button key={l} onClick={() => setLang(l)}
                                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${lang === l
                                    ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:bg-white/[0.04]'
                                    }`}>
                                {l === 'javascript' ? 'JavaScript' : l === 'curl' ? 'cURL' : 'Python'}
                            </button>
                        ))}
                    </div>
                    <CopyBtn text={ep.examples[lang]} />
                </div>
                <pre className="p-5 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto leading-7 whitespace-pre">
                    <code>{ep.examples[lang]}</code>
                </pre>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */

export default function Docs() {
    const [activeSection, setActiveSection] = useState('quickstart');
    const mainRef = useRef(null);

    // Scroll-spy
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                }
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );
        document.querySelectorAll('section[id]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold">
                        <Code2 className="w-3.5 h-3.5" /> API Reference
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> API Online
                    </span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Documentation</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg leading-relaxed">
                    A Puppeteer-powered REST API that returns pixel-perfect TradingView chart images.
                    One request → one PNG. No SDK, no complex setup.
                </p>
                <div className="flex flex-wrap gap-3 mt-5">
                    <Link to="/builder"
                        className="flex items-center gap-2 text-sm px-4 py-2 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:text-gray-900 dark:text-white hover:bg-violet-500/20 rounded-lg transition-all font-medium">
                        <Terminal className="w-4 h-4" /> Open Visual Builder
                    </Link>
                    <code className="flex items-center gap-2 text-sm px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 rounded-lg font-mono">
                        Base URL: http://localhost:3000
                    </code>
                </div>
            </motion.div>

            <div className="flex gap-8 relative">
                {/* ── SIDEBAR ─────────────────────────────── */}
                <aside className="hidden xl:block w-56 shrink-0">
                    <div className="sticky top-24 space-y-0.5">
                        <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest px-3 mb-3">On this page</p>
                        {NAV_SECTIONS.map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)}
                                className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${item.sub ? 'pl-6' : ''} ${activeSection === item.id
                                    ? 'text-violet-300 bg-violet-500/10'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:bg-white/[0.04]'
                                    }`}>
                                {!item.sub && item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}

                        <div className="pt-4 border-t border-white/[0.06] mt-2 space-y-0.5">
                            <Link to="/pricing"
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:bg-white/[0.04] transition-all">
                                <Globe className="w-3.5 h-3.5" /> Pricing
                            </Link>
                            <a href="https://github.com/MrChartist/chartsnap" target="_blank" rel="noreferrer"
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:bg-white/[0.04] transition-all">
                                <ExternalLink className="w-3.5 h-3.5" /> GitHub
                            </a>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ────────────────────────── */}
                <div ref={mainRef} className="flex-grow min-w-0 space-y-16">

                    {/* QUICK START */}
                    <section id="quickstart" className="scroll-mt-8 space-y-5">
                        <SectionHeader icon={Zap} label="Quick Start" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Generate your first chart in under a minute. No account needed for the synchronous v1 endpoints.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { step: '1', title: 'Open your TradingView chart', desc: 'Configure your chart with indicators and drawings. Click Share → Publish Chart to get a public Layout ID.' },
                                { step: '2', title: 'Make the API call', desc: 'Send a GET request with your Layout ID and any optional overrides (symbol, interval, range, theme, size).' },
                                { step: '3', title: 'Use the PNG response', desc: 'The response is a raw PNG binary. Pipe it to a file, send as an attachment, or display in a browser.' },
                            ].map(s => (
                                <div key={s.step} className="p-5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.08]">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-gray-900 dark:text-white font-black text-sm mb-3">{s.step}</div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{s.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{s.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Minimal example — get a chart in one command:</p>
                            <CodeBlock lang="bash" code={`curl "http://localhost:3000/v1/tradingview/layout-chart/YOUR_LAYOUT_ID?symbol=BINANCE:BTCUSDT&interval=1D" --output chart.png`} />
                        </div>

                        <InfoBox icon={Info} color="violet">
                            <strong>Getting your Layout ID:</strong> Open TradingView → set up your chart → click the <strong>Share</strong> button → <strong>Publish Chart</strong>. The ID is the alphanumeric string in the URL: <code className="bg-black/10 dark:bg-white/10 px-1 rounded">tradingview.com/chart/<strong>hMZXawOv</strong>/</code>
                        </InfoBox>
                    </section>

                    {/* AUTHENTICATION */}
                    <section id="authentication" className="scroll-mt-8 space-y-5">
                        <SectionHeader icon={Key} label="Authentication" />
                        <p className="text-gray-600 dark:text-gray-400">
                            The public <code className="text-violet-300 text-sm">/v1/tradingview/*</code> chart endpoints require <strong className="text-gray-900 dark:text-white">no authentication</strong>. You can use them directly from any client.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                            The async job queue endpoints (<code className="text-violet-300 text-sm">/v1/renders</code> and <code className="text-violet-300 text-sm">/v1/jobs/*</code>) require an API key. Pass it as a Bearer token:
                        </p>
                        <CodeBlock lang="http" code={`Authorization: Bearer chartsnap_test_key_2026`} />
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.08] space-y-2">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Key Storage</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500">Keys are SHA-256 hashed before storage. The plain-text key is never kept in the database — only its hash.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.08] space-y-2">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Default Test Key</p>
                                <code className="block text-xs font-mono text-violet-300 bg-violet-500/10 px-3 py-2 rounded-lg break-all">chartsnap_test_key_2026</code>
                            </div>
                        </div>
                        <InfoBox icon={AlertCircle} color="amber">
                            Run <code className="bg-black/10 dark:bg-white/10 px-1 rounded">node init-db.js</code> once to create the database and seed the default test API key before starting the server.
                        </InfoBox>
                    </section>

                    {/* RATE LIMITING */}
                    <section id="rate-limiting" className="scroll-mt-8 space-y-5">
                        <SectionHeader icon={Activity} label="Rate Limiting" />
                        <p className="text-gray-600 dark:text-gray-400">Rate limits are enforced per IP address using a sliding 60-second window. No registration required.</p>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02]">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Route Group</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Limit</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Auth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    <tr className="hover:bg-black/[0.02] dark:bg-white/[0.02]"><td className="px-5 py-3 font-mono text-violet-300 text-xs">/v1/tradingview/*</td><td className="px-5 py-3 text-gray-700 dark:text-gray-300">20 req / min</td><td className="px-5 py-3 text-gray-500 dark:text-gray-500">None</td></tr>
                                    <tr className="hover:bg-black/[0.02] dark:bg-white/[0.02]"><td className="px-5 py-3 font-mono text-violet-300 text-xs">/v1/renders</td><td className="px-5 py-3 text-gray-700 dark:text-gray-300">60 req / min</td><td className="px-5 py-3 text-gray-500 dark:text-gray-500">Bearer token</td></tr>
                                    <tr className="hover:bg-black/[0.02] dark:bg-white/[0.02]"><td className="px-5 py-3 font-mono text-violet-300 text-xs">/v1/jobs/*</td><td className="px-5 py-3 text-gray-700 dark:text-gray-300">60 req / min</td><td className="px-5 py-3 text-gray-500 dark:text-gray-500">Bearer token</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.08] font-mono text-xs space-y-1 text-gray-600 dark:text-gray-400">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-2">Rate limit response headers</p>
                            <p>X-RateLimit-Limit: 20</p>
                            <p>X-RateLimit-Remaining: 17</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-500">When exceeded, you receive HTTP <code className="text-amber-400">429</code> with a JSON body containing <code className="text-violet-300">retryAfter</code> (seconds until window resets).</p>
                    </section>

                    {/* ENDPOINTS HEADER */}
                    <section id="endpoints" className="scroll-mt-8">
                        <SectionHeader icon={Code2} label="Endpoints" />
                        <p className="text-gray-600 dark:text-gray-400 mt-2">All endpoints return binary image data directly — no JSON wrapper around the image.</p>
                    </section>

                    {/* ENDPOINT DETAILS */}
                    {ENDPOINTS.map(ep => <EndpointSection key={ep.id} ep={ep} />)}

                    {/* INTERVALS REFERENCE */}
                    <section id="intervals" className="scroll-mt-8 space-y-5">
                        <SectionHeader icon={Clock} label="Intervals Reference" />
                        <p className="text-gray-600 dark:text-gray-400">All accepted values for the <code className="text-violet-300">interval</code> parameter across all endpoints.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {INTERVALS.map(iv => (
                                <div key={iv.val} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 transition-all group">
                                    <code className="text-violet-300 text-sm font-mono font-bold group-hover:text-violet-200">{iv.val}</code>
                                    <span className="text-gray-600 text-xs">{iv.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Date Range values (<code className="text-violet-300">range</code> param — layout-chart only):</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {DATE_RANGES.map(dr => (
                                    <div key={dr.val} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 transition-all group">
                                        <code className="text-cyan-300 text-sm font-mono font-bold group-hover:text-cyan-200">{dr.val}</code>
                                        <span className="text-gray-600 text-xs">{dr.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ERROR CODES */}
                    <section id="errors" className="scroll-mt-8 space-y-5">
                        <SectionHeader icon={AlertCircle} label="Error Codes" />
                        <p className="text-gray-600 dark:text-gray-400">All errors return a JSON body: <code className="text-violet-300 text-sm">{`{ "error": true, "message": "..." }`}</code></p>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02]">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider w-20">Code</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider w-40">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Meaning</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {ERRORS.map(e => (
                                        <tr key={e.code} className="hover:bg-black/[0.02] dark:bg-white/[0.02]">
                                            <td className="px-5 py-3">
                                                <span className={`font-mono font-bold text-xs px-2 py-1 rounded ${e.code.startsWith('4') ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'
                                                    }`}>{e.code}</span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-medium">{e.title}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-500 text-xs leading-relaxed">{e.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ASYNC JOBS */}
                    <section id="async" className="scroll-mt-8 space-y-6">
                        <SectionHeader icon={BookOpen} label="Async Jobs (v2)" />
                        <InfoBox icon={Info} color="blue">
                            The async job queue requires a Bearer API key and the worker process running separately (<code className="bg-black/10 dark:bg-white/10 px-1 rounded">node server/worker.js</code>). The worker processes jobs queued in SQLite.
                        </InfoBox>

                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-gray-900 dark:text-white text-xs font-bold">1</span>
                                    <div>
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded mr-2 font-mono">POST</span>
                                        <code className="text-sm text-gray-900 dark:text-white/80 font-mono">/v1/renders</code>
                                    </div>
                                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">Enqueue a job — returns 202</span>
                                </div>
                                <CodeBlock lang="bash" code={`curl -X POST http://localhost:3000/v1/renders \\
  -H "Authorization: Bearer chartsnap_test_key_2026" \\
  -H "Content-Type: application/json" \\
  -d '{
    "engine": "tradingview_layout",
    "data":   { "layout": "hMZXawOv", "symbol": "NSE:SAIL", "interval": "1D" },
    "output": { "width": 1920, "height": 1080, "format": "png" }
  }'`} />
                                <div className="px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-semibold uppercase tracking-wider">202 Response</p>
                                    <CodeBlock lang="json" code={`{
  "job_id": "job_abc123def456",
  "status": "queued",
  "links": {
    "self":   "/v1/jobs/job_abc123def456",
    "result": "/v1/jobs/job_abc123def456/result"
  }
}`} />
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-gray-900 dark:text-white text-xs font-bold">2</span>
                                    <div>
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded mr-2 font-mono">GET</span>
                                        <code className="text-sm text-gray-900 dark:text-white/80 font-mono">/v1/jobs/:id</code>
                                    </div>
                                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">Poll until succeeded</span>
                                </div>
                                <CodeBlock lang="bash" code={`curl http://localhost:3000/v1/jobs/job_abc123def456 \\
  -H "Authorization: Bearer chartsnap_test_key_2026"`} />
                                <div className="px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-semibold uppercase tracking-wider">Status values: queued → processing → succeeded | failed</p>
                                    <CodeBlock lang="json" code={`{
  "job_id": "job_abc123def456",
  "status": "succeeded",
  "artifacts": {
    "cdn_url":    "/v1/jobs/job_abc123def456/result",
    "expires_at": "2026-04-06T05:08:11.000Z"
  }
}`} />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-gray-900 dark:text-white text-xs font-bold">3</span>
                                    <div>
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded mr-2 font-mono">GET</span>
                                        <code className="text-sm text-gray-900 dark:text-white/80 font-mono">/v1/jobs/:id/result</code>
                                    </div>
                                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">302 redirect to PNG</span>
                                </div>
                                <CodeBlock lang="bash" code={`curl -L http://localhost:3000/v1/jobs/job_abc123def456/result \\
  -H "Authorization: Bearer chartsnap_test_key_2026" \\
  --output chart.png`} />
                                <p className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-500 border-t border-white/[0.06]">
                                    This redirects (HTTP 302) to <code className="text-violet-300">/storage/{'{job_id}'}.png</code>. The PNG is stored for 30 days then expires.
                                </p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { engine: 'native', desc: 'Standard TradingView advanced chart. Same as /v1/tradingview/advanced-chart.' },
                                { engine: 'lightweight_charts', desc: 'Alias for native engine — both use the same Puppeteer chart renderer.' },
                                { engine: 'tradingview_layout', desc: 'Screenshot a saved TradingView layout by ID. Same as /v1/tradingview/layout-chart.' },
                            ].map(e => (
                                <div key={e.engine} className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-white/[0.07]">
                                    <code className="text-violet-300 text-xs font-mono font-bold">{e.engine}</code>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 leading-relaxed">{e.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-gray-200 dark:border-white/10">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{label}</h2>
            <div className="flex-grow h-px bg-gradient-to-r from-white/10 to-transparent ml-2" />
        </div>
    );
}
