const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateKey, getKeyInfo } = require('./services/keys');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve stored chart images
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// ─── API Routes ───────────────────────────────────────────────────────────────
const v1Routes = require('./routes/v1');
const v2Routes = require('./routes/v2');
const v3Routes = require('./routes/v3');

app.use('/v1', v1Routes);
app.use('/v2', v2Routes);
app.use('/v3', v3Routes);

// ─── Registration Endpoint ────────────────────────────────────────────────────
// POST /api/register — Get a free API key
app.post('/api/register', (req, res) => {
    const { email, tier = 'BASIC' } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: true, message: 'A valid email address is required.' });
    }
    const validTiers = ['BASIC', 'PRO', 'MEGA', 'ULTRA'];
    const safeTier = validTiers.includes(tier.toUpperCase()) ? tier.toUpperCase() : 'BASIC';

    try {
        const result = generateKey(email, safeTier);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: true, message: err.message });
    }
});

// GET /api/key-info — Get info about current key
app.get('/api/key-info', authMiddleware, (req, res) => {
    const info = getKeyInfo(req.apiKey);
    if (!info) return res.status(404).json({ error: true, message: 'Key not found.' });
    res.json({ success: true, apiKey: req.apiKey, ...info });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ChartSnap API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Catch-all → frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Initialize Telegram Bot
require('./telegram');

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 ChartSnap API Server running at http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/docs.html`);
    console.log(`🔑 Dashboard: http://localhost:${PORT}/dashboard.html\n`);
    console.log('Demo API Keys:');
    console.log('  BASIC:  demo-key-basic-001');
    console.log('  PRO:    demo-key-pro-001');
    console.log('  ULTRA:  demo-key-ultra-001\n');
});
