# Internal Bridge & Node Ops API

The internal bridge / node-ops surface covers TSS coordination, transaction
management, validator registry, network configuration, blockchain wallet
ops, epoch receiver, and scoring. Used by node operators and inter-validator
coordination.

- **OpenAPI spec:** [`openapi/internal-bridge.yaml`](../../openapi/internal-bridge.yaml)
- **Server:** `https://<node>` (root mount)
- **Auth:** EIP-191 (writes) + `X-Internal-Secret` (internal) + party password
  (TSS) + none (reads)
- **Paths:** 37 across 8 tags

## Tag reference

| Tag | Docs | Paths |
|---|---|---|
| Status | [status.md](status.md) | 1 |
| Transactions | [transactions.md](transactions.md) | 15 |
| Validators | [validators.md](validators.md) | 10 |
| Networks | [networks.md](networks.md) | 6 |
| Blockchain | [blockchain.md](blockchain.md) | 4 |
| Epoch & Internal | [epoch-internal.md](epoch-internal.md) | 3 |
| Scoring | [scoring.md](scoring.md) | 2 |
| Static Files | [static-files.md](static-files.md) | 2 |

## Authentication summary

| Tag | Endpoints | Auth |
|---|---|---|
| Status | `GET /status` | none |
| Transactions | most reads | none |
| Transactions | `POST /create`, `PUT /update`, `POST /nodeIndex/update` | EIP-191 (`Authorization`) |
| Transactions | `/returnSigned`, `/requestSignTransaction`, `/retryRegisterSigner` | none (peer-relay) |
| Validators | `GET /api/validators`, `GET /api/validator/{address}`, `GET /api/totalValidators` | none |
| Validators | `GET /validator`, `POST /validator/sign`, `POST /validator/update` | none |
| Validators | `POST /validator/start`, `POST /validator/reshare` | party password |
| Validators | `POST /validator/params`, `PUT /validator/params` | none |
| Networks | CRUD | none |
| Blockchain | `GET /signer`, `GET /fees` | none |
| Blockchain | `POST /` (wallet create) | rate-limited |
| Blockchain | `POST /signer` | none (service-level) |
| Epoch & Internal | all `/internal/*` | `X-Internal-Secret` |
| Scoring | `GET /scores`, `GET /groundtruths/{intent_id}` | none |
| Static Files | `/collectors/*`, `/wasm/*` | none |