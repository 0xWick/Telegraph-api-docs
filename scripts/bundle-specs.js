#!/usr/bin/env node
/**
 * Bundle every OpenAPI spec in ./openapi/ into a self-contained file under
 * ./swagger-ui/specs/ — all external $refs (../components/...) are inlined
 * so the published Swagger UI needs only the single spec file.
 *
 * Source specs in openapi/ remain the human-readable, DRY source of truth
 * (with $ref: ../components/schemas/Foo.yaml). This script produces the
 * publishable, dependency-free variant.
 *
 * Uses @apidevtools/swagger-parser .bundle() which inlines external file
 * references into the document's components section and rewrites the refs
 * to be internal (#/components/...), preserving DRY within the bundled doc.
 */
const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const OPENAPI_DIR = path.join(ROOT, 'openapi');
const OUT_DIR = path.join(ROOT, 'swagger-ui', 'specs');

const specFiles = fs.readdirSync(OPENAPI_DIR)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  .map(f => path.join(OPENAPI_DIR, f));

if (specFiles.length === 0) {
  console.error('✗ No OpenAPI specs found in ./openapi/');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  let failed = false;
  for (const spec of specFiles) {
    const rel = path.relative(ROOT, spec);
    const outName = path.basename(spec); // same name, .yaml
    const outPath = path.join(OUT_DIR, outName);
    try {
      const bundled = await SwaggerParser.bundle(spec, {
        dereference: { circular: 'ignore' },
      });
      const yamlStr = yaml.dump(bundled, {
        lineWidth: 120,
        noRefs: true,
        sortKeys: false,
      });
      fs.writeFileSync(outPath, yamlStr, 'utf8');
      const pathCount = Object.keys(bundled.paths || {}).length;
      const sizeKb = Math.round((yamlStr.length / 1024) * 10) / 10;
      console.log(`✓ ${rel} → swagger-ui/specs/${outName}  (${pathCount} paths, ${sizeKb} KB)`);
    } catch (err) {
      console.error(`✗ ${rel} — ${err.message}`);
      failed = true;
    }
  }
  if (failed) {
    console.error('\nBundling FAILED for one or more specs.');
    process.exit(1);
  }
  console.log('\n✓ All specs bundled into swagger-ui/specs/.');
})();
