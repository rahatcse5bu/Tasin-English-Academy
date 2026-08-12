#!/usr/bin/env node
/**
 * Regenerates src/decks/decks.data.ts from whatever chapter JSON is present in
 * src/data/hsc_decks/. Run after adding or removing a chapter:
 *
 *   npm run decks:index
 *
 * The decks are `import`ed (not read from disk) so they are type-checked, copied
 * to dist by the nest-cli `assets` rule, and inlined into the production bundle.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src', 'data', 'hsc_decks');
const OUT = path.join(__dirname, '..', 'src', 'decks', 'decks.data.ts');

const ids = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('._') && f !== 'manifest.json')
  .map((f) => f.slice(0, -5))
  .sort();

if (!ids.length) {
  console.error('No chapter JSON found in ' + DIR);
  process.exit(1);
}

const v = (id) => 'd_' + id.replace(/-/g, '_');
const head = fs.readFileSync(OUT, 'utf8').split('import manifestJson')[0];

const body =
  head +
  'import manifestJson from "../data/hsc_decks/manifest.json";\n' +
  ids.map((id) => `import ${v(id)} from "../data/hsc_decks/${id}.json";`).join('\n') +
  fs.readFileSync(OUT, 'utf8').split('\n\n/** One reveal-able answer')[1].split('export const DECKS')[0].replace(/^/, '\n\n/** One reveal-able answer') +
  'export const DECKS: Record<string, Deck> = {\n' +
  ids.map((id) => `  "${id}": ${v(id)} as unknown as Deck,`).join('\n') +
  '\n};\n';

fs.writeFileSync(OUT, body);
console.log(`decks.data.ts regenerated with ${ids.length} chapters.`);
