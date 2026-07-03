# Transactions API

Cross-chain bridge transaction management, search, and stats.

- **OpenAPI spec:** [`openapi/internal-bridge.yaml`](../../openapi/internal-bridge.yaml) (Transactions tag)
- **Paths:** 15

## Write endpoints (EIP-191 auth)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | EIP-191 | Create a bridge transaction (forwards to multisig signing) |
| PUT | `/update` | EIP-191 | Update a transaction |
| POST | `/nodeIndex/update` | EIP-191 | Update the active signer node index |

`POST /create` and `PUT /update` receive raw JSON bytes forwarded to the
multisig signing flow. Returns `200` with `"Transaction Create started"` /
`"Transaction Update started"`.

`POST /nodeIndex/update` validates the index range and that the target
validator is alive.

## Peer-relay endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| POST | `/returnSigned` | Receive signed registration txs from a peer validator (HTTP path; P2P path also exists) |
| POST | `/retryRegisterSigner` | Retry the on-chain `RegisterSigner` call using stored signatures |
| POST | `/requestSignTransaction` | Request a TSS signing operation (routes via P2P or HTTP to the responsible validator) |

## Read endpoints (no auth)

| Method | Path | Description | Cache-Control |
|---|---|---|---|
| GET | `/` | List all transactions | — |
| GET | `/api/transactions/recent` | Paginated recent transactions (with search) | — |
| GET | `/api/search/{hash}` | Search a single transaction by hash | `public, max-age=86400` |
| GET | `/api/transaction/{hash}` | Detailed transaction data by hash | `public, max-age=86400` |
| GET | `/api/network/stats/today` | Today's transaction stats | `no-cache, max-age=60` |
| GET | `/api/address/{address}/overview` | Address overview | `public, max-age=300` |
| GET | `/api/address/{address}/transactions` | Address transactions (paginated) | `public, max-age=60` |
| GET | `/api/transactions/dailyTransactionCount` | Count of transactions in last 24h | `public, max-age=60` |
| GET | `/api/transactions/countHistory` | Daily counts for last N days | `public, max-age=3600` |

### Pagination params

`/api/transactions/recent` and `/api/address/{address}/transactions` accept:
- `page` (default 1)
- `pageSize` (1–100, default 20)
- `search` (string)

`/api/transactions/countHistory` accepts `days` (1–90, default 30).

## Path validation

Tx hash path params require `0x`-prefixed 32-byte hex (66 chars), pattern
`^0x[a-fA-F0-9]{64}$`. Address path params require `0x`-prefixed 40-byte
hex (42 chars), pattern `^0x[a-fA-F0-9]{40}$`.

## Errors

| Status | Condition |
|---|---|
| 400 | Invalid hash/address format, invalid body, invalid node index |
| 403 | EIP-191 signature verification failed |
| 404 | Transaction not found |
| 500 | Fetch/encode error |