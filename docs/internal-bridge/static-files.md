# Static Files

- **Paths:** 2 (`GET /collectors/{filename}`, `GET /wasm/{filename}`)
- **Auth:** none
- **Mounted conditionally** (only if `COLLECTORS_YAML_DIR` / `WASM_MODULES_DIR`
  env vars are set)

See [overview](networks.md#static-files) for full details.