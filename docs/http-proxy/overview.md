# Miner Dispatcher HTTP Proxy API

The miner-dispatcher is the x402-gated HTTP proxy fronting all registered
miner integrations. It is the primary inference marketplace surface.

- **OpenAPI spec:** [`openapi/miner-dispatcher.yaml`](../../openapi/miner-dispatcher.yaml)
- **Server:** `http://13.237.89.59:7044/miner-dispatcher`
- **Auth:** x402 (PAYMENT-SIGNATURE header) for `/v1/*`; `X-Internal-Secret`
  for `/validate*`; none for discovery.
- **Paths:** 19

## Active miners

The set of live miners changes as operators register and deregister
on-chain. At the time of writing, the active miners are:

| ID | Slug | Name | Capability | Min Price | Endpoints |
|---|---|---|---|---|---|
| 102 | openai | OpenAI | Chat, responses, embeddings, images, moderation | $0.05 | 5 |
| 18 | bittensor-sn18-zeus | Zeus Weather Forecasting | Hourly weather forecasts | $0.01 | 1 |
| 34 | bittensor-sn34-bitmind | BitMind Deepfake Detector | Image/video deepfake detection | $0.02 | 4 |

The `bittensor-` prefix on some slugs is historical — every provider is a
**miner**, whether it's a Bittensor subnet, a hosted model, or a private API.

> The authoritative live list is always `GET /miner-dispatcher/integrations`.

## Endpoint groups

### Discovery (free, no payment)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Dispatcher health check |
| GET | `/integrations` | List all registered miners (authoritative live list) |
| GET | `/integrations/yamls` | Raw YAML text of every miner, keyed by slug |
| GET | `/openapi.yaml` | Dynamically generated OpenAPI 3.0 YAML (live) |
| GET | `/openapi.json` | Dynamically generated OpenAPI 3.0 JSON (live) |

### x402 test

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/v1/x402-test` | Verify x402 payment flow without calling a real miner |

### Dynamic proxy (covers any registered miner)

| Method | Path | Purpose |
|---|---|---|
| GET, POST, PUT, DELETE, PATCH | `/v1/{miner}/{proxyPath}` | Generic x402-gated proxy to any registered miner |

Path params:
- `miner` — numeric ID (`102`) or slug (`openai`).
- `proxyPath` — the sub-endpoint path (e.g. `/chat`, `/predict`).

### OpenAI (id: 102, slug: openai)

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/openai/chat` | Chat Completions (gpt-4o, gpt-4o-mini, o4-mini) |
| POST | `/v1/openai/responses` | Responses API (web search, tool use) |
| POST | `/v1/openai/embed` | Text embeddings (text-embedding-3-small/large) |
| POST | `/v1/openai/images/generate` | DALL-E image generation |
| POST | `/v1/openai/moderate` | Content moderation |

### Zeus Weather (id: 18, slug: bittensor-sn18-zeus)

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/bittensor-sn18-zeus/predict` | Hourly weather forecast (ERA5 variables) |

### BitMind (id: 34, slug: bittensor-sn34-bitmind)

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/bittensor-sn34-bitmind/detect-image` | Deepfake image detection |
| POST | `/v1/bittensor-sn34-bitmind/detect-video` | Deepfake video detection (multipart) |
| POST | `/v1/bittensor-sn34-bitmind/preprocess-video` | Video preprocessing |
| POST | `/v1/bittensor-sn34-bitmind/get-video-upload-url` | Pre-signed upload URL |

### Validation (uses `X-Internal-Secret`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/validate` | Sandbox-test a miner YAML + API key (real HTTP calls to upstream) |
| POST | `/validate/collector` | Schema-only collector YAML validation (no HTTP calls) |

## x402 payment flow

See [Authentication](../overview/authentication.md) for the full x402 flow.
In short: omit `PAYMENT-SIGNATURE` → receive 402 → pay USDC on-chain → retry
with the header → get the result.

Prices vary per miner: Zeus $0.01, BitMind $0.02, OpenAI $0.05. Dynamic
pricing applies a demand multiplier based on 24h volume. See
[`payments-x402.md`](payments-x402.md) for the demand-multiplier table.

## Try it out

After running `make serve`, open <http://localhost:8080>, select the
"Miner Dispatcher" spec from the dropdown, and use the "Try it out" button
on any endpoint. For x402-gated endpoints, you'll need a wallet with USDC
on Base Sepolia to complete the payment step.

## Errors

All 4xx/5xx responses use the standard [Error envelope](../overview/errors.md).
The 402 (Payment Required) response uses the special
[X402ChallengeBody](../overview/errors.md#x402-402-response-special-case)
envelope.