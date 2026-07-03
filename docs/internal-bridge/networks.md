# Networks, Blockchain, Status, Epoch, Scoring & Static Files

## Networks API

Chain network configuration CRUD + dashboard stats.

- **Paths:** 6
- **Auth:** none

| Method | Path | Description |
|---|---|---|
| GET | `/network` | List all configured networks |
| POST | `/network` | Add a new network |
| PUT | `/network` | Update an existing network |
| DELETE | `/network?id=...` | Remove a network |
| GET | `/api/network/stats` | Aggregated network stats (`no-cache, max-age=60`) |
| GET | `/api/network/stats/lifetime` | Lifetime stats (`no-cache, max-age=300`) |

The network CRUD endpoints return plain strings: `"New Network Added"`,
`"Network Updated"`, `"Network Removed"`. On the GET list, errors are
returned as a string in the 200 body (so always 200, even on failure).

`/api/network/stats` and `/api/network/stats/lifetime` set an
`X-Stats-Warning: Partial data` header when some subsystems fail but others
succeed.

## Blockchain (MPC wallet + signer + fees)

- **Paths:** 4
- **Auth:** rate-limited (`POST /`); none otherwise

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create a new MPC wallet (TSS keygen). **Rate-limited**: 100/min per IP default (override via `config.MaxConn`). Returns `429` when exceeded. |
| GET | `/signer` | Check if this node's wallet is a registered signer on-chain (returns `boolean`) |
| POST | `/signer` | Start the on-chain signer registration workflow |
| GET | `/fees` | Fetch current chain fees |

`POST /` coexists with `GET /` (transaction list) via different HTTP methods
on the same path.

## Status

- **Paths:** 1
- **Auth:** none

`GET /status` — returns the node's status object. Used by peer validators'
`IsAlive` check (validators poll `GET http://<domain>/status` on each
other). Always returns 200 with a status object (or 500 on failure).

## Epoch & Internal (X-Internal-Secret)

- **Paths:** 3
- **Auth:** `X-Internal-Secret` (all endpoints)

| Method | Path | Description |
|---|---|---|
| POST | `/internal/delivery` | Inbound delivery log (engine → epoch receiver). One per ACK'd signal. Enqueues into the epoch service for settlement. Returns `202 Accepted`. |
| POST | `/internal/epoch-close` | Epoch boundary event (engine → epoch receiver). Triggers on-chain settlement submit. Returns `202 Accepted`. |
| GET | `/internal/epoch/current` | Current epoch number |

`/internal/delivery` body: `DeliveryLog` (agent_address, miner_id,
intent_id, usdc_amount, timestamp, epoch_id, node_signature).

`/internal/epoch-close` body: `EpochCloseEvent` (epoch_id, minerUSDC map,
clientUSDC map).

Both return `429` with `code: buffer_full` when the in-memory queue is
saturated — retry shortly.

## Scoring

- **Paths:** 2
- **Auth:** none

| Method | Path | Description |
|---|---|---|
| GET | `/scores` | Paginated epoch scoring results (miner scores per intent per epoch) |
| GET | `/groundtruths/{intent_id}` | Ground-truth question + reference answer for an intent |

`/scores` query params: `epoch` (uint32), `intent` (string, e.g.
`CHAT_COMPLETION`), `miner` (slug), `limit` (1–500, default 100), `offset`
(≥0, default 0).

## Static Files

- **Paths:** 2
- **Auth:** none
- **Mounted conditionally** (only if the corresponding env var is set)

| Method | Path | Env var | Description |
|---|---|---|---|
| GET | `/collectors/{filename}` | `COLLECTORS_YAML_DIR` | Static collector YAML files |
| GET | `/wasm/{filename}` | `WASM_MODULES_DIR` | Static WASM binaries |

These let on-chain registrations reference files by URL (e.g.
`http://node/collectors/news-collector.yaml`).