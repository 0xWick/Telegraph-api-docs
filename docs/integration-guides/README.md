# Integration Guides

Step-by-step guides for different consumer types.

## For AI Agent / agentic-framework developers

- [agentic-frameworks.md](agentic-frameworks.md) — LangChain (Python), ElizaOS
  (JS, via `x402-fetch`), and raw curl. Covers the discovery layer, x402 flow,
  and the `x-telegraph` OpenAPI extension.

## For miner developers (integrating a new subnet)

- [yaml-standard.md](yaml-standard.md) — the YAML Miner Standard reference
  (fields, parameter mapping, on-chain request transforms, schema validation).
- [engine-sdk.md](engine-sdk.md) — the Autonomous Engine Open SDK (Go) for
  consuming the miner-dispatcher as a library (`Dispatcher`, `SubnetClient`,
  `Fetch`, signal mapping).

## For dApp / smart-contract developers

- [../on-chain/dapp-integration.md](../on-chain/dapp-integration.md) —
  `depositGas`, `outboundMessage`, `outboundSubnetMessage`, callbacks.
- [../on-chain/inference-spec.md](../on-chain/inference-spec.md) —
  OnChainData struct + per-subnet index mappings.
- [../on-chain/miner-registry.md](../on-chain/miner-registry.md) —
  `registerMiner()` on-chain flow.

## For node operators

- [../overview/architecture.md](../overview/architecture.md) — the three API surfaces
- [../overview/authentication.md](../overview/authentication.md) — the four auth schemes
- [../internal-bridge/overview.md](../internal-bridge/overview.md) — TSS coordination, epoch receiver, etc.