import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, Check, Eye, EyeOff, RefreshCw, Zap, Activity, ArrowRight,
    Code2, Terminal, Globe, AlertTriangle, BarChart2, Loader2, LogOut
} from 'lucide-react';
import { authFetch, getUser, clearToken } from '../lib/auth';

const PLAN_COLORS = {
    FREE: { badge: 'bg-gray-500/15 border-gray-500/30 text-gray-400', bar: 'bg-gray-500' },
    PRO: { badge: 'bg-violet-500/15 border-violet-500/30 text-violet-300', bar: 'bg-violet-500' },
    ULTRA: { badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300', bar: 'bg-amber-500' },
    ENTERPRISE: { badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300', bar: 'bg-cyan-500' },
};

function CopyBtn({ text, className = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <button onClick={copy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white transition-all ${className}`}>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

function UsageBar({ label, value, max, color = 'bg-violet-500' }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-300 font-mono">{value}<span className="text-gray-600"> / {max}</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${color}`} />
            </div>
        </div>
    );
}

function MiniBarChart({ days }) {
    if (!days || days.length === 0) return null;
    const maxVal = Math.max(...days.map(d => d.calls), 1);
    return (
        <div className="flex items-end gap-1 h-20">
            {days.map((d) => {
                const heightPct = maxVal > 0 ? (d.calls / maxVal) * 100 : 0;
                const isToday = d.day === new Date().toISOString().slice(0, 10);
                return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-gray-900 border border-white/10 rounded px-2 py-0.5 text-xs text-white whitespace-nowrap z-10">
                            {d.calls} call{d.calls !== 1 ? 's' : ''} · {d.day.slice(5)}
                        </div>
                        <div className="w-full flex-grow flex items-end">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(heightPct, d.calls > 0 ? 4 : 0)}%` }}
                                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                style={{ width: '100%' }}
                                className={`rounded-sm ${isToday ? 'bg-violet-500' : 'bg-white/15 group-hover:bg-violet-500/50'} transition-colors`}
                            />
                        </div>
                        <span className="text-[9px] text-gray-700">{new Date(d.day + 'T00:00:00').toLocaleDateString('en', { weekday: 'narrow' })}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const user = getUser();
    const plan = user?.plan || 'FREE';
    const planStyle = PLAN_COLORS[plan] || PLAN_COLORS.FREE;

    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState([]);
    const [maskedKey, setMaskedKey] = useState('');
    const [plainKey, setPlainKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [revealing, setRevealing] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [toast, setToast] = useState('');
    const [codeLang, setCodeLang] = useState('curl');
    const [loading, setLoading] = useState(true);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const loadData = useCallback(async () => {
        try {
            const [statsRes, usageRes, keyRes] = await Promise.all([
                authFetch('/api/dashboard/stats'),
                authFetch('/api/dashboard/usage'),
                authFetch('/api/dashboard/key'),
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (usageRes.ok) { const u = await usageRes.json(); setUsage(u.days || []); }
            if (keyRes.ok) { const k = await keyRes.json(); setMaskedKey(k.masked || ''); }
        } catch (e) { console.error('Dashboard load error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleReveal = async () => {
        if (plainKey) { setShowKey(s => !s); return; }
        setRevealing(true);
        try {
            const res = await authFetch('/api/dashboard/reveal-key', { method: 'POST' });
            const data = await res.json();
            if (res.ok) { setPlainKey(data.plain); setShowKey(true); }
            else showToast(data.message || 'Could not reveal key');
        } finally { setRevealing(false); }
    };

    const handleRegenerate = async () => {
        if (!window.confirm('Regenerate your API key? Your current key will stop working immediately.')) return;
        setRegenerating(true);
        try {
            const res = await authFetch('/api/dashboard/regenerate-key', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setPlainKey(data.plain);
                setMaskedKey(data.masked);
                setShowKey(true);
                showToast('API key regenerated!');
            } else showToast(data.message || 'Failed to regenerate');
        } finally { setRegenerating(false); }
    };

    const handleLogout = () => { clearToken(); navigate('/login'); };

    const displayedKey = showKey && plainKey ? plainKey : maskedKey;

    const PLAN_LIMITS = { FREE: 20, PRO: 100, ULTRA: 500, ENTERPRISE: 500 };
    const rateLimit = stats?.rateLimit || PLAN_LIMITS[plan] || 20;

    const BASE_URL = window.location.origin;
    const CODE_SAMPLES = {
        curl: `curl "${BASE_URL}/v1/tradingview/layout-chart/YOUR_LAYOUT_ID\\
  ?symbol=NSE:SAIL&interval=1D&theme=dark" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  --output chart.png`,
        javascript: `const resp = await fetch(
  "${BASE_URL}/v1/tradingview/layout-chart/YOUR_LAYOUT_ID?interval=1D",
  { headers: { Authorization: "Bearer ${displayedKey}" } }
);
const blob = await resp.blob();
document.getElementById('chart').src = URL.createObjectURL(blob);`,
        python: `import requests
r = requests.get(
    "${BASE_URL}/v1/tradingview/layout-chart/YOUR_LAYOUT_ID",
    headers={"Authorization": "Bearer ${displayedKey}"},
    params={"symbol": "NSE:SAIL", "interval": "1D"},
)
open("chart.png", "wb").write(r.content)`,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
            {/* Background glows */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-600/6 blur-[120px]" />
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white shadow-xl">
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10 gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-500/20">
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Welcome back, {user?.name?.split(' ')[0] || 'Developer'}!</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{user?.email}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${planStyle.badge}`}>{plan}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/builder" className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm rounded-xl hover:bg-violet-500/20 transition-all font-medium">
                        <Terminal className="w-4 h-4" /> Builder
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 text-gray-400 text-sm rounded-xl hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* API Key card */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-[#0d1117] border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                    <Code2 className="w-4 h-4 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-white text-sm">API Key</h2>
                                    <p className="text-xs text-gray-600">Use this as your Bearer token</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleReveal} disabled={revealing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white transition-all">
                                    {revealing ? <Loader2 className="w-3 h-3 animate-spin" /> : showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    {showKey ? 'Hide' : 'Reveal'}
                                </button>
                                <button onClick={handleRegenerate} disabled={regenerating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-xs text-gray-400 hover:text-red-400 transition-all">
                                    {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                    Regen
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3">
                            <code className="flex-grow text-xs font-mono text-violet-300 break-all leading-relaxed select-all">
                                {displayedKey || 'Loading…'}
                            </code>
                            {displayedKey && <CopyBtn text={displayedKey} />}
                        </div>

                        {showKey && plainKey && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center gap-2 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <p className="text-xs text-amber-300">Your API key is visible. Hide it when you're done.</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Usage chart */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-[#0d1117] border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                                </div>
                                <h2 className="font-bold text-white text-sm">API Calls — Last 7 Days</h2>
                            </div>
                            <span className="text-xs text-gray-600 font-mono">
                                {usage.reduce((s, d) => s + d.calls, 0)} total
                            </span>
                        </div>
                        {usage.length > 0 ? (
                            <MiniBarChart days={usage} />
                        ) : (
                            <div className="h-20 flex items-center justify-center text-sm text-gray-600">No calls yet — make your first request!</div>
                        )}
                    </motion.div>

                    {/* Quick-start code */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Terminal className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h2 className="font-bold text-white text-sm">Quick Start</h2>
                            </div>
                            <div className="flex gap-1">
                                {['curl', 'javascript', 'python'].map(l => (
                                    <button key={l} onClick={() => setCodeLang(l)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${codeLang === l ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-300'}`}>
                                        {l === 'javascript' ? 'JS' : l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <pre className="p-5 text-xs font-mono text-gray-300 overflow-x-auto leading-7 whitespace-pre">
                                <code>{CODE_SAMPLES[codeLang]}</code>
                            </pre>
                            <div className="absolute top-3 right-3">
                                <CopyBtn text={CODE_SAMPLES[codeLang]} />
                            </div>
                        </div>
                        <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                            <p className="text-xs text-gray-600">Replace <code className="text-violet-400">YOUR_LAYOUT_ID</code> with your TradingView layout ID</p>
                            <Link to="/docs" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">Full Docs <ArrowRight className="w-3 h-3" /></Link>
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-6">

                    {/* Stats cards */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <Activity className="w-4 h-4 text-yellow-400" />
                            </div>
                            <h2 className="font-bold text-white text-sm">Usage</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Today', value: stats?.callsToday ?? 0, icon: Zap, color: 'text-violet-400' },
                                { label: 'This Month', value: stats?.callsThisMonth ?? 0, icon: BarChart2, color: 'text-cyan-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                                    <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
                                    <div className="text-2xl font-black text-white">{s.value}</div>
                                    <div className="text-xs text-gray-600">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 space-y-3">
                            <UsageBar label="Rate limit" value={Math.min(stats?.callsToday ?? 0, rateLimit)} max={rateLimit} color="bg-violet-500" />
                        </div>
                    </motion.div>

                    {/* Plan card */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-[#0d1117] border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-white text-sm">Current Plan</h2>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${planStyle.badge}`}>{plan}</span>
                        </div>
                        <div className="space-y-2 text-xs text-gray-500 mb-5">
                            <div className="flex justify-between"><span>Rate limit</span><span className="text-gray-300">{rateLimit} req/min</span></div>
                            <div className="flex justify-between"><span>Layout screenshots</span><span className={plan === 'FREE' ? 'text-red-400' : 'text-emerald-400'}>{plan === 'FREE' ? 'Limited' : '✓ Included'}</span></div>
                            <div className="flex justify-between"><span>Async queue</span><span className={plan === 'FREE' ? 'text-red-400' : 'text-emerald-400'}>{plan === 'FREE' ? 'No' : '✓ Yes'}</span></div>
                        </div>
                        {plan === 'FREE' && (
                            <Link to="/pricing"
                                className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-bold text-center hover:scale-[1.02] transition-transform">
                                Upgrade to Pro →
                            </Link>
                        )}
                    </motion.div>

                    {/* Quick links */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-[#0d1117] border border-white/10 rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
                        <div className="space-y-0.5">
                            {[
                                { to: '/builder', icon: Terminal, label: 'Visual Builder', sub: 'Generate charts visually' },
                                { to: '/docs', icon: Code2, label: 'API Docs', sub: 'Full endpoint reference' },
                                { to: '/pricing', icon: Globe, label: 'Pricing', sub: 'Explore plans' },
                            ].map(l => (
                                <Link key={l.to} to={l.to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group">
                                    <l.icon className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
                                    <div>
                                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{l.label}</p>
                                        <p className="text-xs text-gray-600">{l.sub}</p>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-700 ml-auto group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
