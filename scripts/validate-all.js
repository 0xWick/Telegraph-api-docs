#!/usr/bin/env node
/**
 * Validate every OpenAPI spec in ./openapi/ parses as valid OpenAPI 3.0,
 * with all $refs resolvable. Uses @apidevtools/swagger-parser.
 */
const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

const ROOT = path.resolve(__dirname, '..');
const OPENAPI_DIR = path.join(ROOT, 'openapi');

const specFiles = fs.readdirSync(OPENAPI_DIR)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  .map(f => path.join(OPENAPI_DIR, f));

if (specFiles.length === 0) {
  console.error('✗ No OpenAPI specs found in ./openapi/');
  process.exit(1);
}

(async () => {
  let failed = false;
  for (const spec of specFiles) {
    const rel = path.relative(ROOT, spec);
    try {
      const api = await SwaggerParser.validate(spec, {
        dereference: { circular: 'ignore' },
      });
      const pathCount = Object.keys(api.paths || {}).length;
      console.log(`✓ ${rel} — valid OpenAPI ${api.openapi || '?'} — ${pathCount} paths`);
    } catch (err) {
      console.error(`✗ ${rel} — ${err.message}`);
      failed = true;
    }
  }
  if (failed) {
    console.error('\nValidation FAILED for one or more specs.');
    process.exit(1);
  }
  console.log('\n✓ All specs validated successfully.');
})();
