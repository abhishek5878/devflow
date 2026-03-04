#!/usr/bin/env node
/**
 * DevFlow AI - One command. Zero friction.
 * Usage: npx abhishek5878/devflow or npx devflow-ai (when installed)
 *
 * Inspired by Claude Spend: no install, no sign-up, instant value.
 */

// Immediate feedback so user knows the CLI started (especially on slow npx first run)
process.stdout.write('DevFlow — starting...\n');

import { resolve } from 'path';
import { readFileSync } from 'fs';
import { generateSnapshot } from './snapshot.js';
import { PASTE_HINTS } from '../context/generator.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`DevFlow — Never lose your AI context when limits hit

Usage: npx github:abhishek5878/devflow

  Generates context.md and copies to clipboard. Paste into Claude.ai. Done.

Options:
  --no-copy    Don't copy to clipboard (just write file)
  --open       Open context.md after generating
  --skip-tsc   Skip TypeScript check (faster)
  --target X   Paste hint: claude | cursor | continue | universal
  --output path  Custom output path
`);
  process.exit(0);
}

const copyToClipboard = !args.includes('--no-copy') && !args.includes('snapshot');
const openFile = args.includes('--open');
const skipTsc = args.includes('--skip-tsc');
const targetIdx = args.indexOf('--target');
const targetArg =
  targetIdx >= 0 && args[targetIdx + 1]
    ? (args[targetIdx + 1] as 'claude' | 'cursor' | 'continue' | 'universal')
    : undefined;
const outIdx = args.indexOf('--output');
const outputPath =
  outIdx >= 0 && args[outIdx + 1]
    ? resolve(process.cwd(), args[outIdx + 1])
    : undefined;
const pathArg = args.filter(
  (a, i) =>
    !a.startsWith('-') &&
    !['snapshot'].includes(a) &&
    i !== outIdx + 1 &&
    i !== targetIdx + 1
)[0];

const projectPath = pathArg ? resolve(process.cwd(), pathArg) : process.cwd();

async function main() {
  // Instant feedback - user sees something immediately
  if (copyToClipboard) {
    process.stdout.write('DevFlow — scanning project...\n');
  } else {
    process.stdout.write('DevFlow — scanning...\n');
  }

  const { path: resultPath, wasGitRepo, target: usedTarget } = await generateSnapshot(projectPath, {
    skipTypeCheck: skipTsc,
    outputPath,
    quiet: copyToClipboard,
    target: targetArg,
  });

  const content = readFileSync(resultPath, 'utf-8');

  if (copyToClipboard) {
    try {
      const { default: clipboard } = await import('clipboardy');
      await clipboard.write(content);
      const hint = PASTE_HINTS[usedTarget || 'universal'];
      console.log('\n✓ Copied to clipboard.');
      console.log(`  ${hint}\n`);
      if (!wasGitRepo) {
        console.log('  Tip: Run from a git project root for fuller context.\n');
      }
    } catch {
      console.log(`\n✓ Saved to ${resultPath}`);
      console.log('  (Clipboard unavailable — open the file and copy, or use --open)\n');
      if (openFile === false) {
        const { execSync } = await import('child_process');
        const os = process.platform;
        const openCmd = os === 'darwin' ? 'open' : os === 'win32' ? 'start' : 'xdg-open';
        try {
          execSync(`${openCmd} "${resultPath}"`, { stdio: 'ignore' });
          console.log('  Opened the file for you.\n');
        } catch { /* ignore */ }
      }
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
  console.error('DevFlow error:', err.message);
  if (process.env.DEVFLOW_DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});
