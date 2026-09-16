#!/usr/bin/env node
// The content manager agent.
//
//   node scripts/run-agent.mjs                 draft and check, write to content/
//   node scripts/run-agent.mjs --post          ... and publish to Bluesky
//   node scripts/run-agent.mjs --specimen VD-0418-A
//
// Drafting is the default and posting is opt-in, so a run can never publish by
// accident.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { ROOT, required } from './lib/env.mjs';
import { loadBrand } from './lib/brand.mjs';
import { generateDraft } from './lib/generate.mjs';
import { check } from './lib/voice-check.mjs';
import { post } from './lib/bsky.mjs';

const MAX_ATTEMPTS = 2;

const args = process.argv.slice(2);
const shouldPost = args.includes('--post');
const wanted = args[args.indexOf('--specimen') + 1];

required('ANTHROPIC_API_KEY', 'Copy .env.example to .env and fill it in.');
if (shouldPost) required('BSKY_APP_PASSWORD', 'Posting needs Bluesky credentials in .env.');

const client = new Anthropic();
const brand = loadBrand();

// Default to the Specimen whose season closed most recently — that is the one
// the Registry has something to say about.
const specimen = wanted
  ? brand.registry.specimens.find((s) => s.id === wanted)
  : brand.registry.specimens
      .filter((s) => s.season_closed)
      .sort((a, b) => b.season_closed.localeCompare(a.season_closed))[0];

if (!specimen) {
  console.error(wanted ? `No Specimen ${wanted} in registry.json.` : 'No Specimen to write about.');
  process.exit(1);
}

console.log(`Specimen ${specimen.id} — Class ${specimen.class}, ${specimen.status}\n`);

let draft;
let rejection = null;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  draft = await generateDraft(client, brand, specimen, rejection);
  console.log(`Draft ${attempt}:\n  ${draft.text}\n  (${[...draft.text].length} chars, ${draft.tone})\n`);

  const violations = await check(client, draft);
  if (!violations.length) {
    rejection = null;
    console.log('Voice check: passed\n');
    break;
  }

  rejection = violations.map((v) => `- ${v}`).join('\n');
  console.log(`Voice check: failed\n${rejection}\n`);

  if (attempt === MAX_ATTEMPTS) {
    console.error('Two drafts rejected. Stopping for a human to look at it.');
    process.exit(1);
  }
}

const stamp = new Date().toISOString().slice(0, 10);
const file = path.join(ROOT, 'content', `${stamp}-${specimen.id}.json`);
writeFileSync(file, JSON.stringify({ ...draft, specimen: specimen.id, drafted: stamp }, null, 2) + '\n');
console.log(`Saved ${path.relative(ROOT, file)}`);

if (!shouldPost) {
  console.log('Not posted. Re-run with --post to publish.');
  process.exit(0);
}

const { url } = await post(draft.text);
console.log(`Posted: ${url}`);
