# Gas & Fees

## Gas deposit model

Cross-chain messages and subnet inference require gas deposits:

- `depositGas(amount)` — deposit gas (in the chain's native token) to cover
  the destination-chain execution of an outbound message. Without sufficient
  gas, the message won't be relayed.
- The gas is reimbursed to the relayer (validator) who submits the
  transaction on the destination chain.

## min_price_usdc (miner floor price)

Each miner commits a `minPriceUsdc` on-chain via `MinerRegistryFacet` at
registration time. This is the floor price for x402 payments on that miner's
endpoints.

- Minimum floor: **0.01 USDC** (10,000 micro-USDC).
- The dispatcher's `dynamicPriceFunc` reads this floor and applies a demand
  multiplier based on the subnet's 24h call volume. See
  [`docs/http-proxy/payments-x402.md`](../http-proxy/payments-x402.md) for
  the demand multiplier table.

## Escrow timelock (WS payments)

The EscrowFacet holds agent USDC for the WebSocket signal-streaming product:

- `depositUSDC(amount)` — agent deposits USDC into escrow.
- `requestWithdraw()` — agent requests a withdrawal. Subject to a **timelock**
  (the agent must wait for the timelock to expire before executing).
- `executeWithdraw()` — agent executes the withdrawal after the timelock.
- `effectiveBalance(address)` — returns the effective (unlocked) balance,
  accounting for pending withdrawals and in-flight signals.

The WebSocketFacet enforces a **$1 USDC floor** (the "KnockGate") — wallets
below the floor cannot subscribe to the signal stream.

## Protocol fee

- **2%** of every Agent USDC payment goes to the Protocol Treasury.
- **98%** goes to the TWAP Settler, which drips USDC into the Machina/USDC
  Uniswap V3 pool over the 24h epoch, returning Machina to the fulfilling
  miner.

See [`docs/on-chain/ws-payments-contracts.md`](ws-payments-contracts.md) for
the full settlement flow.