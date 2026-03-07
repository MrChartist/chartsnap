import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Zap, Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isLoggedIn, getUser, clearToken } from '../../lib/auth';

const LINKS = [
    { to: '/builder', label: 'Builder' },
    { to: '/docs', label: 'Docs' },
    { to: '/pricing', label: 'Pricing' },
    { href: 'https://github.com/MrChartist/chartsnap', label: 'GitHub', external: true },
];

const PLAN_COLORS = {
    FREE: 'text-gray-400 bg-white/5',
    PRO: 'text-violet-300 bg-violet-500/15',
    ULTRA: 'text-amber-300 bg-amber-500/15',
    ENTERPRISE: 'text-cyan-300 bg-cyan-500/15',
};

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const loc = useLocation();
    const navigate = useNavigate();

    const loggedIn = isLoggedIn();
    const user = loggedIn ? getUser() : null;
    const plan = user?.plan || 'FREE';
    const initials = user ? (user.name || user.email || 'U').slice(0, 2).toUpperCase() : '';

    const handleLogout = () => {
        clearToken();
        setUserMenuOpen(false);
        navigate('/login');
    };

    const isActive = (to) => loc.pathname === to;

    return (
        <nav className="border-b border-white/10 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group shrink-0">
                        <div className="p-2 bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 rounded-lg group-hover:from-violet-600/30 group-hover:to-cyan-500/30 transition-all">
                            <AreaChart className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
                            PixelTrade
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center space-x-6">
                        {LINKS.map(lk => lk.external ? (
                            <a key={lk.label} href={lk.href} target="_blank" rel="noreferrer"
                                className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                {lk.label}
                            </a>
                        ) : (
                            <Link key={lk.to} to={lk.to}
                                className={`text-sm font-medium transition-colors ${isActive(lk.to) ? 'text-violet-300' : 'text-gray-400 hover:text-white'}`}>
                                {lk.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side — auth-aware */}
                    <div className="flex items-center gap-3">
                        {loggedIn ? (
                            <>
                                {/* Dashboard link — desktop */}
                                <Link to="/dashboard" className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard') ? 'text-violet-300 bg-violet-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                </Link>

                                {/* User avatar pill */}
                                <div className="relative">
                                    <button onClick={() => setUserMenuOpen(o => !o)}
                                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-xs font-black">
                                            {initials}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${PLAN_COLORS[plan] || PLAN_COLORS.FREE}`}>
                                            {plan}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-2 w-52 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                                <div className="px-4 py-3 border-b border-white/[0.06]">
                                                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                                                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                                                </div>
                                                <div className="py-1">
                                                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                                                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                                                    </Link>
                                                    <button onClick={handleLogout}
                                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                                        <LogOut className="w-4 h-4" /> Log out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hidden lg:block text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="hidden lg:block">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_28px_rgba(139,92,246,0.45)] transition-all">
                                        <Zap className="w-4 h-4" /> Get Started
                                    </motion.button>
                                </Link>
                            </>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            id="mobile-menu-toggle"
                            onClick={() => setOpen(o => !o)}
                            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
                            aria-label="Toggle menu"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl overflow-hidden">
                        <div className="px-4 py-4 space-y-1">
                            {LINKS.map(lk => lk.external ? (
                                <a key={lk.label} href={lk.href} target="_blank" rel="noreferrer"
                                    onClick={() => setOpen(false)}
                                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                    {lk.label}
                                </a>
                            ) : (
                                <Link key={lk.to} to={lk.to} onClick={() => setOpen(false)}
                                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(lk.to) ? 'text-violet-300 bg-violet-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    {lk.label}
                                </Link>
                            ))}

                            <div className="pt-2 border-t border-white/5 space-y-1">
                                {loggedIn ? (
                                    <>
                                        <Link to="/dashboard" onClick={() => setOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                                        </Link>
                                        <button onClick={() => { handleLogout(); setOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                                            <LogOut className="w-4 h-4" /> Log out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setOpen(false)}
                                            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                            Sign In
                                        </Link>
                                        <Link to="/signup" onClick={() => setOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border border-violet-500/30 rounded-lg text-sm font-semibold text-violet-300 hover:from-violet-600/30 hover:to-cyan-600/30 transition-all">
                                            <Zap className="w-4 h-4" /> Get Started Free
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
