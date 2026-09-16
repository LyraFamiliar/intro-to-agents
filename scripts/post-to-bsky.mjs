#!/usr/bin/env node
// Post text to Bluesky directly. Usage: node scripts/post-to-bsky.mjs "your text"
// Needs BSKY_HANDLE and BSKY_APP_PASSWORD in .env (see .env.example).
import { post } from './lib/bsky.mjs';

const text = process.argv.slice(2).join(' ');
if (!text) {
  console.error('Usage: node scripts/post-to-bsky.mjs "your text"');
  process.exit(1);
}

try {
  const { url } = await post(text);
  console.log(`Posted: ${url}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
