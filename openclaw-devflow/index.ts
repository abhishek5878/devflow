/**
 * DevFlow OpenClaw Plugin
 * Registers DevFlow context snapshot and proxy tools for the OpenClaw agent
 */

import { generateSnapshot } from 'devflow-ai/snapshot';

export default function (api: { registerTool: (def: ToolDef, opts?: { optional?: boolean }) => void }) {
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
              text: `✓ DevFlow context saved to ${resultPath}${wasGitRepo ? '' : ' (tip: run from git root for fuller context)'}. Paste into Claude.ai to resume.`,
            },
          ],
        };
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
