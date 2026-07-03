# Authentication

Telegraph uses **four** authentication schemes across its three API surfaces.
All are defined as OpenAPI `securitySchemes` in the relevant specs.

## 1. x402 payment (the payment IS the authentication)

**Header:** `PAYMENT-SIGNATURE`
**Specs:** `openapi/miner-dispatcher.yaml`, `openapi/engine.yaml`
**Used by:** miner-dispatcher `/v1/*`, engine `/v1/ask`, engine `/v1/ask/{subnet_id}`

No API keys. The USDC payment serves as both payment and authentication.

### Flow

```
1. Client → Server:  POST /v1/ask  (no PAYMENT-SIGNATURE header)
2. Server → Client:  402 Payment Required
                     { "error": "x402 payment required",
                       "accepts": [{ "scheme": "x402",
                                     "price": "10000",        // micro-USDC
                                     "network": "base-sepolia",
                                     "payTo": "0x..." }] }
3. Client → Chain:   transfer 10000 micro-USDC ($0.01) to 0x... on base-sepolia
4. Client → Server:  POST /v1/ask  (PAYMENT-SIGNATURE: <payment proof>)
5. Server → Client:  200 OK  (the inference result)
```

### Networks

| Network | Identifier | Notes |
|---|---|---|
| Base Sepolia | `base-sepolia` | Default testnet |
| Base | `base` | Mainnet |
| Polygon | `polygon` | L2 |
| Solana Devnet | `solana-devnet` | Non-EVM |

### Pricing

Typical: **$0.01 USDC** per call (10000 micro-USDC). Dynamic per-subnet
pricing reads the on-chain `minPriceUsdc` committed by each miner. See the
[pricing section](http-proxy/payments-x402.md) for the demand-multiplier
table.

### Header name

The header is **`PAYMENT-SIGNATURE`** — never `X-Payment` (legacy name,
retired). The Spectral ruleset in this repo enforces this.

### Loopback bypass

`POST /v1/ask` and `/v1/ask/{subnet_id}` bypass x402 for loopback
(localhost) requests. This allows the daemon to call the engine internally
without paying.

---

## 2. EIP-191 wallet signature

**Header:** `Authorization`
**Specs:** `openapi/engine.yaml`, `openapi/internal-bridge.yaml`
**Used by:** transaction writes, validator writes, engine WS subscribe

### Flow (HTTP)

```
1. Client → Server:  GET /challenge  (or: server issues nonce in prior response)
2. Server → Client:  { nonce, message }   // message = "Sign this nonce: <nonce>"
3. Client signs `message` via personal_sign (EIP-191)
4. Client → Server:  POST /create
                     Authorization: <0x-prefixed hex signature>
5. Server recovers address via ecrecover, matches against registry
6. Server → Client:  200 OK
```

### Properties

- 24h signature expiry
- Nonce-based replay protection
- Library lock (signatures tied to the node's wallet library)
- The Engine WebSocket uses the same EIP-191 scheme but transports the
  signature as a WS message field (`wallet_verify` action) rather than an
  HTTP header.

---

## 3. Internal secret

**Header:** `X-Internal-Secret`
**Specs:** `openapi/miner-dispatcher.yaml`, `openapi/internal-bridge.yaml`
**Used by:** `/internal/*` (epoch receiver), `/miner-dispatcher/validate*`

The header value must match the node's `INTERNAL_SECRET` environment
variable.

**Development:** if `INTERNAL_SECRET` is unset, authentication is **disabled**
(these endpoints become open). This is a dev convenience.

**Production:** `INTERNAL_SECRET` MUST be set. These endpoints are
internal-only and should not be exposed on the public internet without
additional network-level isolation.

---

## 4. Party password (TSS workflows)

**Header:** `X-Party-Password`
**Spec:** `openapi/internal-bridge.yaml`
**Used by:** `POST /validator/start`, `POST /validator/reshare`

The header value must match the node's `PartyPassword` configuration.

Note: in the current implementation, the password is also embedded in the
request body (as `config.PartyPassword`). The header form is the
recommended going-forward interface. If the body's `PartyPassword` does not
match the node's config, the request is rejected with `403`.

This is a weak shared-secret scheme — it exists to prevent accidental
triggering of expensive TSS workflows. The `/validator/*` routes should be
restricted to peer validators at the network layer.

---

## Summary table

| Scheme | Header | Surface | First-request behavior |
|---|---|---|---|
| x402 | `PAYMENT-SIGNATURE` | miner-dispatcher `/v1/*`, engine `/v1/ask*` | Omit header → receive 402 → pay → retry with proof |
| EIP-191 | `Authorization` | transaction/validator writes, engine WS | Sign a server-issued challenge via `personal_sign` |
| Internal secret | `X-Internal-Secret` | `/internal/*`, `/validate*` | Send on every request (no challenge) |
| Party password | `X-Party-Password` | `/validator/start`, `/validator/reshare` | Send on every request (no challenge) |

## Security best practices

- **Never** expose `/internal/*` or `/validator/*` on the public internet
  without a reverse proxy / firewall. They're internal coordination endpoints.
- Treat `INTERNAL_SECRET` and `PartyPassword` as secrets — never commit them
  to git, never log them.
- x402 receiving addresses should be rotation-managed; lost keys = lost funds.
- EIP-191 signatures are time-bound — refresh nonces before the 24h window.