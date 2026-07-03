# Engine & Daemon Schemas

Key response/request schemas referenced across the engine and daemon specs.
All are defined in `openapi/engine.yaml` and `openapi/daemon.yaml` — this is
a quick-reference summary.

## AskResponse (engine /v1/ask)

```json
{
  "miner_used": "bittensor-sn18-zeus",
  "miner_name": "Zeus Weather Forecasting",
  "endpoint": "/predict",
  "result": { /* free-form — depends on the miner */ },
  "cost_usd": 0.01,
  "duration_ms": 412,
  "timestamp": "2026-07-03T12:00:05Z",
  "reasoning": "routed to zeus for weather intent",
  "intent": "WEATHER_FORECAST"
}
```

| Field | Type | Notes |
|---|---|---|
| `miner_used` | string | The slug of the miner that produced the result |
| `miner_name` | string | Human-readable |
| `endpoint` | string? | Upstream endpoint (optional) |
| `result` | object | Free-form — depends on the miner |
| `cost_usd` | float | USDC cost |
| `duration_ms` | int64 | Round-trip duration |
| `timestamp` | RFC3339 | Response time |
| `reasoning` | string? | LLM routing reasoning |
| `intent` | string? | Detected intent ID |

## WSMessage (engine /ws server frame)

```json
{ "type": "result", "data": { /* AskResponse */ }, "timestamp": "..." }
```

`type` ∈ `connected`, `received`, `routing`, `routed`, `executing`,
`result`, `error`, `subscribed`, `unsubscribed`, `ping`, `pong`,
`wallet_challenge`, `wallet_verified`.

See [`engine-websocket.md`](engine-websocket.md) for the per-type `data`
shapes.

## WSAskRequest (engine /ws client frame)

```json
{ "action": "ask", "query": "weather in NYC?" }
```

`action` ∈ `auth_wallet`, `wallet_verify`, `ask`, `ask_direct`, `subscribe`,
`unsubscribe`, `list_subscriptions`, `list_subnets`, `ping`.

## JobDetail (engine /v1/job/{id})

```json
{
  "job_id": 42,
  "agent": "0xabc...",
  "intent_id": "WEATHER_FORECAST",
  "callback": "0xdef...",
  "budget": "10000000",
  "miner_payment": "9800000",
  "protocol_fee": "200000",
  "state": 1,
  "state_name": "Funded",
  "output_hash": "0x...",
  "tx_hash": "0x...",
  "signal_hash": "0x...",
  "created_at": "2026-07-03T12:00:00Z"
}
```

`state_name` ∈ `Funded`, `Terminal`, `Cancelled`, `Unknown`.

## MinerCatalogItem (engine /v1/miners)

```json
{
  "id": "zeus",
  "name": "Zeus Weather Forecasting",
  "slug": "bittensor-sn18-zeus",
  "description": "...",
  "base_url": "https://api.zeus.predict",
  "capabilities": ["weather"],
  "cost_per_call": "$0.01 USDC",
  "protocol": "rest"
}
```

## MinerResult (daemon /api/questions)

```json
{
  "id": "res_01HMZK8X2J9QABCDEF",
  "category": "news",
  "source": "bbc",
  "question": "What's the latest on the Ethereum Pectra upgrade?",
  "answer": "Pectra activated on mainnet...",
  "interest": 7.5,
  "affected": 45,
  "audience": 60,
  "miner_slug": "bittensor-sn22-desearch",
  "timestamp": "2026-07-03T12:00:00Z",
  "created_at": "2026-07-03T12:00:01Z"
}
```

## Page (daemon paginated envelope)

```json
{ "results": [ /* MinerResult[] */ ], "total": 93, "limit": 20, "offset": 0 }
```