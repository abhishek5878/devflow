/**
 * DevFlow AI - Terminal / Build Error Capture (Best Effort)
 * Scans for recent errors from logs and TypeScript
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Capture recent errors from common sources.
 * Optional feature - returns empty array if nothing found.
 * @param skipTypeCheck - Skip TypeScript compilation check (faster on large projects)
 */
export async function captureRecentErrors(
  projectPath: string,
  skipTypeCheck: boolean = false
): Promise<string[]> {
  const errors: string[] = [];

  // 1. Common error log locations
  const logPaths = [
    '.next/error.log',
    'npm-debug.log',
    'yarn-error.log',
    'pnpm-debug.log',
  ];
  for (const relPath of logPaths) {
    const fullPath = join(projectPath, relPath);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').filter((l) => /error|Error|failed|Failed/i.test(l));
        if (lines.length > 0) {
          errors.push(`[${relPath}]\n${lines.slice(-5).join('\n')}`);
        }
      } catch {
        // Ignore unreadable
      }
    }
  }

  // 2. TypeScript check (if tsconfig exists, unless skipped)
  const tsconfigPath = join(projectPath, 'tsconfig.json');
  if (!skipTypeCheck && existsSync(tsconfigPath)) {
    try {
      execSync('npx tsc --noEmit --pretty false 2>&1', {
        cwd: projectPath,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024,
      });
    } catch (err) {
      const output =
        (err as { stderr?: string; stdout?: string }).stderr ??
        (err as { message?: string }).message ??
        '';
      if (output.trim()) {
        errors.push(
          `[TypeScript]\n${output.trim().split('\n').slice(-10).join('\n')}`
        );
      }
    }
  }

  return errors;
}
