/**
 * DevFlow AI - Context Markdown Generator
 * Assembles session context for AI handoff
 */

import type { GitContext } from './git-scanner.js';
import type { StackInfo } from './stack-detector.js';
import type { ProjectRules } from './rules-detector.js';

export interface ContextSnapshot {
  timestamp: string;
  projectName: string;
  stack: StackInfo;
  git: GitContext;
  rules: ProjectRules | null;
  errors: string[];
  projectStructure?: string;
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
  return 'unknown';
}

export function generateContextMarkdown(snapshot: ContextSnapshot): string {
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
    [stack.primary, stack.language].filter(Boolean).join(' + ') || 'Unknown';
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
    : 'No project rules detected';

  const errorsSection =
    errors.length > 0 ? errors.join('\n\n') : 'No recent errors detected';

  return `## DevFlow Session Handoff
Generated: ${timestamp}
Project: ${projectName}
Stack: ${stackLine}

## Files Changed This Session
${changedSection}

## Recent Git Activity
${gitActivity}

## Change Summary
${changeSummaryText}
${projectStructure ? `\n## Project Structure\n${projectStructure}\n` : ''}

## Active Project Rules
${rulesSection}

## Known Errors
${errorsSection}

## For the Next AI
You are continuing an active coding session. Review the changed files first.
The developer was working on: ${focus}.

**Do not re-explain what was already built. Ask what they need next.**
`;
}
