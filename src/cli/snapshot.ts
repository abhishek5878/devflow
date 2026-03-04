#!/usr/bin/env node
/**
 * DevFlow AI - Context Snapshot CLI
 * npx devflow snapshot
 */

import { writeFile } from 'fs/promises';
import { basename } from 'path';
import { scanGitHistory } from '../context/git-scanner.js';
import { detectStack } from '../context/stack-detector.js';
import { detectProjectRules } from '../context/rules-detector.js';
import { captureRecentErrors } from '../context/error-detector.js';
import { getProjectStructure } from '../context/structure-scanner.js';
import { generateContextMarkdown } from '../context/generator.js';

export interface SnapshotOptions {
  skipTypeCheck?: boolean;
  outputPath?: string;
  /** Minimal output (for npx devflow default flow) */
  quiet?: boolean;
}

export async function generateSnapshot(
  projectPath: string = process.cwd(),
  options: SnapshotOptions = {}
): Promise<string> {
  const { skipTypeCheck = false, outputPath: customOutput, quiet } = options;
  const startTime = Date.now();

  if (!quiet) console.log('🔍 Scanning project context...\n');

  const [git, stack, rules, errors] = await Promise.all([
    scanGitHistory(projectPath),
    detectStack(projectPath),
    detectProjectRules(projectPath),
    captureRecentErrors(projectPath, skipTypeCheck),
  ]);

  const projectStructure = getProjectStructure(projectPath);

  const snapshot = {
    timestamp: new Date().toISOString(),
    projectName: basename(projectPath),
    stack,
    git,
    rules,
    errors,
    projectStructure: projectStructure || undefined,
  };

  const markdown = generateContextMarkdown(snapshot);
  const outputPath = customOutput ?? `${projectPath}/context.md`;

  await writeFile(outputPath, markdown);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!quiet) {
    console.log(`✓ Scanned git history (${git.changedFiles.length} changed files)`);
    const stackParts = [stack.primary, stack.language, stack.database].filter(
      Boolean
    );
    console.log(
      `✓ Detected stack: ${stackParts.join(' + ') || 'Unknown'}`
    );
    console.log(
      rules
        ? `✓ Found project rules: ${rules.source}`
        : '○ No project rules detected'
    );
    console.log(`✓ Generated context.md (${elapsed}s)\n`);
    console.log(`📄 ${outputPath}\n`);
  }

  return outputPath;
}
