# Error Codes & Troubleshooting

ChartSnap follows the **RFC 9457 (Problem Details for HTTP APIs)** standard for all error responses. This ensures clear, machine-readable errors for developers.

## Standard Error Response Shape

```json
{
  "type": "https://chartsnap.com/errors/invalid-api-key",
  "title": "Invalid API Key",
  "status": 401,
  "detail": "The provided API key is either incorrect, revoked, or expired.",
  "instance": "/v1/renders/12345"
}
```

## Common Error Codes

| Status | Code / Type | Description |
| :--- | :--- | :--- |
| **400** | `bad-request` | The request body is malformed or missing required parameters like `symbol`. |
| **401** | `unauthorized` | Missing or invalid API key in the `Authorization` header. |
| **403** | `forbidden` | Your API key does not have permission for the requested symbol or feature. |
| **404** | `not-found` | The requested Job ID or endpoint does not exist. |
| **429** | `too-many-requests` | You have exceeded your tier's daily limit or per-second rate limit. |
| **500** | `server-error` | An internal error occurred in the Puppeteer rendering engine. |
| **504** | `gateway-timeout` | The chart render took longer than the 30-second hard limit. |

## Troubleshooting Tips

1. **Check your API Token**: Ensure you are sending `Authorization: Bearer <YOUR_KEY>`. No `key=` query parameter is allowed in V2.
2. **Symbol Format**: Always use the full exchange prefix (e.g., `BINANCE:BTCUSDT` instead of just `BTCUSDT`).
3. **Invalid JSON**: If using POST, ensure your JSON is valid. Use a linter if you get 400 errors.
4. **Rendering Artifacts**: If you see "black boxes" or clipped images, check that you aren't trying to render a resolution higher than your tier allows.
