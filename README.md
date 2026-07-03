# Telegraph API Documentation

OpenAPI specifications, interactive Swagger UI, and human-authored reference
documentation for the **Telegraph Protocol** — the permissionless marketplace
for verifiable AI inference on Base L2.

This repository is the single source of truth for the Telegraph HTTP, WebSocket,
and on-chain contract API surfaces. It is consumed by:

- The **Swagger UI** hosted on GitHub Pages (interactive "Try it out" explorer).
- The **`openapi/*.yaml`** spec files (for codegen, SDKs, Postman, and tooling).
- The **`docs/`** markdown reference (for readers who want prose + examples).

---

## Quick start

```bash
# 1. Install dev dependencies (Spectral, swagger-ui-dist, swagger-parser)
make install

# 2. Serve the interactive Swagger UI on http://localhost:8080
make serve

# 3. (optional) Lint + validate every spec
make ci
```

Open <http://localhost:8080> — the top bar has a dropdown to switch between
the five OpenAPI specs.

---

## Repository layout

```
openapi/                 # The 5 OpenAPI 3.0 specs (source of truth for tooling)
  miner-dispatcher.yaml  #   x402-gated Bittensor subnet proxy (~25 paths)
  engine.yaml            #   Engine REST + WebSocket (~11 paths)
  daemon.yaml            #   Daemon read API (~4 paths)
  internal-bridge.yaml   #   TSS bridge node-ops surface (~40 paths)
  bittensor-legacy.yaml  #   Deprecated /api/miners/* proxy (~6 paths)
components/              # Reusable schema/security/example fragments ($ref'd)
swagger-ui/              # Static Swagger UI site (published to GitHub Pages)
docs/                    # Human-authored markdown reference
  overview/              #   architecture, auth, errors, concepts
  http-proxy/            #   miner-dispatcher surface
  engine-daemon/         #   engine + daemon surface
  internal-bridge/       #   TSS node-ops surface
  on-chain/              #   Solidity Diamond contracts (MD only — not REST)
  integration-guides/    #   SDK + agentic-framework + YAML standard
  archive/               #   retired/stale legacy docs
scripts/                 # build + validate + local-serve helpers
.github/workflows/       # CI: validate.yml + publish-pages.yml
```

---

## The three API surfaces

Telegraph exposes three distinct API surfaces. Each has its own OpenAPI spec
(except on-chain contracts, which are not REST and are documented in markdown
only).

| Surface | Spec | Auth | Description |
|---|---|---|---|
| **Miner-dispatcher HTTP proxy** | `openapi/miner-dispatcher.yaml` | x402 USDC | The x402-gated proxy to Bittensor subnets (SN1, 18, 19, 20, 22, 32, 34, 42, 64, 101, 102). The primary "inference marketplace" surface. |
| **Engine + Daemon HTTP/WS** | `openapi/engine.yaml` + `openapi/daemon.yaml` | x402 / EIP-191 / none | The newer LLM-routed `/v1/ask` engine, the ERC-8183 job lookup, the WebSocket ask pipeline, and the daemon dashboard read API. |
| **Internal bridge node-ops** | `openapi/internal-bridge.yaml` | EIP-191 / `X-Internal-Secret` / party password | TSS keygen/sign/reshare, transactions, validators, networks, status, epoch receiver. Used by node operators and inter-validator coordination. |
| **Legacy bittensor proxy** | `openapi/bittensor-legacy.yaml` | none (deprecated) | The older non-x402 `/api/miners/*` proxy. Superseded by the miner-dispatcher. |
| **On-chain contracts** | `docs/on-chain/*.md` | `msg.sender` (Solidity) | The Diamond Proxy facets: `registerMiner`, `submitEpoch`, `outboundSubnetMessage`, escrow, etc. Not REST — markdown only. |

---

## Authentication schemes

Telegraph uses **four** authentication schemes across its surfaces. All are
defined as OpenAPI `securitySchemes` in the relevant specs.

| Scheme | Header | Used by | Notes |
|---|---|---|---|
| **x402 payment** | `PAYMENT-SIGNATURE` | miner-dispatcher `/v1/*`, engine `/v1/ask*` | HTTP 402 challenge → Agent pays USDC on Base/Polygon/Solana → retry with signature. The payment IS the auth. |
| **EIP-191 wallet** | `Authorization` | transaction writes, validator writes, engine WS subscribe | `personal_sign` of a server-issued nonce, verified on each request. |
| **Internal secret** | `X-Internal-Secret` | `/internal/*`, `/miner-dispatcher/validate*` | Shared secret from the `INTERNAL_SECRET` env var. Dev-unsafe if unset. |
| **Party password** | (config body) | `/validator/start`, `/validator/reshare` | TSS workflow auth, validated against the node's `PartyPassword` config. |

See [`docs/overview/authentication.md`](docs/overview/authentication.md) for the
full flow diagrams and code samples.

---

## Contributing

1. Edit the spec in `openapi/<surface>.yaml`. Reuse schemas from
   `components/schemas/` via `$ref`.
2. Run `make ci` locally — Spectral lint + swagger-parser validation must pass.
3. Commit. CI runs the same checks on the PR.
4. On merge to `main`, GitHub Pages republishes automatically.

---

## Status

All 5 specs pass Spectral lint (0 errors, 0 warnings) and swagger-parser
validation. The build pipeline produces self-contained bundled specs (no
external `$ref`s) suitable for direct Swagger UI consumption.

| Spec | Paths | Lint | Validate |
|---|---|---|---|
| `openapi/miner-dispatcher.yaml` | 28 | clean | valid |
| `openapi/engine.yaml` | 11 | clean | valid |
| `openapi/daemon.yaml` | 4 | clean | valid |
| `openapi/internal-bridge.yaml` | 37 | clean | valid |
| `openapi/bittensor-legacy.yaml` | 12 | clean | valid |
| **Total** | **92 paths** | | |

Documentation: 33 markdown files across 7 sections (`overview`, `http-proxy`,
`engine-daemon`, `internal-bridge`, `on-chain`, `integration-guides`,
`archive`).

---

## License

MIT. See the repository license file.
