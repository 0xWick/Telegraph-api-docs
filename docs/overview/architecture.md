# Architecture

Telegraph is a **permissionless marketplace for verifiable AI inference** on the
Base L2 network. Three roles participate:

- **Miners** supply inference (register YAML + 100 MACHINA bond on-chain).
- **Validators** verify truth via stake-weighted median scoring (top-64 by
  staked MACHINA, earn 60% of daily emissions).
- **Agents** consume inference and pay USDC (permissionless — no registration).

## The three API surfaces

Telegraph exposes three distinct API surfaces, each documented in its own
OpenAPI spec in this repository:

### 1. Miner-dispatcher HTTP proxy (`openapi/miner-dispatcher.yaml`)

The x402-gated proxy to Bittensor subnets. **The primary inference
marketplace surface.** Agents pay USDC via HTTP 402 challenge-response and
receive verified inference from the requested subnet.

- Server: `/miner-dispatcher`
- Auth: x402 (USDC payment via `PAYMENT-SIGNATURE` header)
- 28 paths covering SN1, SN18, SN19, SN20, SN22, SN32, SN34, SN64 + generic
  dynamic proxy covering SN42/SN101/SN102.

### 2. Engine + Daemon HTTP/WS (`openapi/engine.yaml`, `openapi/daemon.yaml`)

The newer LLM-routed inference layer (`/engine`), the ERC-8183 job lookup,
the intent/miner registry, the WebSocket ask pipeline, and the daemon
dashboard read API.

- Engine server: `/engine`
- Daemon server: `/daemon`
- Auth: x402 (ask endpoints) + EIP-191 (WS subscribe) + none (read-only
  discovery)
- 15 paths total

### 3. Internal bridge / node-ops (`openapi/internal-bridge.yaml`)

TSS coordination, transaction management, validator registry, network
configuration, blockchain wallet ops, epoch receiver, and scoring. Used by
node operators and inter-validator coordination.

- Server: root (`/`)
- Auth: EIP-191 (writes) + `X-Internal-Secret` (internal) + party password
  (TSS workflows) + none (reads)
- 37 paths across 8 tags

### Plus: On-chain contracts (`docs/on-chain/*.md`)

The Diamond Proxy facets (Solidity) are not REST — documented in markdown
only: `registerMiner`, `submitEpoch`, `outboundSubnetMessage`, escrow, etc.

## Economic flow

```
Agent pays USDC → 2% Protocol Treasury, 98% TWAP Settler
TWAP Settler → drips USDC into Machina/USDC Uniswap V3 pool over 24h epoch
Pool → returns Machina to Miner who fulfilled the request
Validators → earn Machina emissions equally (not tied to individual Intents)
```

## Payment pipeline

- **x402** (synchronous): HTTP 402 challenge → Agent pays USDC → verify →
  route → respond.
- **ERC-8183** (asynchronous): Agent creates on-chain job → Autonomous Engine
  detects → executes → submits proof → releases escrow.

## Tech stack

- **Language**: Go 1.25.7
- **Contracts**: Solidity (Diamond Proxy EIP-2535, Foundry)
- **P2P**: libp2p (QUIC, Noise, Circuit Relay v2)
- **Database**: PostgreSQL 16 (pgx/v5)
- **Payments**: x402 (HTTP 402 USDC challenges), ERC-8183 (agentic commerce)
- **Crypto**: TSS MPC (bnb-chain/tss-lib), BLS (BN254), ECDSA

## See also

- [Authentication](authentication.md) — the four auth schemes in detail
- [Errors](errors.md) — the standard error envelope
- [Concepts](concepts.md) — OnChainData, signal_mapping, intents