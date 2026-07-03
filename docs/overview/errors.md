# Errors

Every Telegraph 4xx/5xx response uses a standard JSON error envelope,
defined as `components/schemas/Error.yaml` in the OpenAPI specs.

## Error envelope

```json
{
  "error": "invalid request body: missing required field 'query'",
  "code": "invalid_request",
  "details": {
    "field": "query",
    "issue": "required"
  },
  "request_id": "req_01HMZK8X2J9QABCDEF"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `error` | string | yes | Human-readable error message. |
| `code` | string | no | Machine-readable error code. Common values below. |
| `details` | object | no | Structured details (field-level validation, upstream errors). |
| `request_id` | string | no | Correlation ID for tracing. |

## Common error codes

| `code` | HTTP status | Meaning |
|---|---|---|
| `invalid_request` | 400 | Malformed JSON, missing required field, bad parameter. |
| `unauthorized` | 401 | Missing/invalid `Authorization`, `X-Internal-Secret`, or `X-Party-Password`. |
| `forbidden` | 403 | Authenticated but not permitted (e.g. genesis-only endpoint). |
| `payment_required` | 402 | x402 — no/invalid `PAYMENT-SIGNATURE`. Retry after paying USDC. |
| `not_found` | 404 | Resource (subnet, job, intent, transaction) not found. |
| `method_not_allowed` | 405 | Method not allowed (e.g. POST on a GET-only daemon endpoint). |
| `rate_limited` | 429 | Rate limit exceeded (e.g. `POST /` wallet creation, 100/min). |
| `buffer_full` | 429 | Epoch receiver queue full — try again shortly. |
| `upstream_error` | 502 | Upstream subnet returned an error or was unreachable. |
| `internal_error` | 500 | Unexpected internal server error (routing failed, all miners failed). |

## x402 402 response (special case)

The x402 `402 Payment Required` response is NOT an error — it's a payment
challenge. It uses a different body (see `X402ChallengeBody.yaml`):

```json
{
  "error": "x402 payment required",
  "accepts": [
    {
      "scheme": "x402",
      "price": "10000",
      "network": "base-sepolia",
      "payTo": "0x..."
    }
  ]
}
```

See [Authentication](authentication.md) for the full x402 flow.

## Partial-data headers

Some read endpoints set an `X-Stats-Warning: Partial data` header when some
subsystems fail but others succeed. The response body still returns 200 with
whatever data is available — check the header to know whether the data is
complete.

Endpoints that do this:
- `GET /api/network/stats`
- `GET /api/network/stats/lifetime`
- `GET /api/network/stats/today`
- `GET /api/address/{address}/overview`

## WebSocket errors

The Engine WebSocket (`/engine/ws`) sends error frames rather than HTTP
status codes:

```json
{ "type": "error", "data": { "message": "wallet verification required" }, "timestamp": "..." }
```

Common WS error messages:
- `wallet verification required` — tried to `subscribe` without EIP-191
  verification
- `query is required` — `ask` action with no `query` field
- `routing failed` — LLM router couldn't classify the intent
- `all miners failed` — both primary and fallback miners returned errors
- `insufficient escrow balance` — wallet below the $1 USDC floor (KnockGate)

See [`docs/engine-daemon/engine-websocket.md`](../engine-daemon/engine-websocket.md)
for the full WS frame reference.