# x402 Payment Protocol

The **x402** protocol is Telegraph's payment-as-authentication mechanism
for HTTP inference calls. No API keys — the USDC payment IS the auth.

- **Spec:** [`openapi/miner-dispatcher.yaml`](../../openapi/miner-dispatcher.yaml) (securitySchemes.x402)
- **Header:** `PAYMENT-SIGNATURE`
- **Status:** Production (v1)

## Architecture

```
Agent                  Telegraph Node              Facilitator            Chain
  │                         │                          │                   │
  │── POST /v1/ask ────────▶│                          │                   │
  │   (no header)           │                          │                   │
  │◀── 402 + accepts[] ─────│                          │                   │
  │                         │                          │                   │
  │── transfer USDC ─────────────────────────────────────────────────────▶│
  │   to payTo address      │                          │            on-chain
  │                         │                          │                   │
  │── POST /v1/ask ────────▶│                          │                   │
  │   PAYMENT-SIGNATURE     │── verify payment ───────▶│                   │
  │                         │◀── verified ────────────│                   │
  │                         │                          │                   │
  │                         │── dispatch to subnet ──▶ (upstream)         │
  │◀── 200 + result ────────│                          │                   │
```

The facilitator (e.g. PayAI) verifies the on-chain USDC payment on behalf of
the node. The node never touches the private key — it only checks the
payment proof.

## HTTP headers

| Header | Direction | Purpose |
|---|---|---|
| `PAYMENT-SIGNATURE` | Request | Agent → Server. The x402 payment proof. Omit on first request; include after paying. |
| `PAYMENT-REQUIRED` | Response | Server → Agent. Present on 402 responses (in addition to the JSON body). |
| `PAYMENT-RESPONSE` | Response | Server → Agent. Set by the middleware after a verified payment, so the agent knows the proof was accepted. |

## 402 response body

```json
{
  "error": "x402 payment required",
  "accepts": [
    {
      "scheme": "x402",
      "price": "10000",
      "network": "base-sepolia",
      "payTo": "0xAbC1...1234"
    }
  ]
}
```

- `price` is in **micro-USDC** (1 USDC = 1,000,000 micro). $0.01 = `10000`.
- Encoded as a decimal string to avoid JSON number precision loss.
- `network` is one of: `base-sepolia`, `base`, `polygon`, `solana-devnet`.

## Dynamic pricing

Each miner commits a `minPriceUsdc` floor on-chain (via `MinerRegistryFacet`).
The dispatcher's `dynamicPriceFunc` reads this floor and applies a demand
multiplier based on the subnet's 24h call volume.

### Demand multiplier table

| V_24h range | Multiplier |
|---|---|
| 0–999 | 1.0× |
| 1,000–9,999 | 1.5× |
| 10,000–99,999 | 2.5× |
| 100,000–999,999 | 5.0× |
| 1,000,000+ | 10.0× |

`Signal_Price = min_price_usdc × Demand_Multiplier(V_24h)`

The minimum floor price is **0.01 USDC** (10,000 micro).

## Test endpoint

`GET /miner-dispatcher/v1/x402-test` — exercises the full x402 gate without
calling a real subnet. Use it to verify your payment client + facilitator
wiring before paying for real inference.

## Error cases

| Status | Condition | Body |
|---|---|---|
| 402 | No `PAYMENT-SIGNATURE` header | `accepts[]` (pay + retry) |
| 402 | Invalid/expired payment proof | `accepts[]` (re-pay + retry) |
| 402 or 500 | Facilitator rejected the proof | `error: "facilitator rejected payment"` |
| 500 | Internal verification error | `error: "internal error"` |

## Configuration (node operators)

| Env var | Purpose |
|---|---|
| `FACILITATOR_URL` | The x402 facilitator URL (e.g. PayAI). |
| `X402_RECEIVING_ADDRESSES` | Map of network → receiving address (where USDC is paid). |
| `X402_ENABLED` | Toggle the x402 gate globally. |

When x402 is disabled (or for loopback requests), the gate is bypassed and
no payment is required.

## Client integration

See [`docs/integration-guides/agentic-frameworks.md`](../integration-guides/agentic-frameworks.md)
for LangChain (Python) and ElizaOS (JS, via `x402-fetch` integration
examples.