# Agentic Framework Integration

Guide for AI agents and agentic frameworks (LangChain, ElizaOS, any
OpenAPI-compatible) to connect to Telegraph.

> **Source:** This doc is consolidated from the original
> `documentation/AGENTIC_FRAMEWORK_INTEGRATION.md` in the Telegraph monorepo.
> Content is current; the legacy `X-Payment` header reference has been
> corrected to `PAYMENT-SIGNATURE`.

## The two layers

### 1. Discovery (free, no payment)

Before paying, discover what's available:

```bash
# List all registered integrations
curl https://your-stable-domain.com/miner-dispatcher/integrations

# Get the live OpenAPI spec (generated from current integrations)
curl https://your-stable-domain.com/miner-dispatcher/openapi.yaml

# Or engine catalog
curl https://your-stable-domain.com/engine/v1/miners
```

### 2. Inference (x402 payment)

Pay $0.01 USDC per call via the x402 protocol. See
[`docs/http-proxy/payments-x402.md`](../http-proxy/payments-x402.md) for the
full flow.

## The `x-telegraph` OpenAPI extension

Every miner-dispatcher operation carries the `x-telegraph` vendor extension:

```yaml
x-telegraph:
  payment: x402
  slug: bittensor-sn18-zeus
  subnet_id: "18"
  signal_mapping:
    type: weather_risk
    label_field: risk_level
    confidence_field: storm_probability
    reason_field: synthesis        # optional
```

Use this to programmatically extract the signal type + label/confidence
fields from the OpenAPI spec, so your agent knows how to interpret each
subnet's response.

## LangChain (Python) integration

```python
import requests

# 1. Make the request (no payment header)
url = "https://your-stable-domain.com/miner-dispatcher/v1/18/predict"
params = {"lat": 40.71, "lon": -74.01}
r = requests.get(url, params=params)

# 2. Receive 402 with payment instructions
if r.status_code == 402:
    accepts = r.json()["accepts"]
    scheme = accepts[0]  # { scheme: "x402", price: "10000", network: "base-sepolia", payTo: "0x..." }

    # 3. Pay USDC on-chain (use your wallet / SDK)
    pay_usdc(scheme["payTo"], int(scheme["price"]), scheme["network"])

    # 4. Retry with the payment proof
    r = requests.get(url, params=params, headers={"PAYMENT-SIGNATURE": payment_proof})

# 5. Use the result
forecast = r.json()
```

## ElizaOS (JS/TS via `x402-fetch`)

```typescript
import { x402Fetch } from "x402-fetch";

// x402-fetch handles the 402 → pay → retry flow automatically
const res = await x402Fetch(
  "https://your-stable-domain.com/miner-dispatcher/v1/64/chat/completions",
  {
    method: "POST",
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V3-0324",
      messages: [{ role: "user", content: "Explain zero-knowledge proofs" }]
    })
  },
  { walletKey: process.env.TELEGRAPH_WALLET_KEY }  // your EVM private key
);

const result = await res.json();
```

## Raw curl

```bash
# 1. First request (gets 402)
curl -i -X POST https://node/miner-dispatcher/v1/64/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V3-0324","messages":[{"role":"user","content":"hi"}]}'

# 2. Pay USDC to the payTo address shown in the 402 accepts[] response

# 3. Retry with the payment proof
curl -X POST https://node/miner-dispatcher/v1/64/chat/completions \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: <payment proof>" \
  -d '{"model":"deepseek-ai/DeepSeek-V3-0324","messages":[{"role":"user","content":"hi"}]}'
```

## Engine `/v1/ask` (LLM-routed)

If you don't know which subnet you want, use the engine's LLM router:

```bash
curl -X POST https://node/engine/v1/ask \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: <proof>" \
  -d '{"query":"What is the weather in Tokyo?"}'
```

The engine classifies the intent, picks the best miner, and returns a
unified `AskResponse`. Same x402 auth as the miner-dispatcher.

## Environment setup

| Variable | Purpose |
|---|---|
| `TELEGRAPH_WALLET_KEY` | Your EVM private key (for paying x402 USDC) |
| `TELEGRAPH_NODE` | The node URL (e.g. `https://your-stable-domain.com`) |