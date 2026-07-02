#!/usr/bin/env bash
# Build the static Swagger UI site.
# Vendors the swagger-ui-dist files and copies the OpenAPI specs so the
# published GitHub Pages site is fully self-contained (no CDN dependency).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_NODE_MODULES="${ROOT_DIR}/node_modules/swagger-ui-dist"
DEST="${ROOT_DIR}/swagger-ui"

if [[ ! -d "${SRC_NODE_MODULES}" ]]; then
  echo "==> swagger-ui-dist not installed. Running 'npm install' first..."
  (cd "${ROOT_DIR}" && npm install --no-audit --no-fund)
fi

echo "==> Cleaning previous build artifacts in ${DEST}"
rm -f "${DEST}/swagger-ui-bundle.js" \
      "${DEST}/swagger-ui-standalone-preset.js" \
      "${DEST}/swagger-ui.css" \
      "${DEST}/index.css" \
      "${DEST}/oauth2-redirect.html" \
      "${DEST}"/favicon-*.png 2>/dev/null || true
rm -rf "${DEST}/specs"

echo "==> Copying swagger-ui-dist assets"
cp "${SRC_NODE_MODULES}/swagger-ui-bundle.js" "${DEST}/"
cp "${SRC_NODE_MODULES}/swagger-ui-standalone-preset.js" "${DEST}/"
cp "${SRC_NODE_MODULES}/swagger-ui.css" "${DEST}/"
cp "${SRC_NODE_MODULES}/index.css" "${DEST}/"
cp "${SRC_NODE_MODULES}/oauth2-redirect.html" "${DEST}/"
# Copy any favicons that ship with the dist
for f in "${SRC_NODE_MODULES}"/favicon-*.png; do
  [[ -f "$f" ]] && cp "$f" "${DEST}/"
done

echo "==> Copying OpenAPI specs into swagger-ui/specs/ (bundled, self-contained)"
mkdir -p "${DEST}/specs"
# Bundle: inline all external $refs so the published specs are self-contained.
node "${ROOT_DIR}/scripts/bundle-specs.js"

echo "==> Build complete. Open ${DEST}/index.html or run 'make serve'."
