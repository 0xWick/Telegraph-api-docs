# On-Chain Inference Spec

Detailed spec of on-chain subnet inference via the Diamond (Port) contracts.

> **Source:** This doc is consolidated from the original
> `documentation/ONCHAIN_INFERENCE_SPEC.md` in the Telegraph monorepo.
> Content is current and accurate.

## OnChainData struct

On-chain request and response payloads use a fixed-shape struct of four
typed arrays. Each array has a **max length of 5** for outbound requests.

```solidity
struct OnChainData {
    address[] addresses;  // max 5 outbound
    uint256[] integers;   // max 5 outbound
    string[]  strings;    // max 5 outbound
    bool[]    bools;      // max 5 outbound
}
```

Per-endpoint request (input) and response (output) index mappings are
documented per-subnet below.

## Per-subnet endpoint mappings

### SN1 (Apex / Corcel) — `/subnet/1/chat`

| Direction | addresses | integers | strings | bools |
|---|---|---|---|---|
| Request | — | — | [0] = messages (JSON-serialized) | — |
| Response | — | — | [0] = response text | — |

### SN18 (Zeus) — `/subnet/18/predict`

| Direction | addresses | integers | strings | bools |
|---|---|---|---|---|
| Request | — | [0] = lat × 10^6, [1] = lon × 10^6 | — | — |
| Response | — | [0] = risk_level (enum) | [0] = forecast JSON | — |

### SN19 (Nineteen) — `/subnet/19/{chat/completions,completions,...}`

| Direction | addresses | integers | strings | bools |
|---|---|---|---|---|
| Request | — | [0] = max_tokens | [0] = messages, [1] = model | [0] = stream |
| Response | — | — | [0] = response | — |

### SN32 (ItsAI) — `/subnet/32/detect`

| Direction | addresses | integers | strings | bools |
|---|---|---|---|---|
| Request | — | — | [0] = text | — |
| Response | — | [0] = label (enum), [1] = score × 10^6 | — | — |

### SN34 (BitMind) — `/subnet/34/{detect-image,detect-video,...}`

| Direction | addresses | integers | strings | bools |
|---|---|---|---|---|
| Request | — | — | [0] = image (base64 or URL) | — |
| Response | — | [0] = confidence × 10^6 | [0] = label | [0] = is_deepfake |

### SN64 (Chutes) — `/subnet/64/{chat/completions,completions}`

| Direction | addresses | integers | strings | bools |
|---|---|---|---|---|
| Request | — | [0] = max_tokens | [0] = messages, [1] = model | [0] = stream |
| Response | — | — | [0] = response | — |

## Solidity request + callback examples

### BitMind detect-image

```solidity
// Request
OnChainData memory req;
req.strings = new string[](1);
req.strings[0] = "https://example.com/photo.jpg";  // image URL

portContract.outboundSubnetMessage(
    34,                       // subnetId
    "/subnet/34/detect-image",
    req,
    address(this)             // callback
);

// Callback
function subnetMessage(uint256 id, bool success, OnChainData calldata response, string calldata errMsg) external {
    require(success, errMsg);
    bool isDeepfake = response.bools[0];
    uint256 confidence = response.integers[0] / 1e6;
    string memory label = response.strings[0];
    // ... handle
}
```

### Zeus predict

```solidity
OnChainData memory req;
req.integers = new uint256[](2);
req.integers[0] = 40710000;   // lat × 10^6 (40.71)
req.integers[1] = -74010000;  // lon × 10^6 (-74.01) [encoded as signed]

portContract.outboundSubnetMessage(18, "/subnet/18/predict", req, address(this));
```

## See also

- [dapp-integration.md](dapp-integration.md) — the `outboundSubnetMessage` + callback flow
- [miner-registry.md](miner-registry.md) — how miners register their endpoints