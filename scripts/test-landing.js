#!/usr/bin/env node
/**
 * Smoke test for landing page: validates key content exists
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(process.cwd(), 'landing/index.html'), 'utf-8');
const checks = [
  { name: 'npx devflow', pattern: /npx devflow/ },
  { name: 'Claude.ai mention', pattern: /Claude\.ai/ },
  { name: 'Copy button', pattern: /Copy|copy/ },
  { name: 'title', pattern: /<title>[\s\S]*?DevFlow[\s\S]*?<\/title>/ },
  { name: 'viewport meta', pattern: /viewport/ },
  { name: 'GitHub link', pattern: /github\.com/ },
];

let failed = 0;
for (const { name, pattern } of checks) {
  if (!pattern.test(html)) {
    console.error(`FAIL: ${name}`);
    failed++;
  }
}

if (failed) {
  process.exit(1);
}
console.log('✓ Landing page smoke test passed');
