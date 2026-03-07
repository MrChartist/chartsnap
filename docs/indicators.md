# Indicators Reference

ChartSnap supports 90+ native TradingView indicators. Below are the most commonly used indicators and their configuration keys for the V2 API.

## Core Indicators

| Name | Key | Description | Parameters |
| :--- | :--- | :--- | :--- |
| **Relative Strength Index** | `RSI` | Momentum oscillator measuring speed and change of price. | `length` (default: 14) |
| **Moving Average Convergence Divergence** | `MACD` | Trend-following momentum indicator. | `fastLength`, `slowLength`, `signalSmoothing` |
| **Bollinger Bands** | `Bollinger Bands` | Volatility indicator consisting of a middle SMA and two outer bands. | `length`, `mult` |
| **Stochastic** | `Stochastic` | Compares a closing price to a range of prices over time. | `k`, `d`, `smooth` |
| **Simple Moving Average** | `Moving Average` | Average price over a specific number of periods. | `length` |
| **Exponential Moving Average** | `Moving Average Exponential` | Weighted moving average giving more importance to recent data. | `length` |
| **Volume** | `Volume` | Amount of an asset traded over time. | None |

## Configuration Example (V2 POST)

```json
{
  "symbol": "BINANCE:BTCUSDT",
  "studies": [
    {
      "name": "RSI",
      "override": {
        "length": 14,
        "upperLimit": 70,
        "lowerLimit": 30
      }
    },
    {
      "name": "Moving Average Exponential",
      "style": {
        "color": "#ff0000",
        "linewidth": 2
      },
      "override": {
        "length": 50
      }
    }
  ]
}
```

## All Supported Indicators
For a full list of all 90+ indicators, please refer to the [TradingView Technical Analysis Documentation](https://www.tradingview.com/widget/advanced-chart/). Our engine supports any indicator available in the standard Advanced Charts library.
