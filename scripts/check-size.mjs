#!/usr/bin/env node
/**
 * Bundle size guard: fails the build when the gzip'd dist output exceeds
 * configured limits. Dependency-free alternative to size-limit.
 * Usage: node scripts/check-size.mjs
 */
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Limits in KB (gzip) per artifact */
const limits = [
  { file: 'srich-editor.esm.js', maxKB: 40 },
  { file: 'srich-editor.umd.js', maxKB: 40 },
  { file: 'styles.css', maxKB: 20 },
];

let failed = false;

for (const { file, maxKB } of limits) {
  let path;
  try {
    path = join(dist, file);
    statSync(path);
  } catch {
    console.error(`✗ ${file}: missing in dist/ (run "npm run build" first)`);
    failed = true;
    continue;
  }
  const raw = readFileSync(path);
  const gzipped = gzipSync(raw).length;
  const kb = gzipped / 1024;
  const ok = kb <= maxKB;
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${file}: ${kb.toFixed(2)} KB gzip (limit ${maxKB} KB)`);
  if (!ok) failed = true;
}

process.exit(failed ? 1 : 0);
