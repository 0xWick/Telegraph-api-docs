# Rate limiting & caching

## Rate limiting

| Endpoint | Limit | Notes |
|---|---|---|
| `POST /` (wallet creation) | 100/min per IP default | Overridable via `config.MaxConn`. Returns `429` when exceeded. |
| Epoch receiver (`/internal/delivery`, `/internal/epoch-close`) | Channel capacity (429 when full) | Returns `429` with `code: buffer_full` when the in-memory queue is saturated. Retry shortly. |
| Miner-dispatcher x402 gate | Per-subnet dynamic pricing | Not a rate limit — but x402 enforces payment per call. |

## Caching headers

Several read endpoints set `Cache-Control` to reduce load on the node +
chain RPCs:

| Endpoint | `Cache-Control` | TTL |
|---|---|---|
| `GET /api/search/{hash}` | `public, max-age=86400` | 1 day |
| `GET /api/transaction/{hash}` | `public, max-age=86400` | 1 day |
| `GET /api/transactions/dailyTransactionCount` | `public, max-age=60` | 1 min |
| `GET /api/transactions/countHistory` | `public, max-age=3600` | 1 hour |
| `GET /api/address/{address}/overview` | `public, max-age=300` | 5 min |
| `GET /api/address/{address}/transactions` | `public, max-age=60` | 1 min |
| `GET /api/network/stats/today` | `no-cache, max-age=60` | 1 min (no cache proxy) |
| `GET /api/network/stats` | `no-cache, max-age=60` | 1 min |
| `GET /api/network/stats/lifetime` | `no-cache, max-age=300` | 5 min |
| `GET /api/validator/{address}` | `no-cache, max-age=60` | 1 min |
| `GET /api/validators` | `no-cache, max-age=300` | 5 min |
| `GET /api/totalValidators` | `public, max-age=60` | 1 min |

## Partial-data warnings

Some stats endpoints may return `200` with partial data when subsystems
fail. Check the `X-Stats-Warning` header:

- `GET /api/network/stats` → `X-Stats-Warning: Partial data`
- `GET /api/network/stats/lifetime`
- `GET /api/network/stats/today`
- `GET /api/address/{address}/overview` → `X-Address-Warning: Partial data`

If the header is absent, the data is complete.

## CORS

- **Miner-dispatcher** (Gin): `cors.Default()` — allows all origins.
- **Engine** (Gin): custom CORS allowing the `PAYMENT-SIGNATURE`,
  `PAYMENT-REQUIRED`, `PAYMENT-RESPONSE` headers.
- **Daemon** (http.ServeMux): GET only (no writes).