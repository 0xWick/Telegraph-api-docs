# Miner Dispatcher HTTP Proxy API

The miner-dispatcher is the x402-gated HTTP proxy fronting all registered
Bittensor subnet integrations. It is the primary inference marketplace
surface.

- **OpenAPI spec:** [`openapi/miner-dispatcher.yaml`](../../openapi/miner-dispatcher.yaml)
- **Server:** `https://<node>/miner-dispatcher`
- **Auth:** x402 (PAYMENT-SIGNATURE header) for `/v1/*`; `X-Internal-Secret`
  for `/validate*`; none for discovery.
- **Paths:** 28

## Endpoint groups

### Discovery (free, no payment)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Dispatcher health check |
| GET | `/integrations` | List all registered integrations (DTOs) |
| GET | `/integrations/yamls` | Raw YAML text of every integration, keyed by slug |
| GET | `/openapi.yaml` | Dynamically generated OpenAPI 3.0 YAML (live) |
| GET | `/openapi.json` | Dynamically generated OpenAPI 3.0 JSON (live) |

Use `/integrations` and `/openapi.yaml` to discover what's available before
paying. The dynamic OpenAPI is generated from the current hot-registered
integrations — it reflects the node's state right now.

### x402 test

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/v1/x402-test` | Verify x402 payment flow without calling a real subnet |

### Dynamic proxy (covers any subnet, incl. SN42/SN101/SN102)

| Method | Path | Purpose |
|---|---|---|
| GET, POST, PUT, DELETE, PATCH | `/v1/{subnet}/{proxyPath}` | Generic x402-gated proxy to any registered subnet |

Path params:
- `subnet` — numeric ID (`18`) or alias (`zeus`). Aliases: `zeus=18`,
  `nineteen=19`, `bounty=20`, `desearch=22`, `itsai=32`, `bitmind=34`,
  `chutes=64`.
- `proxyPath` — the sub-endpoint path (e.g. `/predict`, `/chat/completions`).

Use this generic form for subnets not individually documented below
(SN42 search, SN101 search, SN102 chat). Dynamic per-subnet pricing reads
the on-chain `minPriceUsdc`.

### Bittensor subnet endpoints (individually documented)

These 19 endpoints are the explicitly-documented subnets with full
request/response schemas. All are x402-gated.

| Subnet | Slug | Endpoints |
|---|---|---|
| SN1 | bittensor-sn1-apex | `POST /v1/1/chat` |
| SN18 | bittensor-sn18-zeus | `GET /v1/18/predict` |
| SN19 | bittensor-sn19-nineteen | `POST /v1/19/{chat/completions,completions,text-to-image,image-to-image,avatar}` |
| SN20 | bittensor-sn20-bounty | `POST /v1/20/chat` |
| SN22 | bittensor-sn22-desearch | `POST /v1/22/{search,search/links/web,deep}`, `GET /v1/22/web` |
| SN32 | bittensor-sn32-itsai | `POST /v1/32/detect` |
| SN34 | bittensor-sn34-bitmind | `POST /v1/34/{detect-image,detect-video,preprocess-video,get-video-upload-url}` |
| SN64 | bittensor-sn64-chutes | `POST /v1/64/{chat/completions,completions}` |

### Validation (uses `X-Internal-Secret`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/validate` | Sandbox-test a miner YAML + API key (real HTTP calls to upstream) |
| POST | `/validate/collector` | Schema-only collector YAML validation (no HTTP calls) |

## x402 payment flow

See [Authentication](../overview/authentication.md) for the full x402 flow.
In short: omit `PAYMENT-SIGNATURE` → receive 402 → pay USDC on-chain → retry
with the header → get the result.

## Dynamic pricing

The dispatcher reads on-chain `minPriceUsdc` committed by each miner to
determine the x402 price per call. The base floor is $0.01 USDC; demand
multipliers apply based on 24h volume.

See [`payments-x402.md`](payments-x402.md) for the demand-multiplier table
and the dynamic pricing implementation.

## Try it out

After running `make serve`, open <http://localhost:8080>, select the
"Miner Dispatcher" spec, and use the "Try it out" button on any endpoint.
For x402-gated endpoints, you'll need a wallet with USDC on Base Sepolia
to complete the payment step.

## Errors

All 4xx/5xx responses use the standard [Error envelope](../overview/errors.md).
The 402 (Payment Required) response uses the special
[X402ChallengeBody](../overview/errors.md#x402-402-response-special-case)
envelope.