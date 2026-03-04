/**
 * DevFlow OpenClaw Plugin
 * Exposes DevFlow context snapshot and test guard tools to the OpenClaw agent.
 */

import { generateSnapshot } from 'devflow-ai/snapshot';

export default function (api: { registerTool: (def: ToolDef, opts?: { optional?: boolean }) => void }) {
  // Context snapshot on demand
  api.registerTool(
    {
      name: 'devflow_context_snapshot',
      description:
        'Generate project context (git history, stack, rules, errors) for AI handoff. Use when the user asks to "save context", "hand off to another AI", or "create context for Claude". Writes context.md and returns a summary.',
      parameters: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Project directory path (defaults to current workspace)',
          },
          skipTypeCheck: {
            type: 'boolean',
            description: 'Skip TypeScript check (faster on large projects)',
            default: false,
          },
        },
      },
      async execute(_id: string, params: { projectPath?: string; skipTypeCheck?: boolean }) {
        const projectPath = params?.projectPath || process.cwd();
        const skipTypeCheck = params?.skipTypeCheck ?? false;

        const { path: resultPath, wasGitRepo } = await generateSnapshot(projectPath, {
          skipTypeCheck,
          quiet: true,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `
✓ DevFlow context saved to ${resultPath}${wasGitRepo ? '' : ' (tip: run from git root for fuller context)'}. Paste into Claude.ai to resume.`,
            },
          ],
        };
      },
    },
    { optional: true }
  );

  // Background test guard / workflow helper
  api.registerTool(
    {
      name: 'devflow_e2e_guard',
      description:
        'Run project tests (e.g. npm test) and report a short summary. Use for background health checks before fixes.',
      parameters: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Project directory path (defaults to current workspace)',
          },
          command: {
            type: 'string',
            description: 'Test command to run',
            default: 'npm test',
          },
        },
        required: ['command'],
      },
      async execute(_id: string, params: { projectPath?: string; command?: string }) {
        const { exec } = await import('node:child_process');
        const { promisify } = await import('node:util');
        const run = promisify(exec);
        const cwd = params.projectPath || process.cwd();
        const cmd = params.command || 'npm test';
        try {
          const { stdout, stderr } = await run(cmd, { cwd, maxBuffer: 512 * 1024 });
          const out = (stdout + '\n' + stderr).trim();
          const snippet = out.length > 1200 ? out.slice(-1200) : out;
          return {
            content: [
              {
                type: 'text' as const,
                text: `devflow_e2e_guard: command completed. Tail of output:\n\n${snippet}`,
              },
            ],
          };
        } catch (err: any) {
          const msg = (err?.stdout || err?.stderr || String(err)).trim();
          const snippet = msg.length > 1200 ? msg.slice(-1200) : msg;
          return {
            content: [
              {
                type: 'text' as const,
                text: `devflow_e2e_guard: command failed. Tail of output:\n\n${snippet}`,
              },
            ],
          };
        }
      },
    },
    { optional: true }
  );

  // PR review helper: summarize diff for the agent
  api.registerTool(
    {
      name: 'devflow_pr_reviewer',
      description:
        'Summarize a git diff (e.g. origin/main...HEAD) for review. Use before suggesting PR feedback or fixes.',
      parameters: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Git repository path (defaults to current workspace)',
          },
          range: {
            type: 'string',
            description: 'Git diff range, e.g. origin/main...HEAD',
            default: 'origin/main...HEAD',
          },
        },
        required: ['range'],
      },
      async execute(_id: string, params: { projectPath?: string; range?: string }) {
        const { exec } = await import('node:child_process');
        const { promisify } = await import('node:util');
        const run = promisify(exec);
        const cwd = params.projectPath || process.cwd();
        const range = params.range || 'origin/main...HEAD';
        try {
          const { stdout } = await run(`git diff --stat ${range}`, {
            cwd,
            maxBuffer: 256 * 1024,
          });
          const { stdout: fullDiff } = await run(`git diff --unified=3 ${range}`, {
            cwd,
            maxBuffer: 512 * 1024,
          });
          const diffSnippet =
            fullDiff.length > 2000 ? fullDiff.slice(-2000) : fullDiff || '(no diff output)';
          const summary =
            stdout.trim() || 'No git diff stat output (check that the range exists and repo is clean).';
          const text = [
            'devflow_pr_reviewer summary:',
            '',
            '--- Git diff --stat ---',
            summary,
            '',
            '--- Git diff tail (for the agent to inspect) ---',
            diffSnippet,
          ].join('\n');
          return {
            content: [
              {
                type: 'text' as const,
                text,
              },
            ],
          };
        } catch (err: any) {
          const msg = (err?.stdout || err?.stderr || String(err)).trim();
          return {
            content: [
              {
                type: 'text' as const,
                text: `devflow_pr_reviewer: failed to run git diff for range "${range}". Error:\n\n${msg}`,
              },
            ],
          };
        }
      },
    },
    { optional: true }
  );
}

type ToolDef = {
  name: string;
  description: string;
  parameters: object;
  execute: (id: string, params: unknown) => Promise<{ content: { type: 'text'; text: string }[] }>;
};

