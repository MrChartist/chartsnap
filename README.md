# ChartSnap 📸

> **TradingView Chart Screenshot API** — Generate professional candlestick, line, and area chart images via a simple REST API. No browser needed.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-brightgreen)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## 🚀 What is ChartSnap?

ChartSnap is a self-hosted chart screenshot API service inspired by [chart-img.com](https://chart-img.com). It generates high-quality PNG/JPEG chart images on demand using real market data fetched from Binance — all via a simple HTTP request.

**Use it for:**
- 📱 Telegram / Discord trading bots
- 📊 Portfolio dashboards
- 📧 Email/Slack price alerts with chart images
- 🤖 Automated trading reports

---

## ✨ Features

| Feature | v1 (GET) | v2 (POST) |
|---------|---------|---------|
| Mini chart (area sparkline) | ✅ | — |
| Advanced candlestick chart | ✅ | ✅ |
| RSI sub-pane | ✅ | ✅ |
| MACD sub-pane | ✅ | ✅ |
| Bollinger Bands overlay | ✅ | ✅ |
| Moving Averages (SMA/EMA) | ✅ | ✅ |
| Volume bars | ✅ | ✅ |
| Save image to storage | — | ✅ |
| Heikin Ashi / Line / Area styles | ✅ | ✅ |
| Dark & Light themes | ✅ | ✅ |
| Real Binance OHLCV data | ✅ | ✅ |
| API key auth + rate limiting | ✅ | ✅ |
| Exchange & symbol lookup | ✅ (v3) | — |

---

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/MrChartist/chartsnap.git
cd chartsnap

# Install dependencies (requires Node.js 18+)
npm install

# Start the server
npm start
# → Server running at http://localhost:3000
```

> No Puppeteer or Chrome required. The chart engine uses `@napi-rs/canvas` — pure Node.js with pre-built binaries.

---

## 🔑 Authentication

All API endpoints require an API key. Pass it via:

```bash
# Header (recommended)
-H "x-api-key: YOUR_API_KEY"

# Bearer token
-H "Authorization: Bearer YOUR_API_KEY"

# Query param
?key=YOUR_API_KEY
```

**Register for a free key:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "tier": "BASIC"}'
```

**Demo keys (included for testing):**

| Key | Tier | Daily Limit |
|-----|------|-------------|
| `demo-key-basic-001` | BASIC | 50 req/day |
| `demo-key-pro-001` | PRO | 500 req/day |
| `demo-key-ultra-001` | ULTRA | 3,000 req/day |

---

## 📡 API Reference

### GET `/v1/tradingview/mini-chart`

Generates a compact area sparkline chart.

```bash
curl "http://localhost:3000/v1/tradingview/mini-chart\
?symbol=BINANCE:BTCUSDT\
&interval=1D\
&width=600&height=300\
&theme=dark\
&key=demo-key-basic-001" -o btc-mini.png
```

| Param | Default | Description |
|-------|---------|-------------|
| `symbol` | `BINANCE:BTCUSDT` | TradingView symbol (`EXCHANGE:SYMBOL`) |
| `interval` | `1D` | `1m` `5m` `15m` `1h` `4h` `1D` `1W` `1M` |
| `width` | `800` | Image width (px) |
| `height` | `400` | Image height (px) |
| `theme` | `dark` | `dark` or `light` |

---

### GET `/v1/tradingview/advanced-chart`

Full candlestick chart via GET request.

```bash
curl "http://localhost:3000/v1/tradingview/advanced-chart\
?symbol=BINANCE:ETHUSDT\
&interval=4h\
&studies=Relative+Strength+Index\
&studies=MACD\
&key=demo-key-pro-001" -o eth-chart.png
```

| Param | Default | Description |
|-------|---------|-------------|
| `symbol` | `BINANCE:BTCUSDT` | TradingView symbol |
| `interval` | `1D` | Chart interval |
| `style` | `candle` | `candle` `line` `area` `heikinAshi` `bar` |
| `theme` | `dark` | `dark` or `light` |
| `studies` | `[]` | Repeatable: `&studies=RSI&studies=MACD` |
| `width` | `800` | Image width (px) |
| `height` | `600` | Image height (px) |
| `format` | `png` | `png` or `jpeg` |

---

### POST `/v2/tradingview/advanced-chart`

Advanced chart via JSON body — more control over studies and style.

```bash
curl -X POST http://localhost:3000/v2/tradingview/advanced-chart \
  -H "x-api-key: demo-key-pro-001" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NASDAQ:TSLA",
    "interval": "1W",
    "style": "candle",
    "theme": "dark",
    "width": 1200,
    "height": 700,
    "studies": [
      { "name": "Bollinger Bands" },
      { "name": "MACD" },
      { "name": "Relative Strength Index" }
    ]
  }' -o tsla-weekly.png
```

---

### POST `/v2/tradingview/advanced-chart/storage`

Same as above but saves to disk and returns a URL.

```bash
curl -X POST http://localhost:3000/v2/tradingview/advanced-chart/storage \
  -H "x-api-key: demo-key-pro-001" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BINANCE:SOLUSDT","style":"area","theme":"dark"}'
# → {"success":true,"url":"/storage/abc123.png","size":44898}
```

---

### GET `/v3/tradingview/exchange/list`

List all supported exchanges.

```bash
curl "http://localhost:3000/v3/tradingview/exchange/list?key=demo-key-basic-001"
# → {"payload":["BINANCE","NASDAQ","NSE","NYSE",...]}
```

### GET `/v3/tradingview/exchange/symbols`

List symbols for an exchange.

```bash
curl "http://localhost:3000/v3/tradingview/exchange/symbols?exchange=NSE&key=demo-key-basic-001"
# → {"exchange":"NSE","payload":["NSE:RELIANCE","NSE:TCS",...]}
```

---

## 📐 Supported Studies / Indicators

| Name (for API) | Type |
|----------------|------|
| `Relative Strength Index` | Sub-pane |
| `MACD` | Sub-pane |
| `Bollinger Bands` | Overlay |
| `Moving Average` | Overlay |
| `Moving Average Exponential` | Overlay |
| `Volume` | Background |

---

## 💎 Rate Limits (Tiers)

| Tier | Daily | Rate | Max Resolution | Price |
|------|-------|------|----------------|-------|
| BASIC | 50 | 1/sec | 800×600 | Free |
| PRO | 500 | 10/sec | 1920×1080 | $7/mo |
| MEGA | 1,000 | 15/sec | 1920×1600 | $10/mo |
| ULTRA | 3,000 | 35/sec | 2048×1920 | $20/mo |

---

## 🗂️ Project Structure

```
chartsnap/
├── server/
│   ├── index.js               # Express server entry point
│   ├── routes/
│   │   ├── v1.js              # GET mini-chart + advanced-chart
│   │   ├── v2.js              # POST advanced-chart + storage
│   │   └── v3.js              # Exchange list + symbols
│   ├── middleware/
│   │   ├── auth.js            # API key authentication
│   │   └── ratelimit.js       # Tier-based rate limiting
│   ├── services/
│   │   ├── screenshot.js      # Canvas chart engine (core)
│   │   └── keys.js            # API key management
│   └── data/
│       ├── keys.json          # API key store
│       └── usage.json         # Daily usage tracking
├── frontend/
│   ├── index.html             # Landing page
│   ├── dashboard.html         # User dashboard
│   ├── docs.html              # API documentation
│   ├── css/style.css          # Design system (dark theme)
│   └── js/
│       ├── main.js            # Landing page logic
│       └── dashboard.js       # Dashboard logic
├── storage/                   # Saved chart images
└── package.json
```

---

## 🧪 Quick Test

```bash
# Health check
curl http://localhost:3000/api/health

# Generate BTC daily candlestick chart
curl "http://localhost:3000/v1/tradingview/advanced-chart?symbol=BINANCE:BTCUSDT&key=demo-key-pro-001" -o btc.png

# ETH 4h chart with RSI + MACD
curl -X POST http://localhost:3000/v2/tradingview/advanced-chart \
  -H "x-api-key: demo-key-pro-001" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BINANCE:ETHUSDT","interval":"4h","studies":["Relative Strength Index","MACD"]}' \
  -o eth.png
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express 4
- **Chart Engine**: [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) — no Chrome/Puppeteer required
- **Data Source**: Binance REST API (real-time OHLCV)
- **Auth**: API key (header / Bearer / query param)

---

## 📄 License

MIT © 2026 MrChartist
