import { Link } from 'react-router-dom';

const LINKS = [
    { to: '/docs', label: 'Docs' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/builder', label: 'Builder' },
    { href: 'https://github.com/MrChartist/chartsnap', label: 'GitHub', external: true },
];

export default function Footer() {
    return (
        <footer className="border-t border-white/10 mt-32 py-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-gray-600">
                    © {new Date().getFullYear()} PixelTrade · Built with React &amp; Tailwind CSS
                </p>
                <div className="flex items-center gap-6">
                    {LINKS.map(lk => lk.external ? (
                        <a key={lk.label} href={lk.href} target="_blank" rel="noreferrer"
                            className="text-sm text-gray-500 hover:text-white transition-colors">
                            {lk.label}
                        </a>
                    ) : (
                        <Link key={lk.to} to={lk.to}
                            className="text-sm text-gray-500 hover:text-white transition-colors">
                            {lk.label}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
}
