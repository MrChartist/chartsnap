import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import ChartBuilder from './pages/ChartBuilder';
import Docs from './pages/Docs';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Paths that skip Navbar/Footer (full-page auth screens)
const BARE_PATHS = ['/signup', '/login'];

export default function App() {
    const location = useLocation();
    const isBare = BARE_PATHS.some(p => location.pathname.startsWith(p));
    const isDashboard = location.pathname.startsWith('/dashboard');

    return (
        <div className={`min-h-screen bg-[#0A0D14] text-white ${!isBare ? 'flex flex-col' : ''}`}>
            {/* Show Navbar on all non-bare pages (including dashboard) */}
            {!isBare && <Navbar />}

            <main className={!isBare ? 'flex-grow' : ''}>
                <Routes>
                    {/* Auth pages — no chrome */}
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected dashboard */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />

                    {/* Public pages */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/builder" element={<ChartBuilder />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>

            {!isBare && !isDashboard && <Footer />}
        </div>
    );
}
