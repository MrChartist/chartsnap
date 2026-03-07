import { motion, useInView } from 'framer-motion';
import { useState, useRef } from 'react';
import { ArrowRight, Code2, Zap, LayoutTemplate, LineChart, Terminal, Globe, Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
};

function Section({ children, className = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} className={className}>
            {children}
        </motion.div>
    );
}

const FEATURES = [
    {
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        iconBg: 'bg-yellow-400/10 border-yellow-400/20',
        title: 'Instant Rendering',
        desc: 'Optimized Chromium headless cluster. Charts are captured and returned in milliseconds, not seconds.',
        badge: '< 3s avg'
    },
    {
        icon: <LayoutTemplate className="w-6 h-6 text-violet-400" />,
        iconBg: 'bg-violet-400/10 border-violet-400/20',
        title: 'Custom Layouts',
        desc: 'Pass your TradingView layout ID to perfectly snapshot your custom technical analysis setup — indicators and all.',
        badge: 'Any layout'
    },
    {
        icon: <LineChart className="w-6 h-6 text-cyan-400" />,
        iconBg: 'bg-cyan-400/10 border-cyan-400/20',
        title: '90+ Indicators',
        desc: 'RSI, MACD, Bollinger Bands and 90+ more. Native TradingView indicator support, rendered pixel-perfectly.',
        badge: 'Built-in'
    },
    {
        icon: <Globe className="w-6 h-6 text-emerald-400" />,
        iconBg: 'bg-emerald-400/10 border-emerald-400/20',
        title: 'All Exchanges',
        desc: 'NASDAQ, NSE, BSE, BINANCE, FOREX and hundreds more. Full multi-exchange support via TradingView data.',
        badge: '500+ markets'
    },
    {
        icon: <Terminal className="w-6 h-6 text-orange-400" />,
        iconBg: 'bg-orange-400/10 border-orange-400/20',
        title: 'Simple REST API',
        desc: 'A single GET request returns a PNG. No SDK required. Works with curl, fetch, Axios — any HTTP client.',
        badge: 'REST/GET'
    },
    {
        icon: <Lock className="w-6 h-6 text-pink-400" />,
        iconBg: 'bg-pink-400/10 border-pink-400/20',
        title: 'Secure & Fast',
        desc: 'Bearer token auth, SHA-256 key hashing, and strict sandbox isolation. Your layout data stays private.',
        badge: 'Bearer auth'
    },
];

const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Open your TradingView layout',
        desc: 'Set up your chart exactly how you want it — indicators, drawings, symbol, theme. Share it to get the Layout ID from the URL.',
        color: 'from-violet-500 to-fuchsia-500'
    },
    {
        step: '02',
        title: 'Make a single API call',
        desc: 'Send a GET request to our API with your Layout ID, symbol, and timeframe. No complex JSON body needed.',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        step: '03',
        title: 'Receive a pixel-perfect PNG',
        desc: 'Get back a high-resolution chart image instantly. Embed it in Telegram bots, Discord, reports, or your web app.',
        color: 'from-emerald-500 to-teal-500'
    },
];

const EXAMPLE_CURL = `curl "http://localhost:3000/v1/tradingview/layout-chart/hMZXawOv\\
  ?symbol=NSE:SAIL\\
  &interval=1D\\
  &theme=dark\\
  &range=1Y" \\
  --output chart.png`;

const EXAMPLE_JS = `const response = await fetch(
  'http://localhost:3000/v1/tradingview/layout-chart/hMZXawOv' +
  '?symbol=NSE:SAIL&interval=1D&theme=dark&range=1Y'
);
const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
document.getElementById('chart').src = imageUrl;`;

const EXAMPLE_PYTHON = `import requests

resp = requests.get(
    "http://localhost:3000/v1/tradingview/layout-chart/hMZXawOv",
    params={
        "symbol": "NSE:SAIL",
        "interval": "1D",
        "theme": "dark",
        "range": "1Y"
    }
)
with open("chart.png", "wb") as f:
    f.write(resp.content)`;



function CodeTabs() {
    const [active, setActive] = useState(0);
    const tabs = ['cURL', 'JavaScript', 'Python'];
    const codes = [EXAMPLE_CURL, EXAMPLE_JS, EXAMPLE_PYTHON];

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40 backdrop-blur-sm">
            <div className="flex border-b border-gray-200 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03]">
                {tabs.map((t, i) => (
                    <button
                        key={t}
                        onClick={() => setActive(i)}
                        className={`px-5 py-3 text-sm font-medium transition-all ${active === i ? 'text-violet-400 border-b-2 border-violet-500' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <pre className="p-6 overflow-x-auto text-sm leading-7 text-gray-700 dark:text-gray-300 font-mono whitespace-pre">
                <code>{codes[active]}</code>
            </pre>
        </div>
    );
}

export default function Landing() {
    return (
        <div className="relative overflow-x-hidden">
            {/* Background glows */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-cyan-600/10 blur-[120px]" />
            </div>

            {/* ── HERO ── */}
            <section className="relative pt-28 md:pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <motion.div initial="hidden" animate="visible" variants={stagger}>
                    <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">v2.0 Visual Builder Now Live</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-500" />
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        <span className="text-gray-900 dark:text-white">Developer-First</span><br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                            TradingView Screenshots
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Generate pixel-perfect chart images on demand via a blazing-fast REST API.
                        Powered by a real Puppeteer rendering engine — no iframes, no screenshots of screenshots.
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link to="/builder" className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-500" />
                            <button className="relative flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl">
                                Try Visual Builder
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <Link to="/docs" className="flex items-center gap-2 px-8 py-4 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-black/10 dark:bg-white/10 rounded-xl font-semibold text-lg transition-all backdrop-blur-md">
                            <Code2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span>Read Docs</span>
                        </Link>
                    </motion.div>

                    {/* Stats row */}
                    <motion.div variants={fadeUp} className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
                        {[
                            { value: '90+', label: 'Indicators' },
                            { value: '500+', label: 'Exchanges' },
                            { value: '<3s', label: 'Avg Render' },
                            { value: 'REST', label: 'Simple API' },
                        ].map(s => (
                            <div key={s.label}>
                                <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">{s.value}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ── FEATURES ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
                <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((f, i) => (
                        <motion.div key={i} variants={fadeUp} className="group relative p-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent hover:from-violet-500/30 hover:to-cyan-500/10 transition-all duration-500">
                            <div className="h-full bg-white dark:bg-[#0d1117] border border-white/5 group-hover:border-gray-200 dark:border-white/10 rounded-2xl p-6 transition-all">
                                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${f.iconBg}`}>
                                    {f.icon}
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{f.title}</h3>
                                    <span className="text-xs bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-mono">{f.badge}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </Section>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
                <Section>
                    <motion.div variants={fadeUp} className="text-center mb-14">
                        <span className="text-xs font-bold uppercase tracking-widest text-violet-400">How it works</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-3">Three steps to your chart</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-lg mx-auto">No complex setup. No SDK needed. Just a URL that returns an image.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* connector line (desktop) */}
                        <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-cyan-500/0" />

                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div key={i} variants={fadeUp} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-white/8">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${step.color} text-gray-900 dark:text-white font-black text-xl mb-6 shadow-lg`}>
                                    {step.step}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </Section>
            </section>

            {/* ── CODE EXAMPLE ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
                <Section>
                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Code Sample</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-3">One request, one image</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-lg mx-auto">The simplest API you've ever used. A GET request that responds with a PNG.</p>
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <CodeTabs />
                    </motion.div>
                </Section>
            </section>

            {/* ── SUPPORTED ENDPOINTS ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
                <Section>
                    <motion.div variants={fadeUp} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-white/10">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">API Surface</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Available Endpoints</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { method: 'GET', path: '/v1/tradingview/layout-chart/:layoutId', desc: 'Screenshot a shared TradingView layout with optional symbol/interval override.' },
                                { method: 'GET', path: '/v1/tradingview/advanced-chart', desc: 'Generate an advanced chart for any symbol and timeframe.' },
                                { method: 'GET', path: '/v1/tradingview/mini-chart', desc: 'Compact mini-chart ideal for thumbnails and previews.' },
                                { method: 'GET', path: '/v3/tradingview/exchange/list', desc: 'Get the full list of supported exchanges.' },
                                { method: 'GET', path: '/v3/tradingview/exchange/symbols', desc: 'Search symbols within a specific exchange.' },
                            ].map((ep, i) => (
                                <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-black/[0.02] dark:bg-white/[0.02] transition-colors">
                                    <span className={`shrink-0 text-xs font-black px-2 py-0.5 rounded font-mono mt-0.5 ${ep.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                        {ep.method}
                                    </span>
                                    <div>
                                        <code className="text-sm text-violet-300 font-mono">{ep.path}</code>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">{ep.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </Section>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-32">
                <Section>
                    <motion.div variants={fadeUp} className="relative rounded-3xl overflow-hidden p-10 text-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-600/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-3xl" />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Ready to build?</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">Open the Visual Builder, configure your chart, and get your API URL in seconds.</p>
                            <Link to="/builder">
                                <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-bold text-gray-900 dark:text-white text-lg hover:scale-105 transition-transform shadow-2xl shadow-violet-500/20">
                                    Open Visual Builder
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </Section>
            </section>
        </div>
    );
}
