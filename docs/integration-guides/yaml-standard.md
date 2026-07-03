# YAML Miner Standard

Full reference for the YAML integration files — the declarative miner
integrations loaded on-chain via `MinerRegistryFacet.registerMiner()`.

> **Source:** This doc is consolidated from the original `docs/yaml-standard.md`
> in the Telegraph monorepo. Content is current (Version 1, Production).

## Minimal example

```yaml
slug: bittensor-sn18-zeus
name: Zeus Weather Forecasting
kind: bittensor
protocol: rest
base_url: https://api.zeus.predict

auth:
  type: header
  header: Authorization
  env_var: ZEUS_API_KEY

endpoints:
  - path: /predict
    method: GET
    description: Weather forecast
    parameters:
      - name: lat
        in: query
        required: true
        schema: { type: number, minimum: -90, maximum: 90 }
      - name: lon
        in: query
        required: true
        schema: { type: number, minimum: -180, maximum: 180 }
    param_map:
      lat: latitude
      lon: longitude

semantics:
  intent: WEATHER_FORECAST
  signal_mapping:
    type: weather_risk
    label_field: risk_level
    confidence_field: storm_probability

on_chain:
  request:
    integers: [lat, lon]
```

## Complete example

See [`docs/http-proxy/validation.md`](../http-proxy/validation.md) for the
sandbox-validation flow, and use `telegraph integration init <name>` to
scaffold a full template.

## Field reference

### Top-level

| Field | Required | Description |
|---|---|---|
| `slug` | yes | URL-safe slug (e.g. `bittensor-sn18-zeus`) |
| `name` | yes | Human-readable name |
| `kind` | yes | Integration kind (e.g. `bittensor`) |
| `protocol` | yes | Wire protocol (`rest`) |
| `base_url` | yes | Upstream base URL |
| `auth` | yes | Upstream auth (see below) |
| `endpoints` | yes | List of exposed endpoints |
| `semantics` | yes | Intent + signal mapping |
| `on_chain` | no | On-chain request mapping + transforms |

### `auth`

| `type` | Fields | Description |
|---|---|---|
| `bearer` | `env_var` | Bearer token resolved from env var |
| `header` | `header`, `env_var` | Custom header (e.g. `Authorization`) |
| `none` | — | No upstream auth |

### `endpoints[]`

| Field | Description |
|---|---|
| `path` | The sub-endpoint path (e.g. `/predict`) |
| `method` | HTTP method |
| `description` | Human-readable |
| `parameters` | Query/path/header params (OpenAPI-like) |
| `param_map` | Rename incoming params to upstream convention |
| `request_body` | Body schema (if any) |

### `semantics`

| Field | Description |
|---|---|
| `intent` | The intent ID (e.g. `WEATHER_FORECAST`) |
| `signal_mapping.type` | Signal type (e.g. `weather_risk`, `language_response`) |
| `signal_mapping.label_field` | Response field holding the label |
| `signal_mapping.confidence_field` | Optional confidence field |
| `signal_mapping.reason_field` | Optional reasoning field |

### `on_chain.request`

Maps YAML parameters to the `OnChainData` typed arrays (see
[`docs/on-chain/inference-spec.md`](../on-chain/inference-spec.md)):

```yaml
on_chain:
  request:
    integers: [lat, lon]    # names of params that go into integers[]
    strings: [text]         # names of params that go into strings[]
    bools: [stream]
    addresses: [recipient]
```

### `on_chain.transform` (direct + LLM)

Some subnets need a transform between the on-chain request shape and the
upstream HTTP shape. Two modes:
- `direct` — apply param_map only (no LLM)
- `llm` — pass the on-chain request through an LLM to build the HTTP body

## Schema validation

Use `telegraph integration validate <file.yaml>` or
`POST /miner-dispatcher/validate` (see
[`docs/http-proxy/validation.md`](../http-proxy/validation.md)).

## v1 vs v2

| | v1 | v2 |
|---|---|---|
| `semantics.intent` | string name | 32-byte hash |
| `on_chain.transform` | `direct` only | `direct` + `llm` |
| `endpoints.request_body` | optional | required for POST/PUT |

## See also

- [engine-sdk.md](engine-sdk.md) — consuming the dispatcher as a Go library
- [../on-chain/miner-registry.md](../on-chain/miner-registry.md) — `registerMiner()` on-chain