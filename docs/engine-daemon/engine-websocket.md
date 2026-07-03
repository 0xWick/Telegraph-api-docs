# Engine WebSocket API

The Engine WebSocket (`/engine/ws`) is the interactive ask pipeline +
subscription stream. OpenAPI 3.0 cannot natively model WebSockets, so this
markdown is the canonical reference. The schemas (`WSMessage`, `WSAskRequest`)
are in `openapi/engine.yaml`.

- **Spec:** [`openapi/engine.yaml`](../../openapi/engine.yaml) (`/ws` path)
- **URL:** `wss://<node>/engine/ws?wallet_address=0x...`
- **Auth:** EIP-191 wallet auth (optional — required for `subscribe`)
- **Heartbeat:** server pings every 30s; 90s read deadline.

## Connection

Open the WebSocket with an optional `?wallet_address=0x...` query param.
If supplied, EIP-191 wallet verification is required before `subscribe`
actions are allowed. Anonymous connections can use `ask`, `ask_direct`,
`list_subnets`, and `ping` only.

## Auth handshake (when `wallet_address` is supplied)

```
Client → {"action": "auth_wallet"}
Server → {"type": "wallet_challenge",
          "data": { "nonce": "...", "message": "Sign this nonce: ...",
                    "wallet_address": "0x...", "instruction": "personal_sign the message" },
          "timestamp": "..."}

Client signs `message` via personal_sign (EIP-191)
Client → {"action": "wallet_verify", "signature": "0x..."}

Server → {"type": "wallet_verified", "data": { "wallet_address": "0x..." }, "timestamp": "..."}
```

On failure, the server sends an `error` frame and closes the connection.

## Escrow gate (KnockGate)

After wallet verification, if `BASE_RPC_URL` + `DIAMOND_ADDRESS` are set,
an on-chain escrow balance check applies. The wallet must have at least
$1 USDC in the EscrowFacet. Connections below the floor are closed with:

```
{"type": "error", "data": { "message": "insufficient escrow balance" }, "timestamp": "..."}
```

## Client actions

Send JSON frames with an `action` field:

| Action | Required fields | Auth | Description |
|---|---|---|---|
| `auth_wallet` | — | none | Request a wallet challenge |
| `wallet_verify` | `signature` | none | Submit EIP-191 signature |
| `ask` | `query` (+ optional `context`) | none | LLM-routed inference |
| `ask_direct` | `subnet_id`, `method`, `endpoint`, `payload` | none | Direct subnet inference (skip router) |
| `subscribe` | `intents` (+ `category`, `min_interest`, `max_per_hour`) | EIP-191 | Subscribe to signal stream |
| `unsubscribe` | `subscription_id` | EIP-191 | Cancel a subscription |
| `list_subscriptions` | — | EIP-191 | List active subscriptions |
| `list_subnets` | — | none | List registered subnets |
| `ping` | — | none | Heartbeat (responds with `pong`) |

### Example: ask

```js
ws.send(JSON.stringify({
  action: "ask",
  query: "What's the weather in Tokyo?"
}));
```

### Example: subscribe (requires wallet verification)

```js
ws.send(JSON.stringify({
  action: "subscribe",
  intents: ["WEATHER_FORECAST"],
  min_interest: 5.0,
  max_per_hour: 100
}));
```

## Server frames

Every server message has the shape `{ type, data?, timestamp }`:

| `type` | `data` shape | Description |
|---|---|---|
| `connected` | `{ message, wallet_address? }` | Connection established |
| `received` | `{ query }` | Acknowledges an `ask` |
| `routing` | `{ query }` | LLM routing started |
| `routed` | `{ miner_id, miner_name }` | Miner selected |
| `executing` | `{ miner_id, endpoint }` | Dispatch started |
| `result` | `AskResponse` object | Inference result |
| `error` | `{ message: string }` | Error |
| `subscribed` | `{ subscription_id, intents }` | Subscription active |
| `unsubscribed` | `{ subscription_id, intents }` | Subscription cancelled |
| `wallet_challenge` | `{ nonce, message, wallet_address, instruction }` | Auth challenge |
| `wallet_verified` | `{ wallet_address }` | Auth success |
| `ping` / `pong` | `{}` | Heartbeat |

## Ask pipeline sequence

```
Client → {"action":"ask","query":"weather in NYC"}
Server → {"type":"received","data":{"query":"weather in NYC"}}
Server → {"type":"routing","data":{"query":"weather in NYC"}}
Server → {"type":"routed","data":{"miner_id":"zeus","miner_name":"Zeus"}}
Server → {"type":"executing","data":{"miner_id":"zeus","endpoint":"/predict"}}
Server → {"type":"result","data":{ ...AskResponse... }}
```

## Error examples

```json
{"type": "error", "data": { "message": "wallet verification required" }, "timestamp": "..."}
{"type": "error", "data": { "message": "query is required" }, "timestamp": "..."}
{"type": "error", "data": { "message": "routing failed" }, "timestamp": "..."}
{"type": "error", "data": { "message": "all miners failed" }, "timestamp": "..."}
{"type": "error", "data": { "message": "insufficient escrow balance" }, "timestamp": "..."}
```

## Relationship to the signal-streaming WS

Telegraph has **two** WebSocket products — don't confuse them:

1. **Engine ask-pipeline WS** (this doc, `/engine/ws`) — interactive `ask`
   + optional subscription. The primary product.
2. **Signal-streaming WS** (`/ws` with `subscribe`, documented in
   [`signal-streaming-ws.md`](signal-streaming-ws.md)) — the older
   standalone subscription product that pairs with the WS Payments
   (USDC escrow + per-epoch settlement) layer.