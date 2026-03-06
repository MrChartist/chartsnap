const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve stored chart images
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/v1', require('./routes/v1'));
app.use('/v1/renders', require('./routes/renders'));
app.use('/v1/jobs', require('./routes/renders'));

// Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ChartSnap API', version: '2.0.0', timestamp: new Date().toISOString() });
});

// SPA catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 ChartSnap running at http://localhost:${PORT}`);
    console.log(`📚 API Docs:     http://localhost:${PORT}/docs.html`);
    console.log(`⚡ Chart Builder: http://localhost:${PORT}/chart-builder.html\n`);
});
