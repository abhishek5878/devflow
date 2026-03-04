#!/usr/bin/env node
/**
 * DevFlow AI - One command. Zero friction.
 * Usage: npx devflow
 *
 * Inspired by Claude Spend: no install, no sign-up, instant value.
 */

import { resolve } from 'path';
import { readFileSync } from 'fs';
import { generateSnapshot } from './snapshot.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`DevFlow — Never lose your AI context when limits hit

Usage: npx devflow

  Generates context.md and copies to clipboard. Paste into Claude.ai. Done.

Options:
  --no-copy    Don't copy to clipboard (just write file)
  --open       Open context.md after generating
  --skip-tsc   Skip TypeScript check (faster)
  --output path  Custom output path
`);
  process.exit(0);
}

const copyToClipboard = !args.includes('--no-copy') && !args.includes('snapshot');
const openFile = args.includes('--open');
const skipTsc = args.includes('--skip-tsc');
const outIdx = args.indexOf('--output');
const outputPath =
  outIdx >= 0 && args[outIdx + 1]
    ? resolve(process.cwd(), args[outIdx + 1])
    : undefined;
const pathArg = args.filter(
  (a, i) =>
    !a.startsWith('-') &&
    !['snapshot'].includes(a) &&
    i !== outIdx + 1
)[0];

const projectPath = pathArg ? resolve(process.cwd(), pathArg) : process.cwd();

async function main() {
  // Minimal output - Claude Spend style
  const resultPath = await generateSnapshot(projectPath, {
    skipTypeCheck: skipTsc,
    outputPath,
    quiet: copyToClipboard,
  });

  const content = readFileSync(resultPath, 'utf-8');

  if (copyToClipboard) {
    try {
      const { default: clipboard } = await import('clipboardy');
      await clipboard.write(content);
      console.log('\n✓ Copied to clipboard. Paste into Claude.ai to resume.\n');
    } catch {
      console.log(`\n✓ Done. Open ${resultPath} and copy the content.\n`);
    }
  } else {
    console.log(`\n✓ Saved to ${resultPath}\n`);
  }

  if (openFile) {
    const { execSync } = await import('child_process');
    const os = process.platform;
    const openCmd =
      os === 'darwin' ? 'open' : os === 'win32' ? 'start' : 'xdg-open';
    try {
      execSync(`${openCmd} "${resultPath}"`, { stdio: 'ignore' });
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
