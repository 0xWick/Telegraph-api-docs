# WS Payments Contracts (EscrowFacet, WebSocketFacet, SettlementFacet)

Architecture for the WebSocket signal-streaming product: USDC escrow +
per-epoch settlement + Machina claims.

> **Source:** This doc is consolidated from the original
> `docs/WS_PAYMENTS_ARCHITECTURE.md` in the Telegraph monorepo. Content is
> current/in-progress.

## Problem

Decouple data delivery from settlement — delivery is synchronous (the agent
ACKs each signal) but settlement is batched (per-epoch, on-chain). The
escrow + Merkle-pull design allows this without per-signal on-chain calls.

## Contract facets

### EscrowFacet

Manages agent USDC escrow.

| Function | Caller | Purpose |
|---|---|---|
| `depositUSDC(amount)` | agent | Deposit USDC into escrow |
| `requestWithdraw()` | agent | Request a withdrawal (subject to timelock) |
| `executeWithdraw()` | agent | Execute the withdrawal after timelock |
| `effectiveBalance(address)` | anyone | Effective unlocked balance (accounting for pending withdrawals + in-flight signals) |

### WebSocketFacet

Records delivery logs (one per ACK'd signal) for settlement.

| Function | Caller | Purpose |
|---|---|---|
| `recordDelivery(log)` | validator | Record a delivery log (off-chain aggregated, settled per-epoch) |
| `blacklistWallet(address)` | admin | Blacklist a malicious wallet |
| `isBlacklisted(address)` | anyone | Check blacklist status |

### SettlementFacet

Per-epoch on-chain settlement with BLS aggregate signature + Merkle tree.

| Function | Caller | Purpose |
|---|---|---|
| `submitEpoch(epochId, totals, merkleRoot, blsSig)` | validator | Submit the epoch's aggregated totals + Merkle root. BLS-verified. Distributes rewards + DEX swap. |
| `claimRewards(merkleProof)` | miner | Merkle-pull claim of accrued Machina rewards |

## Go-side integration seam

- `interfaces.DeliveryLog` — the delivery log type
- `interfaces.DeliveryLogSource` — the source interface
- `pkg/settlement.SettlementEngine.RecordDelivery()` — off-chain aggregator
- `pkg/settlement.SettlementEngine.GetEffectiveBalance()`
- `pkg/settlement.SettlementEngine.IsBlacklisted()`
- `pkg/settlement.GetDeliveryLogs()`
- `pkg/builder` — epoch settlement builder + epoch handlers
- `pkg/simulator` — E2E test infrastructure

## Game-theoretic guards

- **Max steal:** $0.01 per signal (capped by per-call price)
- **$1 floor** (KnockGate): wallets below $1 cannot subscribe
- **500ms ACK timeout:** signals not ACK'd within 500ms are not counted
  (prevents withholding-then-replay attacks)

## Status

E2E tests green; Solidity tests pass. Design/architecture doc — not a
request/response reference.