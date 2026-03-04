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
}

type ToolDef = {
  name: string;
  description: string;
  parameters: object;
  execute: (id: string, params: unknown) => Promise<{ content: { type: 'text'; text: string }[] }>;
};

