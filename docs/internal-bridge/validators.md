# Validators API

Validator registry + TSS (threshold signature scheme) coordination.

- **OpenAPI spec:** [`openapi/internal-bridge.yaml`](../../openapi/internal-bridge.yaml) (Validators tag)
- **Paths:** 10

## TSS workflows (party-password auth)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/validator/start` | party password | Start TSS distributed keygen |
| POST | `/validator/sign` | none | Start TSS keysign for a message |
| POST | `/validator/reshare` | party password | Start TSS key resharing (validator set changes) |
| POST | `/validator/update` | none | Apply raw TSS update bytes (async) |

### TSS keygen flow (`POST /validator/start`)

```
1. Genesis node receives POST /validator/start (with party password)
2. Genesis validates: threshold >= party count, config loads, party password matches
3. Genesis propagates the start trigger to all peer validators (via P2P/HTTP)
4. Each validator (incl. genesis) starts local tss-lib keygen
5. Threshold signers produce the distributed MPC wallet key
```

### TSS keysign (`POST /validator/sign`)

Body: `{ "message": "<decimal big-int string>" }`. Genesis propagates to
peers then starts local keysign. The signed result is collected via
`/returnSigned` from each signer.

### TSS reshare (`POST /validator/reshare`)

Same flow as keygen, but produces a new sharing of the existing key — used
when the validator set changes (e.g. after an ejection or new registration).

## Validator params (TSS group sync)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/validator` | none | Get this node's validator record |
| POST | `/validator/params` | none | Add validator params (party info) |
| PUT | `/validator/params` | none | Update validator params (genesis-only; non-genesis accepts) |

`PUT /validator/params` is called by the genesis node to sync the TSS group
state to non-genesis nodes. Returns `400` if this node IS genesis (genesis
doesn't accept updates — it sends them).

## Read endpoints (no auth)

| Method | Path | Description | Cache-Control |
|---|---|---|---|
| GET | `/api/validators` | All validators with on-chain metrics (optional `search`) | `no-cache, max-age=300` |
| GET | `/api/validator/{address}` | Single validator with metrics | `no-cache, max-age=60` |
| GET | `/api/totalValidators` | Total validator count | `public, max-age=60` |

## Validator schema

```json
{
  "publicethaddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "moniker": "node-1",
  "lastpingtime": "2026-07-03T12:00:00Z",
  "domain": "https://node1.example.com",
  "ismine": false,
  "peer_id": "12D3KooW..."
}
```

## Errors

| Status | Condition |
|---|---|
| 400 | This node is genesis (on `PUT /validator/params`); invalid body; threshold < party count |
| 401 | Config load failed (on start/reshare) |
| 403 | Party password mismatch |
| 404 | Validator not found |
| 500 | Fetch/metrics/marshal error |