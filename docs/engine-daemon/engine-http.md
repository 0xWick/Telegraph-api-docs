# Engine HTTP API

The Engine is the LLM-routed inference layer that sits in front of the
miner-dispatcher. It classifies a natural-language query, picks the best
miner(s), dispatches, and returns a unified result.

- **OpenAPI spec:** [`openapi/engine.yaml`](../../openapi/engine.yaml)
- **Server:** `https://<node>/engine`
- **Auth:** x402 for `/v1/ask*`; none for read-only endpoints.
- **Paths:** 10 REST + 1 WebSocket

## Inference endpoints (x402)

### POST /v1/ask

LLM-routed inference. Classifies `query` via the router, picks top-2 miners,
tries primary then fallback, returns the unified result. Persists to DB for
non-loopback callers.

**Request:**
```json
{
  "query": "What's the weather in New York?",
  "context": { "units": "imperial" }
}
```

**Response:**
```json
{
  "miner_used": "bittensor-sn18-zeus",
  "miner_name": "Zeus Weather Forecasting",
  "result": {
    "latitude": 40.71,
    "longitude": -74.01,
    "forecast": [{ "time": "2026-07-03T12:00:00Z", "variable": "2m_temperature", "value": 297.5 }]
  },
  "cost_usd": 0.01,
  "duration_ms": 412,
  "timestamp": "2026-07-03T12:00:05Z",
  "intent": "WEATHER_FORECAST"
}
```

`context` is optional — must be JSON-serializable. Merged into the
LLM-built request body; caller values win on key conflicts.

### POST /v1/ask/{subnet_id}

Direct, user-specified subnet inference — skips the LLM router. Useful when
the Agent already knows which miner it wants.

**Request:**
```json
{
  "method": "GET",
  "endpoint": "/predict",
  "payload": { "lat": 40.71, "lon": -74.01 }
}
```

## Miners (free, read-only)

| Endpoint | Purpose |
|---|---|
| `GET /v1/miners` | Miner catalog (id, slug, capabilities, cost) |
| `GET /v1/subnets` | Legacy alias for `/v1/miners` |

## Jobs (ERC-8183 lookup, free)

| Endpoint | Purpose |
|---|---|
| `GET /v1/job/{id}` | On-chain job details (state, output_hash, budget) via `eth_call` |
| `GET /v1/job/{id}/result` | Local miner result for verifying against on-chain `output_hash` |

`state_name` ∈ `Funded`, `Terminal`, `Cancelled`, `Unknown`.

Use these to verify the local miner result matches the on-chain
`output_hash` committed by the miner.

## Intents (free, read-only)

| Endpoint | Purpose |
|---|---|
| `GET /v1/intents` | List all intents (on-chain store if wired, else hot-registered) |
| `GET /v1/intents/{id}` | Intent detail (miners + WASM authors) |
| `GET /v1/intents/{id}/miners` | Miners for an intent (hot + on-chain) |
| `GET /v1/intents/{id}/wasm` | WASM validation script authors |

`{id}` accepts either a 32-byte hex hash (with/without `0x`) OR an
uppercase intent name (`WEATHER_FORECAST`).

## Errors

`/v1/ask` can return:
- `400` — invalid request body / invalid context
- `402` — x402 payment required
- `500` — routing failed, context injection failed, all miners failed

`/v1/job/{id}` can return:
- `400` — invalid job ID
- `404` — job not found (zero agent address)
- `500` — on-chain config not set
- `502` — contract call failed / invalid response

See [Errors](../overview/errors.md) for the standard envelope.