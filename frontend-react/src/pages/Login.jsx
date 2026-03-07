import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { setToken } from '../lib/auth';

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Login failed'); return; }
            setToken(data.token);
            navigate('/dashboard');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16 relative">
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                        <AreaChart className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-black text-white">PixelTrade</span>
                </div>

                <h1 className="text-2xl font-black text-white mb-1 text-center">Welcome back</h1>
                <p className="text-gray-500 text-sm mb-8 text-center">Sign in to your account</p>

                <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-7">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
                            <input value={form.email} onChange={set('email')} type="email" required
                                placeholder="you@example.com"
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
                            <div className="relative">
                                <input value={form.password} onChange={set('password')} type={showPass ? 'text' : 'password'} required
                                    placeholder="Your password"
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
                                {loading ? 'Signing in…' : 'Sign In'}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </span>
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Create one free</Link>
                </p>
            </motion.div>
        </div>
    );
}
