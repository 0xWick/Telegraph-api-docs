# Concepts

Core concepts you need to understand the Telegraph API surface.

## Intents

An **intent** is a typed inference capability — e.g.
`CHAT_COMPLETION`, `WEATHER_FORECAST`, `IMAGE_GENERATION`,
`TEXT_AUTHENTICITY`. Miners register which intents they serve; the LLM
router classifies an Agent's natural-language query into an intent, then
picks a miner for that intent.

- Intent IDs are either uppercase names (`WEATHER_FORECAST`) or 32-byte hex
  hashes (the on-chain canonical form).
- Browse intents: `GET /engine/v1/intents`, `GET /engine/v1/intents/{id}`.
- Browse miners per intent: `GET /engine/v1/intents/{id}/miners`.
- Browse WASM validation scripts per intent: `GET /engine/v1/intents/{id}/wasm`.

## Miners (subnets)

A **miner** is a registered subnet integration. Each miner:
- Has a YAML integration file (the "YAML Miner Standard") declaring its
  endpoints, auth, signal mapping, and on-chain registration.
- Pays a **100 MACHINA bond** on-chain to register.
- Has a slug (e.g. `bittensor-sn18-zeus`) and a numeric subnet ID (e.g. `18`).
- Commits a `minPriceUsdc` floor price on-chain (used by x402 dynamic pricing).

Discover miners: `GET /engine/v1/miners`, `GET /miner-dispatcher/integrations`.

## Signal mapping

Every miner's YAML declares a **signal mapping** — how the upstream
response maps to a Telegraph signal. This is encoded as the `x-telegraph`
vendor extension in the OpenAPI specs:

```yaml
x-telegraph:
  payment: x402
  slug: bittensor-sn18-zeus
  subnet_id: "18"
  signal_mapping:
    type: weather_risk            # the signal type
    label_field: risk_level       # which response field holds the label
    confidence_field: storm_probability  # optional confidence field
    reason_field: synthesis       # optional reasoning field
```

Signal `type` values observed across the subnets:
- `language_response` — SN1/SN64 chat
- `multimodal_response` — SN19 image/avatar
- `task_completion` — SN20 Bounty
- `search_relevance` — SN22 DeSearch
- `weather_risk` — SN18 Zeus
- `text_authenticity` — SN32 ItsAI
- `media_authenticity` — SN34 BitMind

## OnChainData struct (on-chain encoding)

For ERC-8183 on-chain inference, the `outboundSubnetMessage` contract call
encodes request parameters as four typed arrays:

| Array | Type | Max length (outbound) |
|---|---|---|
| `addresses` | address[] | 5 |
| `integers` | uint256[] | 5 |
| `strings` | string[] | 5 |
| `bools` | bool[] | 5 |

The callback `subnetMessage(id, success, response, errorMessage)` returns
the same shape. The per-endpoint mapping (which slot holds which parameter)
is documented in [`docs/on-chain/inference-spec.md`](../on-chain/inference-spec.md).

## Endpoint path forms

Telegraph uses two path forms for subnets — don't confuse them:

| Path form | Where | Example |
|---|---|---|
| `/miner-dispatcher/v1/{subnet}/{proxyPath}` | HTTP proxy (this API) | `/miner-dispatcher/v1/18/predict` |
| `/subnet/{id}/{endpoint}` | On-chain `outboundSubnetMessage` endpoint string | `/subnet/18/predict` |

They share the same `{id}/{endpoint}` tail but different prefixes — one is
the HTTP REST path, the other is the on-chain encoded endpoint string.

## x402 vs ERC-8183

Two payment pipelines, both USDC:

| | x402 | ERC-8183 |
|---|---|---|
| **Mode** | Synchronous (HTTP blocking) | Asynchronous (on-chain job) |
| **Trigger** | HTTP request | `createJob()` on-chain |
| **Resolution** | Pay USDC → retry → get result | Engine detects job → executes → submits proof → escrow releases |
| **Lookup** | N/A | `GET /engine/v1/job/{id}`, `GET /engine/v1/job/{id}/result` |

## Epochs

An **epoch** is a 24-hour settlement window (86,400s; reduced in dev).
Signals delivered during an epoch are aggregated, then settled on-chain via
`submitEpoch()` with a BLS aggregate signature and a Merkle tree of
delivery logs. Miners claim Machina rewards via Merkle-pull.

- Current epoch: `GET /internal/epoch/current` (requires `X-Internal-Secret`)
- Epoch scoring results: `GET /scores?epoch=N&intent=X`
- Ground truth (for scoring): `GET /groundtruths/{intent_id}`

## TSS (threshold signature scheme)

The bridge uses **bnb-chain/tss-lib** for distributed key generation,
signing, and resharing among the validator set. The `/validator/*`
endpoints coordinate these workflows:

- `POST /validator/start` — distributed keygen (creates the MPC wallet)
- `POST /validator/sign` — threshold signing of a message
- `POST /validator/reshare` — key resharing when the validator set changes
- `POST /validator/update` — apply raw TSS update bytes

BFT threshold: τ = 43/64. The genesis node propagates workflow triggers to
peers, then starts local execution.

See [`docs/internal-bridge/validators.md`](../internal-bridge/validators.md)
for the TSS workflow reference.