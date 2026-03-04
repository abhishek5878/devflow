/**
 * DevFlow AI - Project Structure Scanner
 * Shallow directory tree for context handoff
 */

import { readdirSync } from 'fs';
import { join } from 'path';

const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.venv',
  'venv',
]);

export function getProjectStructure(
  projectPath: string,
  maxDepth: number = 2
): string {
  const lines: string[] = [];

  function walk(dir: string, prefix: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
        .filter((e) => !e.name.startsWith('.') || e.name === '.cursor')
        .filter((e) => !IGNORE.has(e.name))
        .sort((a, b) => {
          const ad = a.isDirectory() ? 0 : 1;
          const bd = b.isDirectory() ? 0 : 1;
          return ad - bd || a.name.localeCompare(b.name);
        });
      for (const e of entries) {
        const rel = prefix ? `${prefix}/${e.name}` : `./${e.name}`;
        if (e.isDirectory()) {
          lines.push(`${rel}/`);
          if (depth < maxDepth) walk(join(dir, e.name), rel, depth + 1);
        }
      }
    } catch {
      // ignore
    }
  }

  walk(projectPath, '', 0);
  return lines.join('\n');
}
