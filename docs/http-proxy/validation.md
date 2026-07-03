# Miner Validation API

The validation endpoints sandbox-test a miner's integration YAML (and
optionally API key) BEFORE on-chain registration. This lets miners verify
their YAML schema + upstream reachability without paying the 100 MACHINA
bond first.

- **Spec:** [`openapi/miner-dispatcher.yaml`](../../openapi/miner-dispatcher.yaml) (Validation tag)
- **Auth:** `X-Internal-Secret` header (shared `INTERNAL_SECRET` env var).
  If unset, auth disabled (dev-only).
- **Paths:** 2

## Endpoints

### POST /miner-dispatcher/validate

Sandbox-tests a miner's integration YAML + API key against all endpoints
defined in the YAML. Makes **real HTTP calls** to the upstream. On full
success, persists the API key to the `miner_api_keys` table so the miner
can go live immediately after on-chain registration.

**Request body:**
```json
{
  "yaml": "slug: bittensor-sn18-zeus\nname: Zeus Weather Forecasting\n...",
  "api_key": "sk-zeus-abc123"
}
```

**Response (success):**
```json
{
  "valid": true,
  "slug": "bittensor-sn18-zeus",
  "name": "Zeus Weather Forecasting",
  "api_key_stored": true,
  "results": [
    { "path": "/predict", "method": "GET", "status": 200, "success": true, "latency_ms": 412 }
  ]
}
```

**Response (failure — invalid YAML):**
```json
{
  "valid": false,
  "errors": ["missing required field: signal_mapping", "base_url must be a valid URL"],
  "api_key_stored": false
}
```

**Response (failure — bad API key / upstream unreachable):**
```json
{
  "valid": false,
  "errors": ["endpoint /predict returned 401"],
  "results": [
    { "path": "/predict", "method": "GET", "status": 401, "success": false, "error": "unauthorized" }
  ],
  "api_key_stored": false
}
```

The `api_key_stored` field is `true` ONLY when `valid` is `true` — the key
is never persisted on a failure.

### POST /miner-dispatcher/validate/collector

Schema-only validation of a collector YAML. Does **NOT** make HTTP calls to
any upstream. Returns the derived slug, name, and any schema errors.

**Request body:**
```json
{ "yaml": "slug: news-collector\nname: News Collector\n..." }
```

**Response:**
```json
{
  "valid": true,
  "slug": "news-collector",
  "name": "News Collector",
  "errors": []
}
```

## Error responses

| Status | Condition |
|---|---|
| 400 | Invalid request body (missing `yaml` or `api_key`). |
| 401 | Missing/incorrect `X-Internal-Secret` header. |
| 500 | Internal error during validation. |

## How it fits in the registration flow

```
1. Miner writes integration YAML (see docs/integration-guides/yaml-standard.md)
2. Miner calls POST /validate with YAML + API key  ← this endpoint
3. Server validates schema + tests upstream + stores API key (on success)
4. Miner calls MinerRegistryFacet.registerMiner() on-chain (pays 100 MACHINA bond)
5. Listener detects MinerRegistered event → hot-loads the YAML → miner goes live
```

Without step 2, a malformed YAML or bad API key would only be discovered
after the on-chain bond is paid. The validation endpoint lets miners catch
errors early.