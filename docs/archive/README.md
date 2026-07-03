# Archive

This directory holds retired/stale legacy docs, kept for historical context.
**Do not use these as current API references** — they describe older
framings that have since been superseded.

## Archived files

The following docs from the original Telegraph monorepo have been retired
into this archive (not copied here verbatim — see the originals in
`/home/wick/Telegraph/documentation/` and `/home/wick/Telegraph/docs/` if
you need them):

| Original file | Why archived | Superseded by |
|---|---|---|
| `documentation/HIGH_LEVEL_OVERVIEW.md` | Describes the older TSS-centric "Bridge" framing (Dec 2024); references Cassandra. | [`docs/overview/architecture.md`](../overview/architecture.md) |
| `documentation/QUICK_START.md` | References Cassandra, `/status`, `setup-local.sh` — none match the current stack. | `local-telegraph.sh` + `Terminal.md` in the monorepo |
| `documentation/X402_SUBNET_PAYMENT.md` | Labeled "x402 v2" (March 2025); conflicts with the canonical v1 doc; hardcoded testnet addresses. | [`docs/http-proxy/payments-x402.md`](../http-proxy/payments-x402.md) |
| `README.md` (Telegraph monorepo) | Legacy ops README for the TSS bridge binary on EC2 — unrelated to the API surface. | (none — historical only) |
| `telegraph-openapi.yaml` / `telegraph-openapi.json` (Telegraph root) | Only covered 19 of 92 paths; YAML had an invalid first line; no components/securitySchemes/examples/error schemas. | `openapi/miner-dispatcher.yaml` (this repo — 28 paths, full schemas) |

## Conflicts that were reconciled during consolidation

| Conflict | Resolution |
|---|---|
| x402 version ("v1" vs "v2") and header name (`PAYMENT-SIGNATURE` vs `X-Payment`) | `docs/x402-payment.md` is canonical (v1, `PAYMENT-SIGNATURE`). `X402_SUBNET_PAYMENT.md` retired here. The `X-Payment` mention in the agentic doc was fixed. |
| Subnet count ("8" stated, 10 listed) | Fixed to **10** in [`docs/integration-guides/engine-sdk.md`](../integration-guides/engine-sdk.md) and [`docs/integration-guides/agentic-frameworks.md`](../integration-guides/agentic-frameworks.md). |
| Database technology (Cassandra / Postgres / Mongo) | Telegraph uses PostgreSQL 16 (per the current stack). Older docs mentioned Cassandra/Mongo. The split is documented in [`docs/overview/architecture.md`](../overview/architecture.md) where relevant. |
| WS semantics (subscribe/register vs ask/ping) | Clearly separated: ask-pipeline WS in [`docs/engine-daemon/engine-websocket.md`](../engine-daemon/engine-websocket.md); signal-streaming WS in [`docs/engine-daemon/signal-streaming-ws.md`](../engine-daemon/signal-streaming-ws.md). |
| Path forms (`/subnet/<id>/<path>` vs `/miner-dispatcher/v1/<id>/<path>`) | Both documented and cross-linked in [`docs/overview/concepts.md`](../overview/concepts.md#endpoint-path-forms). |