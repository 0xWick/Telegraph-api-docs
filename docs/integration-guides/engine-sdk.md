# Engine SDK Integration (Go)

The Autonomous Engine Open SDK lets you consume the miner-dispatcher as a Go
library — useful when you're building a node or a custom engine that needs
direct in-process access to subnet clients (without the HTTP/x402 layer).

> **Source:** This doc is consolidated from the original
> `documentation/ENGINE_SDK_INTEGRATION_GUIDE.md` in the Telegraph monorepo.
> Content is current; the "8 providers" prose count has been corrected to 10.

## The `Dispatcher` struct

```go
import "github.com/AnomalyFi/Telegraph/modules/miner-dispatcher"

d := dispatcher.NewDispatcher(/* ... */)
```

## Key methods

| Method | Returns | Description |
|---|---|---|
| `d.LoadedIntegrations()` | `[]SubnetCfg` | All currently-loaded integrations |
| `d.GetSubnetClient(name string)` | `SubnetClient, error` | Get a client for a subnet by slug/alias |
| `d.SetRequestLogger(logger RequestLogger)` | — | Hook for logging each request |

## `SubnetCfg` struct

```go
type SubnetCfg struct {
    ID              string
    Name            string
    Slug            string   // e.g. "bittensor-sn18-zeus"
    BaseURL         string
    Protocol        string   // "rest"
    APIKeyEnvVar    string   // env var name for the upstream API key
    SignalMapping   SignalMapping
    Endpoints       []EndpointCfg
    SupportedIntents []string
}
```

## `SubnetClient` interface

```go
type SubnetClient interface {
    Fetch(ctx context.Context, proxyPath string, req *Request) (*Response, error)
}
```

`proxyPath` is the sub-endpoint path (e.g. `/predict`, `/chat/completions`).
`req` carries the method, query, body, and headers.

## Example: call Zeus

```go
client, err := d.GetSubnetClient("zeus")  // or "bittensor-sn18-zeus" or "18"
if err != nil { /* ... */ }

resp, err := client.Fetch(ctx, "/predict", &dispatcher.Request{
    Method: "GET",
    Query:  map[string]string{"lat": "40.71", "lon": "-74.01"},
})
```

## API-key resolution

Upstream API keys are resolved from env vars (the `api_key.env_var` field in
the integration YAML). Use `ResolvedAPIKey()` to get the resolved key for a
given integration. The SDK path does NOT use x402 — the API key authenticates
directly with the upstream subnet.

## Adding a new provider

Write a YAML integration file (see [`yaml-standard.md`](yaml-standard.md))
and hot-load it via the dispatcher. No code changes needed for REST
providers — the YAML schema + dispatcher handle the wiring.

## CLI

```bash
telegraph integration validate <file.yaml>   # schema + sandbox test
telegraph integration list                    # list loaded integrations
telegraph integration schema                   # print the YAML schema
telegraph integration init <name>              # scaffold a new YAML
telegraph integration openapi                  # print the generated OpenAPI spec
```

## Common errors

| Error | Cause |
|---|---|
| `client not found: <name>` | Unknown slug/alias — check `LoadedIntegrations()` |
| `circuit breaker open` | Upstream has been failing too often — wait for reset |
| `401 Unauthorized` | Upstream rejected the API key — check the env var |
| `429 Too Many Requests` | Upstream rate limit hit — back off |
| `nil signal_mapping` | The integration YAML is missing `signal_mapping` — required |