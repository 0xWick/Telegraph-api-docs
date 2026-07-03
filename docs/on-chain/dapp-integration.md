# Dapp Integration

Guide for dApp / smart-contract developers integrating with the Telegraph
Diamond (Port) contracts for cross-chain messaging and subnet inference.

> **Source:** This doc is consolidated from the original
> `documentation/Dapp_Integration.md` in the Telegraph monorepo. Content is
> current and accurate.

## Gas deposit

```solidity
// Deposit gas (in native token) to cover destination-chain execution
portContract.depositGas{value: amount}();
```

## Cross-chain outbound message

```solidity
// Send a message to another chain
portContract.outboundMessage(
    sender,        // msg.sender (or delegated)
    destination,   // destination contract address on the end chain
    data,          // ABI-encoded call data
    endChain       // destination chain ID
);
```

The destination contract receives the callback:

```solidity
interface IDestinationContract {
    function portMessage(
        address sender,
        bytes  data,
        uint256 _startChain
    ) external;
}
```

## Subnet (on-chain inference)

```solidity
// Request on-chain subnet inference
portContract.outboundSubnetMessage(
    subnetId,          // e.g. 18 for Zeus
    endpoint,          // "/subnet/18/predict"
    parameters,        // OnChainData struct (4 typed arrays, max 5 each)
    callbackContract   // your ISubnetReceiverContract
);
```

The callback receives the result:

```solidity
interface ISubnetReceiverContract {
    function subnetMessage(
        uint256 id,
        bool    success,
        bytes   response,        // OnChainData struct
        string  errorMessage
    ) external;
}
```

## OnChainData struct

See [`inference-spec.md`](inference-spec.md) for the four typed arrays
(addresses, integers, strings, bools) and the per-endpoint mapping of which
slot holds which parameter.

## See also

- [inference-spec.md](inference-spec.md) — per-subnet request/response index mappings
- [miner-registry.md](miner-registry.md) —miner registration (registerMiner)
- [gas-and-fees.md](gas-and-fees.md) — gas deposit model + escrow timelock