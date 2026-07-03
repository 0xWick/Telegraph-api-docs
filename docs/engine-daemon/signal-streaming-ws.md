# Signal Streaming WebSocket (WS Payments product)

Telegraph has **two** WebSocket products. This doc covers the older
**signal-streaming WS** that pairs with the WS Payments layer (USDC escrow
+ per-epoch settlement). For the primary ask-pipeline WS, see
[`engine-websocket.md`](engine-websocket.md).

> **Source:** This doc is a draft, consolidated from `docs/websocket-subscription.md`
> and `docs/WS_PAYMENTS_ARCHITECTURE.md` in the Telegraph monorepo. The
> signal-streaming product is in-progress — auth and frame details may
> evolve.

## Overview

The signal-streaming WS lets agents subscribe to a stream of signals
(inference results) filtered by intent, category, and interest score. It's
gated by a USDC escrow balance (the KnockGate $1 floor) and settled per-epoch
via the WS Payments contracts.

## Registration

```bash
curl -X POST https://node/v1/clients/register \
  -H "Content-Type: application/json" \
  -d '{"client_id":"my-agent","secret":"..."}'
```

Returns a client credential used to authenticate the WS connection.

## Connect + subscribe

```
ws://engine-url:8080/ws?client_id=my-agent

→ { "action": "subscribe",
    "intents": ["WEATHER_FORECAST", "CHAT_COMPLETION"],
    "min_interest": 5.0,
    "max_per_hour": 100 }
```

## Server frames

- `subscribed` — `{ subscription_id, intents }`
- `unsubscribed` — `{ subscription_id, intents }`
- `signal` — a `MinerResult` payload (see
  [`daemon-dashboard.md`](daemon-dashboard.md) for the schema)
- `error` — `{ message: string }`

## Escrow + settlement

- The agent must have ≥ $1 USDC in the EscrowFacet (see
  [`docs/on-chain/ws-payments-contracts.md`](../on-chain/ws-payments-contracts.md)).
- Each delivered signal is recorded as a `DeliveryLog` via
  `POST /internal/delivery` (internal, engine → epoch receiver).
- Per-epoch, `submitEpoch()` aggregates the logs, builds a Merkle tree,
  and releases escrowed USDC to miners.
- The agent's effective balance decreases as signals are delivered.

## Disambiguation

| | Engine ask-pipeline WS | Signal-streaming WS |
|---|---|---|
| **URL** | `/engine/ws` | `/ws` (or `:8080/ws`) |
| **Primary use** | Interactive `ask` + optional subscribe | Subscribe-only signal stream |
| **Auth** | EIP-191 wallet (for subscribe) | client_id + shared secret |
| **Payment** | x402 per `ask` call | USDC escrow + per-epoch settlement |
| **Docs** | [`engine-websocket.md`](engine-websocket.md) | this doc |