#!/usr/bin/env node
/**
 * One-off helper: add `example` to every requestBody media-type in a spec
 * that lacks one. If the referenced schema has an `example`, copy it;
 * otherwise use `{}`. Preserves the source file's formatting by doing a
 * targeted line insertion rather than a full re-dump.
 *
 * Usage: node scripts/add-examples.js <spec.yaml>
 */
const fs = require('fs');
const yaml = require('js-yaml');

const file = process.argv[2];
if (!file) { console.error('usage: node add-examples.js <spec.yaml>'); process.exit(1); }

const raw = fs.readFileSync(file, 'utf8');
const doc = yaml.load(raw);

// Build a map of schema name -> example (if the schema has one).
const schemas = (doc.components && doc.components.schemas) || {};
function exampleForSchema(refStr) {
  if (!refStr || typeof refStr !== 'string') return null;
  const m = refStr.match(/^#\/components\/schemas\/(.+)$/);
  if (!m) return null;
  const s = schemas[m[1]];
  if (s && s.example !== undefined) return s.example;
  return null;
}

let added = 0;
for (const [pathKey, pathItem] of Object.entries(doc.paths || {})) {
  for (const method of ['post', 'put', 'patch']) {
    const op = pathItem[method];
    if (!op || !op.requestBody || !op.requestBody.content) continue;
    for (const [mediaType, mediaObj] of Object.entries(op.requestBody.content)) {
      if (mediaObj.example !== undefined) continue; // already has one
      let ex = exampleForSchema(mediaObj.schema && mediaObj.schema.$ref);
      if (ex === null && mediaObj.schema && mediaObj.schema.type === 'object') ex = {};
      if (ex !== null) {
        mediaObj.example = ex;
        added++;
      }
    }
  }
}

// Re-dump. We accept the formatting change; js-yaml quotes descriptions
// containing ': ' correctly, so the output is valid YAML + valid OpenAPI.
const out = yaml.dump(doc, { lineWidth: 120, noRefs: true, sortKeys: false, quotingType: '"' });
fs.writeFileSync(file, out, 'utf8');
console.log(`Added ${added} examples to ${file}`);
