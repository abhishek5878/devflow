/**
 * DevFlow AI - Project Rules Auto-Detection
 * Finds known project instruction files for context handoff
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface ProjectRules {
  source: string;
  content: string;
}

const RULE_PATHS = [
  '.cursor/rules',
  '.cursorrules',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  '.ai/instructions.md',
  'AI_CONTEXT.md',
  'CONTEXT.md',
];

function readFileContent(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * Detect project rules from common instruction file locations.
 * .cursor/rules can be a directory (Cursor convention) or file.
 */
export async function detectProjectRules(
  projectPath: string
): Promise<ProjectRules | null> {
  for (const relPath of RULE_PATHS) {
    const fullPath = join(projectPath, relPath);
    if (!existsSync(fullPath)) continue;

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        // .cursor/rules as directory: concatenate .mdc and .md files
        // Skip context.md (our output, may exist in cwd)
        const files = readdirSync(fullPath, { withFileTypes: true })
          .filter((e) => e.isFile() && /\.(mdc|md)$/i.test(e.name) && e.name.toLowerCase() !== 'context.md')
          .map((e) => join(fullPath, e.name))
          .sort();
        const parts: string[] = [];
        for (const f of files) {
          const c = readFileContent(f);
          if (c) parts.push(c);
        }
        if (parts.length > 0) {
          return { source: relPath, content: parts.join('\n\n---\n\n') };
        }
      } else {
        if (relPath.toLowerCase().endsWith('context.md')) continue; // skip our output
        const content = readFileContent(fullPath);
        if (content) return { source: relPath, content };
      }
    } catch {
      // Fallback: try as file
      const content = readFileContent(fullPath);
      if (content) return { source: relPath, content };
    }
  }
  return null;
}
