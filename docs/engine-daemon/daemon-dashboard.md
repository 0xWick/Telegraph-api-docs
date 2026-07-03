# Daemon Dashboard Read API

The Daemon is the read-only dashboard API that surfaces the
continuously-collected questions/results (news, weather, FDA alerts, etc.)
gathered by the engine's collector loop.

- **OpenAPI spec:** [`openapi/daemon.yaml`](../../openapi/daemon.yaml)
- **Server:** `https://<node>/daemon`
- **Auth:** none (free, read-only)
- **Paths:** 4
- **CORS:** GET only

## Endpoints

### GET /daemon/health

Health check with current server time.

```json
{ "status": "ok", "time": "2026-07-03T12:00:00Z" }
```

### GET /daemon/api/questions

Paginated query of collected questions/results with full filtering.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `category` | string | Filter to a single category |
| `categories` | string | Comma-separated list of categories |
| `source` | string | Filter to a single collector source |
| `sort` | enum | `recent` (default), `interest`, `affected`, `audience` |
| `order` | enum | `asc`, `desc` (default) |
| `since` | RFC3339 | Include since this time |
| `until` | RFC3339 | Include until this time |
| `since_hours` | float | Last N hours (alternative to since/until) |
| `min_interest` | 0–10 | Minimum interest score |
| `min_affected` | 0–100 | Minimum affected score |
| `min_audience` | 0–100 | Minimum audience score |
| `limit` | 1–100 | Page size (default 20) |
| `offset` | ≥0 | Pagination offset |

**Response:** `Page` envelope `{ results: MinerResult[], total, limit, offset }`.

### GET /daemon/api/questions/top

Top questions by interest score.

**Query params:** `limit` (1–50, default 10), `category` (comma list),
`since_hours`.

### GET /daemon/api/categories

Per-category aggregate statistics + the list of valid category names.

```json
{
  "categories": ["news", "weather", "fda", "crypto"],
  "stats": [
    { "category": "news", "count": 1240, "avg_interest": 6.2, "max_interest": 9.8 }
  ]
}
```

## MinerResult schema

Each result row:

```json
{
  "id": "res_01HMZK8X2J9QABCDEF",
  "category": "news",
  "source": "bbc",
  "question": "What's the latest on the Ethereum Pectra upgrade?",
  "answer": "Pectra activated on mainnet including EIP-7251...",
  "interest": 7.5,
  "affected": 45,
  "audience": 60,
  "miner_slug": "bittensor-sn22-desearch",
  "timestamp": "2026-07-03T12:00:00Z",
  "created_at": "2026-07-03T12:00:01Z"
}
```

## Errors

| Status | Condition |
|---|---|
| 400 | Invalid query parameter (bad limit, bad category, etc.) |
| 405 | Non-GET method (daemon is GET-only) |
| 500 | Database query failed |