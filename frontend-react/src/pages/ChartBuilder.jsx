import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2, Image as ImageIcon, Copy, ArrowRight, Loader2,
    RefreshCw, Layers, AlertCircle, CheckCircle, ExternalLink,
    Download, Code2, ChevronDown
} from 'lucide-react';

const INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'];
const DATE_RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];
const STYLES = [
    { id: 1, label: 'Candles' },
    { id: 2, label: 'Bars' },
    { id: 3, label: 'Line' },
    { id: 8, label: 'Heikin Ashi' },
    { id: 9, label: 'Hollow Candles' },
];

function InputLabel({ children, required }) {
    return (
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {children}
            {required && <span className="text-[11px] text-red-400 font-normal">Required</span>}
        </label>
    );
}

function TextInput({ icon: Icon, ...props }) {
    return (
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-500 pointer-events-none" />}
            <input
                {...props}
                className={`w-full bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg py-2.5 pr-4 text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm ${Icon ? 'pl-9' : 'pl-3.5'}`}
            />
        </div>
    );
}

function ToggleGroup({ options, value, onChange, getLabel, getValue, color = 'violet' }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
                const val = getValue ? getValue(opt) : opt;
                const label = getLabel ? getLabel(opt) : opt;
                const active = value === val;
                return (
                    <button
                        key={val}
                        onClick={() => onChange(val)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${active
                            ? color === 'cyan'
                                ? 'bg-cyan-500 text-gray-900 dark:text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                : 'bg-violet-500 text-gray-900 dark:text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                            : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:bg-white/10 hover:text-gray-900 dark:text-white border border-transparent hover:border-gray-200 dark:border-white/10'
                            }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

export default function ChartBuilder() {
    const [form, setForm] = useState({
        layout: 'hMZXawOv',
        symbol: 'NSE:SAIL',
        interval: '1D',
        range: '1Y',
        theme: 'dark',
        width: '1200',
        height: '675',
    });

    const [status, setStatus] = useState({ type: 'idle' }); // idle | loading | success | error
    const [chartUrl, setChartUrl] = useState(null);
    const [apiUrl, setApiUrl] = useState('');
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('preview');

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
    const handleChange = (e) => set(e.target.name, e.target.value);

    const buildApiUrl = useCallback(() => {
        const base = 'http://localhost:3000';
        const params = new URLSearchParams();
        if (form.symbol) params.set('symbol', form.symbol);
        if (form.interval) params.set('interval', form.interval);
        if (form.range && form.range !== 'ALL') params.set('range', form.range);
        if (form.theme !== 'dark') params.set('theme', form.theme);
        if (form.width !== '1200') params.set('width', form.width);
        if (form.height !== '675') params.set('height', form.height);
        return `${base}/v1/tradingview/layout-chart/${form.layout}?${params.toString()}`;
    }, [form]);

    useEffect(() => {
        setApiUrl(buildApiUrl());
    }, [buildApiUrl]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const generateChart = async () => {
        if (!form.layout.trim()) {
            showToast('Layout ID is required', 'error');
            return;
        }
        if (chartUrl) URL.revokeObjectURL(chartUrl);
        setChartUrl(null);
        setStatus({ type: 'loading' });

        const url = buildApiUrl();
        setApiUrl(url);

        try {
            const resp = await fetch(url);
            if (!resp.ok) {
                const ct = resp.headers.get('content-type') || '';
                let detail = `HTTP ${resp.status}`;
                if (ct.includes('json')) {
                    const json = await resp.json().catch(() => ({}));
                    detail = json.message || json.error || detail;
                }
                throw new Error(detail);
            }
            const blob = await resp.blob();
            const objUrl = URL.createObjectURL(blob);
            setChartUrl(objUrl);
            setStatus({ type: 'success' });
            showToast('Chart generated!', 'success');
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
            showToast(err.message, 'error');
        }
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(apiUrl);
        showToast('API URL copied!', 'success');
    };

    const downloadChart = () => {
        if (!chartUrl) return;
        const a = document.createElement('a');
        a.href = chartUrl;
        a.download = `chartsnap-${form.layout}-${Date.now()}.png`;
        a.click();
    };

    const curlSnippet = `curl "${apiUrl}" \\\n  --output chart.png`;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Visual Chart Builder</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Configure your chart parameters and preview the generated image.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* ── Controls Panel ── */}
                <div className="w-full lg:w-[380px] shrink-0 bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden sticky top-24">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-violet-400" />
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Chart Controls</span>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Layout ID */}
                        <div>
                            <InputLabel required>Layout ID</InputLabel>
                            <TextInput
                                icon={Layers}
                                type="text"
                                name="layout"
                                value={form.layout}
                                onChange={handleChange}
                                placeholder="e.g. hMZXawOv"
                            />
                            <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                                Found in your TradingView chart URL: tradingview.com/chart/<strong className="text-gray-500 dark:text-gray-500">XXXXXX</strong>/
                            </p>
                        </div>

                        {/* Symbol */}
                        <div>
                            <InputLabel>Ticker Symbol</InputLabel>
                            <TextInput
                                type="text"
                                name="symbol"
                                value={form.symbol}
                                onChange={handleChange}
                                placeholder="EXCHANGE:SYMBOL"
                                style={{ fontFamily: 'monospace' }}
                            />
                            <p className="text-[11px] text-gray-600 mt-1.5">e.g. BINANCE:BTCUSDT, NSE:RELIANCE</p>
                        </div>

                        {/* Interval */}
                        <div>
                            <InputLabel>Timeframe</InputLabel>
                            <ToggleGroup options={INTERVALS} value={form.interval} onChange={v => set('interval', v)} />
                        </div>

                        {/* Date Range */}
                        <div>
                            <InputLabel>Date Range</InputLabel>
                            <ToggleGroup options={DATE_RANGES} value={form.range} onChange={v => set('range', v)} />
                        </div>

                        {/* Theme */}
                        <div>
                            <InputLabel>Theme</InputLabel>
                            <ToggleGroup options={['dark', 'light']} value={form.theme} onChange={v => set('theme', v)} color="cyan" />
                        </div>

                        {/* Size */}
                        <div>
                            <InputLabel>Output Size</InputLabel>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <TextInput type="number" name="width" value={form.width} onChange={handleChange} placeholder="1200" />
                                    <p className="text-[10px] text-gray-600 mt-1 text-center">Width (px)</p>
                                </div>
                                <div>
                                    <TextInput type="number" name="height" value={form.height} onChange={handleChange} placeholder="675" />
                                    <p className="text-[10px] text-gray-600 mt-1 text-center">Height (px)</p>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={generateChart}
                            disabled={status.type === 'loading'}
                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${status.type === 'loading'
                                ? 'bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-wait'
                                : 'bg-gradient-to-r from-violet-600 to-cyan-600 text-gray-900 dark:text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                }`}
                        >
                            {status.type === 'loading' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Rendering Chart…</>
                            ) : (
                                <><RefreshCw className="w-4 h-4" /> Generate Chart</>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* ── Preview Panel ── */}
                <div className="flex-grow flex flex-col gap-4 min-w-0">

                    {/* Tab row */}
                    <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-1 w-fit">
                        {['preview', 'api-url', 'curl'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab
                                    ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {tab === 'api-url' ? 'API URL' : tab === 'curl' ? 'cURL' : 'Preview'}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'preview' && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden"
                            >
                                {/* Header */}
                                <div className="px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                                        <span className="font-semibold text-sm text-gray-200">Live Preview</span>
                                        {status.type === 'success' && (
                                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                                                <CheckCircle className="w-3 h-3" /> Generated
                                            </span>
                                        )}
                                    </div>
                                    {chartUrl && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={downloadChart} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-all border border-white/5 hover:border-gray-200 dark:border-white/10">
                                                <Download className="w-3.5 h-3.5" /> Download
                                            </button>
                                            <button onClick={copyUrl} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-all border border-white/5 hover:border-gray-200 dark:border-white/10">
                                                <Copy className="w-3.5 h-3.5" /> Copy URL
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Canvas */}
                                <div className="flex items-center justify-center p-6 min-h-[420px] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]">
                                    <AnimatePresence mode="wait">
                                        {status.type === 'loading' && (
                                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                                                <div className="relative w-16 h-16">
                                                    <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-ping" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-violet-300 font-semibold">Puppeteer Engine Active</p>
                                                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Opening TradingView, injecting CSS…</p>
                                                </div>
                                            </motion.div>
                                        )}
                                        {status.type === 'error' && (
                                            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-center max-w-sm">
                                                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="w-7 h-7 text-red-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-red-400 mb-1">Render Failed</h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{status.message}</p>
                                                </div>
                                                <button onClick={generateChart} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-all">
                                                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                                                </button>
                                            </motion.div>
                                        )}
                                        {status.type === 'success' && chartUrl && (
                                            <motion.div key="image" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.3 }} className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
                                                <img src={chartUrl} alt="Generated TradingView chart" className="w-full h-auto object-contain" />
                                            </motion.div>
                                        )}
                                        {status.type === 'idle' && (
                                            <motion.div key="idle" className="flex flex-col items-center gap-3 text-gray-600">
                                                <ImageIcon className="w-14 h-14 opacity-30" />
                                                <p className="text-sm">Click <strong className="text-gray-600 dark:text-gray-400">Generate Chart</strong> to render a preview</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'api-url' && (
                            <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Constructed API URL</span>
                                    <button onClick={copyUrl} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-all border border-white/5">
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <div className="bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-4 font-mono text-sm text-violet-300 break-all leading-relaxed">
                                    {apiUrl}
                                </div>
                                <p className="text-xs text-gray-600 mt-3">This URL generates a PNG chart image. Paste it in your browser, use it in <code className="text-gray-500 dark:text-gray-500">fetch()</code>, or in any HTTP client.</p>
                            </motion.div>
                        )}

                        {activeTab === 'curl' && (
                            <motion.div key="curl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="bg-black/[0.03] dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">cURL</span>
                                    <button onClick={() => { navigator.clipboard.writeText(curlSnippet); showToast('Copied!'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-all border border-white/5">
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <pre className="p-5 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto leading-7 whitespace-pre">
                                    <code>{curlSnippet}</code>
                                </pre>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900/90 backdrop-blur-xl border border-gray-300 dark:border-white/20 rounded-full shadow-2xl"
                    >
                        <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
