# Miner Registry (On-Chain)

Permissionless miner registration via `MinerRegistryFacet`.

> **Source:** This doc is consolidated from the original `docs/miner-registry.md`
> in the Telegraph monorepo. Content is current and accurate.

## Architecture

```
On-chain registry (MinerRegistryFacet)
    ↓ MinerRegistered event
Listener (pkg/listener)
    ↓ fetches YAML from yamlUrl, verifies hash
DB (miner_registry table)
    ↓ hot-reload
Miner Dispatcher (Gin router)
    ↓ miner goes live
```

Key design decisions: epoch-based activation, dual-index O(δ) catch-up,
block-height epochs, startup rehydration, rejected-YAML storage.

## MinerRegistryFacet.sol

### Storage struct (per registered miner)

```solidity
struct Miner {
    address feeAddress;       // where USDC is paid
    bytes32 yamlHash;         // keccak256 of the YAML contents
    string  yamlUrl;          // URL serving the YAML (https://node/collectors/<slug>.yaml)
    uint256 minPriceUsdc;     // floor price in micro-USDC
    bytes32[] supportedIntents; // 32-byte intent hashes
    bool    active;           // currently registered
    uint256 registeredAt;     // epoch of registration
}
```

### Functions

| Function | Caller | Purpose |
|---|---|---|
| `registerMiner(yamlUrl, yamlHash, feeAddress, minPriceUsdc, supportedIntents)` | miner | Register a new miner integration. Pays 100 MACHINA bond. |
| `deregisterMiner(id)` | miner | Deregister. 21-day unbonding. |
| `getMiner(id)` | anyone | Read a miner's record. |
| `minerCount()` | anyone | Total registered miner count. |
| `getDeregisteredIdCount()` | anyone | Count of deregistered (unbonding) miners. |
| `getDeregisteredIdAtIndex(i)` | anyone | Paginated access to deregistered IDs. |
| `getCanonicalIntents()` | anyone | The canonical set of intent hashes. |

## `cast send` instructions (miner)

```bash
# Register
cast send $DIAMOND "registerMiner(string,bytes32,address,uint256,bytes32[])" \
  "https://node.example.com/collectors/zeus.yaml" \
  $(cast keccak $(cat zeus.yaml)) \
  0xYourFeeAddress \
  10000 \
  "[$(cast keccak $(printf 'WEATHER_FORECAST'))]"

# Deregister (starts 21-day unbonding)
cast send $DIAMOND "deregisterMiner(uint256)" 42
```

## Validation before registering

Use `POST /miner-dispatcher/validate` (see
[`docs/http-proxy/validation.md`](../http-proxy/validation.md)) to
sandbox-test the YAML + API key BEFORE paying the on-chain bond.

## See also

- [yaml-standard.md](../integration-guides/yaml-standard.md) — the YAML Miner Standard reference
- [gas-and-fees.md](gas-and-fees.md) — bond, floor price, escrow