# On-Chain Contracts (Solidity Diamond Proxy)

Telegraph's on-chain layer is a Diamond Proxy (EIP-2535) with 17 facets. This
is NOT a REST surface — it's documented in markdown only. The facets are:

| Facet | Purpose | Key function |
|---|---|---|
| **SettlementFacet** | Epoch settlement | `submitEpoch()` — BLS verify + rewards + DEX swap |
| **JobFacet** | ERC-8183 jobs | `createJob()` — async job creation, dynamic pricing |
| **MinerRegistryFacet** | Miner registry | `registerMiner()` — YAML binding, floor price, intents |
| **CrossChainFacet** | Bridge messages | Cross-chain message handling |
| **SubnetFacet** | Subnet lifecycle | Subnet request/response |
| **PricingFacet** | Dynamic pricing | `setIntentVolumes()` — demand-based pricing |
| **TreasuryFacet** | Treasury | Treasury management, gas subsidy pool |
| **WebSocketFacet** | WS delivery settlement | `recordDelivery()`, `blacklistWallet()` |
| **EscrowFacet** | Agent USDC escrow | `depositUSDC()`, `requestWithdraw()`, `effectiveBalance()` |
| Admin, ERC20, Fee, Gas, Reward, Signer, View, Wallet | Supporting facets | |

## Reference docs

- [dapp-integration.md](dapp-integration.md) — dApp / smart-contract integration (depositGas, outboundMessage, outboundSubnetMessage, callbacks)
- [inference-spec.md](inference-spec.md) — OnChainData struct + per-subnet request/response index mappings
- [miner-registry.md](miner-registry.md) — MinerRegistryFacet (registerMiner, deregisterMiner, getMiner)
- [ws-payments-contracts.md](ws-payments-contracts.md) — EscrowFacet, WebSocketFacet, SettlementFacet
- [gas-and-fees.md](gas-and-fees.md) — Gas deposit model, min_price_usdc, escrow timelock

## Cross-reference to HTTP API

- The HTTP proxy path `/miner-dispatcher/v1/{subnet}/{proxyPath}` corresponds
  to the on-chain endpoint string `/subnet/{id}/{endpoint}` — see
  [Concepts: endpoint path forms](../overview/concepts.md#endpoint-path-forms).
- ERC-8183 jobs created on-chain are looked up via
  `GET /engine/v1/job/{id}` and `GET /engine/v1/job/{id}/result` (HTTP).
- The epoch receiver (`POST /internal/delivery`, `POST /internal/epoch-close`)
  feeds the settlement engine that produces `submitEpoch()` calls.
- Miner `registerMiner()` on-chain events trigger the listener that hot-loads
  the YAML into the miner-dispatcher.