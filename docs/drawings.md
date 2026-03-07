# Drawings Reference

ChartSnap allows you to overlay custom drawings on top of your charts. Drawings are specified in the `drawings` array in the V2 POST API.

## Common Drawing Types

| Type | Description | Required Fields |
| :--- | :--- | :--- |
| **Horizontal Line** | A horizontal line at a specific price level. | `price`, `text` |
| **Vertical Line** | A vertical line at a specific timestamp. | `time`, `text` |
| **Trend Line** | A line connecting two points `(time, price)`. | `points[]` |
| **Ray** | A line starting at one point and extending infinitely. | `points[]` |
| **Rectangle** | A shaded area between two price levels and two times. | `points[]` |

## Configuration Example

```json
{
  "symbol": "NASDAQ:AAPL",
  "drawings": [
    {
      "type": "horizontal_line",
      "price": 150.50,
      "text": "Resistance Zone",
      "color": "#ff0000",
      "width": 2
    },
    {
      "type": "trend_line",
      "points": [
        { "time": 1672531200, "price": 140.00 },
        { "time": 1675123200, "price": 155.00 }
      ],
      "color": "#00ff00"
    }
  ]
}
```

## Performance Note
Drawing many complex objects (e.g. 100+ trend lines) may slightly increase the rendering time. We recommend keeping drawings below 20 for optimal API performance.
