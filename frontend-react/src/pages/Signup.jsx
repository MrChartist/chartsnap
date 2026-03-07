import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { setToken } from '../lib/auth';

const FEATURES = ['Instant chart screenshots', 'Layout ID support', '17 time intervals', '500+ exchanges'];

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [apiKey, setApiKey] = useState(''); // shown once after signup

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Signup failed'); return; }
            setToken(data.token);
            setApiKey(data.apiKey); // Will show the key in a success screen
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Key reveal screen (shown once after signup) ──────────────────
    if (apiKey) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-16 relative">
                <div className="pointer-events-none fixed inset-0">
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md relative z-10">
                    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white mb-1">Account Created!</h1>
                            <p className="text-gray-500 text-sm">Save your API key — it won't be shown again.</p>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-left">
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Your API Key</p>
                            <code className="text-xs text-violet-300 font-mono break-all leading-relaxed">{apiKey}</code>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <span className="text-amber-400 text-xs leading-relaxed">⚠️ Copy and store this key securely. You can reveal it later in your dashboard, but for security it will be masked.</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { navigator.clipboard.writeText(apiKey); }}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                Copy Key
                            </button>
                            <button onClick={() => navigate('/dashboard')}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm hover:scale-[1.02] transition-transform">
                                Go to Dashboard →
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Signup form ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-stretch relative">
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-600/8 blur-[120px]" />
            </div>

            {/* Left panel — feature list (desktop) */}
            <div className="hidden lg:flex flex-col justify-center px-16 py-16 w-[480px] shrink-0 border-r border-white/[0.06]">
                <div className="flex items-center gap-2.5 mb-12">
                    <AreaChart className="w-6 h-6 text-violet-400" />
                    <span className="text-lg font-black text-white">PixelTrade</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-3 leading-tight">Start generating<br />charts in seconds</h2>
                <p className="text-gray-500 text-sm mb-10 leading-relaxed">A developer-first REST API for TradingView chart screenshots. One request, one PNG.</p>
                <div className="space-y-3">
                    {FEATURES.map(f => (
                        <div key={f} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            </div>
                            <span className="text-sm text-gray-400">{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-grow flex items-center justify-center px-4 py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <AreaChart className="w-5 h-5 text-violet-400" />
                        <span className="font-black text-white">PixelTrade</span>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">Create your account</h1>
                    <p className="text-gray-500 text-sm mb-8">Free plan — no credit card required</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
                            <input value={form.name} onChange={set('name')} type="text" required
                                placeholder="Roop Singh"
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                        </div>
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
                            <input value={form.email} onChange={set('email')} type="email" required
                                placeholder="you@example.com"
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                        </div>
                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
                            <div className="relative">
                                <input value={form.password} onChange={set('password')} type={showPass ? 'text' : 'password'} required minLength={8}
                                    placeholder="Minimum 8 characters"
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                                <button type="button" onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <span className="text-red-400 text-sm">{error}</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full relative group py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600" />
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            <span className="relative flex items-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {loading ? 'Creating account…' : 'Create Free Account'}
                                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                            </span>
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
