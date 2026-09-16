// Minimal .env loader — avoids a dependency for four variables.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

try {
  for (const line of readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}

export function required(name, hint) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. ${hint}`);
    process.exit(1);
  }
  return value;
}

export { ROOT };
