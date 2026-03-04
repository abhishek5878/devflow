/**
 * DevFlow AI - Context Markdown Generator
 * Follows community best practices: JLE handoff guide, claude-handoff, AGENTS.md patterns
 * Optimized for paste-into-any-AI smoothness
 */

import type { GitContext } from './git-scanner.js';
import type { StackInfo } from './stack-detector.js';
import type { ProjectRules } from './rules-detector.js';

export type TargetPlatform = 'claude' | 'cursor' | 'continue' | 'universal';

export interface ContextSnapshot {
  timestamp: string;
  projectName: string;
  stack: StackInfo;
  git: GitContext;
  rules: ProjectRules | null;
  errors: string[];
  projectStructure?: string;
}

export interface GenerateOptions {
  target?: TargetPlatform;
}

function inferWorkFocus(git: GitContext): string {
  if (git.recentCommits.length > 0) {
    const lastCommit = git.recentCommits[0];
    const msg = lastCommit.replace(/^[a-f0-9]+\s+/i, '').toLowerCase();
    if (msg.length > 0) return msg;
  }
  if (git.changedFiles.length > 0) {
    const dirs = new Set(
      git.changedFiles.map((f) => f.split('/')[0]).filter(Boolean)
    );
    return Array.from(dirs).slice(0, 3).join(', ');
  }
  return 'Continue the coding session';
}

/**
 * Platform-specific paste hints (shown after copy, not in the document)
 */
export const PASTE_HINTS: Record<TargetPlatform, string> = {
  claude: 'Claude.ai → New chat → Cmd+V (Mac) or Ctrl+V',
  cursor: 'Cursor → New chat → Cmd+V (Mac) or Ctrl+V',
  continue: 'Continue.dev → New chat → Cmd+V (Mac) or Ctrl+V',
  universal:
    'Paste anywhere: Claude.ai · Cursor · Continue.dev · any AI chat (Cmd/Ctrl+V)',
};

/**
 * Generate handoff document per JLE / claude-handoff best practices:
 * - Immediate next step, current status, constraints
 * - Do not revisit (explicit), key decisions
 * - Failed approaches (errors), structured for AI consumption
 */
export function generateContextMarkdown(
  snapshot: ContextSnapshot,
  options: GenerateOptions = {}
): string {
  const { target = 'universal' } = options;
  const {
    timestamp,
    projectName,
    stack,
    git,
    rules,
    errors,
    projectStructure,
  } = snapshot;
  const stackLine =
    [stack.primary, stack.language, stack.database].filter(Boolean).join(' + ') ||
    'Unknown';
  const focus = inferWorkFocus(git);

  const changedSection =
    git.changedFiles.length > 0
      ? git.changedFiles.map((f) => `- ${f}`).join('\n')
      : 'No committed changes in lookback window';

  const gitActivity =
    git.recentCommits.length > 0
      ? git.recentCommits.join('\n')
      : 'No commits in recent window — uncommitted changes only';

  const changeSummary = git.uncommittedChanges
    ? (git.uncommittedDiffStat ?? git.diffStat)
    : git.diffStat;
  const changeSummaryText =
    changeSummary && changeSummary !== 'Not a git repository'
      ? changeSummary
      : '—';

  const rulesSection = rules
    ? `\nSource: ${rules.source}\n\n${rules.content}`
    : 'None detected';

  const errorsSection =
    errors.length > 0 ? errors.join('\n\n') : 'None detected';

  return `# Session Handoff — ${projectName}

> Paste this entire document into a new AI chat to continue. (DevFlow ${timestamp})

---

## Immediate Next Step
${focus}

## Current Status
- **Stack:** ${stackLine}
- **Files changed:** ${changedSection}

## Recent Git Activity
${gitActivity}

## Change Summary
${changeSummaryText}
${projectStructure ? `\n## Project Structure\n${projectStructure}\n` : ''}

## Constraints & Project Rules
${rulesSection}

## Known Errors / Failed Approaches
${errorsSection}

## Do Not Revisit
- Do not re-explain what was already built
- Do not suggest starting over — continue from current state
- Ask what the developer needs next
`.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
