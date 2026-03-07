import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, AreaChart, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-lg"
            >
                {/* Glowing 404 */}
                <div className="relative mb-8 inline-block">
                    <div className="absolute inset-0 blur-3xl bg-violet-600/30 rounded-full scale-150" />
                    <p className="relative text-[9rem] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white/70 to-transparent select-none">
                        404
                    </p>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
                <p className="text-gray-400 mb-10">
                    The page you're looking for doesn't exist or was moved.
                    Head back and try again.
                </p>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link to="/"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-semibold text-sm hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all">
                        <Home className="w-4 h-4" /> Back to Home
                    </Link>
                    <Link to="/builder"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
                        <AreaChart className="w-4 h-4" /> Try Builder
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
