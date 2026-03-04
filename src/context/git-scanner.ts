/**
 * DevFlow AI - Git History Scanner
 * Zero API cost, local-only git context for session handoff
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface GitContext {
  changedFiles: string[];
  diffStat: string;
  recentCommits: string[];
  uncommittedChanges: boolean;
  uncommittedDiffStat?: string;
}

const EMPTY_CONTEXT: GitContext = {
  changedFiles: [],
  diffStat: 'Not a git repository',
  recentCommits: [],
  uncommittedChanges: false,
};

function runGit(
  projectPath: string,
  command: string,
  fallback?: string
): string {
  try {
    return execSync(command, {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 2 * 1024 * 1024, // 2MB
    })
      .trim()
      .replace(/\r\n/g, '\n');
  } catch {
    return fallback ?? '';
  }
}

function getCommitCount(projectPath: string): number {
  const output = runGit(projectPath, 'git rev-list --count HEAD 2>/dev/null');
  const n = parseInt(output, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Scan git history for session context.
 * Handles non-git dirs, fresh repos, and shallow clones gracefully.
 */
export async function scanGitHistory(
  projectPath: string,
  lookbackCommits: number = 3,
  lookbackHours: number = 2
): Promise<GitContext> {
  const gitDir = join(projectPath, '.git');
  if (!existsSync(gitDir)) {
    return EMPTY_CONTEXT;
  }

  try {
    const commitCount = getCommitCount(projectPath);
    const effectiveLookback = Math.min(lookbackCommits, Math.max(0, commitCount));
    let changedFiles: string[] = [];
    let diffStat = '';

    if (effectiveLookback > 0) {
      const revRange = `HEAD~${effectiveLookback}..HEAD`;
      const namesOutput = runGit(
        projectPath,
        `git diff --name-only ${revRange} 2>/dev/null`
      );
      changedFiles = namesOutput
        ? namesOutput.split('\n').map((f) => f.trim()).filter(Boolean)
        : [];

      diffStat = runGit(
        projectPath,
        `git diff --stat ${revRange} 2>/dev/null`
      );
    }

    // Recent commits (time-based)
    const sinceFlag = `--since="${lookbackHours} hours ago"`;
    const recentOutput = runGit(
      projectPath,
      `git log --oneline -10 ${sinceFlag} 2>/dev/null`
    );
    const recentCommits = recentOutput
      ? recentOutput.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    // Fallback: if no commits in time window, get last N by count
    if (recentCommits.length === 0 && commitCount > 0) {
      const fallbackLog = runGit(
        projectPath,
        `git log --oneline -${Math.min(10, commitCount)} 2>/dev/null`
      );
      if (fallbackLog) {
        recentCommits.push(
          ...fallbackLog.split('\n').map((s) => s.trim()).filter(Boolean)
        );
      }
    }

    // Uncommitted changes
    const statusOutput = runGit(projectPath, 'git status --short 2>/dev/null');
    const uncommittedChanges = statusOutput.length > 0;

    let uncommittedDiffStat = '';
    if (uncommittedChanges) {
      uncommittedDiffStat = runGit(
        projectPath,
        'git diff HEAD --stat 2>/dev/null'
      );
      const stagedStat = runGit(
        projectPath,
        'git diff --cached --stat 2>/dev/null'
      );
      if (stagedStat) {
        uncommittedDiffStat = uncommittedDiffStat
          ? `${uncommittedDiffStat}\n(staged)\n${stagedStat}`
          : `(staged)\n${stagedStat}`;
      }
    }

    return {
      changedFiles,
      diffStat: diffStat || (effectiveLookback === 0 ? 'No commits yet' : ''),
      recentCommits,
      uncommittedChanges,
      uncommittedDiffStat: uncommittedDiffStat || undefined,
    };
  } catch {
    return EMPTY_CONTEXT;
  }
}
