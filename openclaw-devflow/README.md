# DevFlow OpenClaw Plugin

Use DevFlow's context snapshot from within OpenClaw. The agent can generate project context (git history, stack, rules, errors) for AI handoff when you ask it to "save context" or "create context for handoff".

## Install

From the DevFlow repo root:

```bash
cd openclaw-devflow
npm install
openclaw plugins install -l .
openclaw gateway restart
```

Or from a published package:

```bash
openclaw plugins install github:abhishek5878/devflow#openclaw-devflow
openclaw gateway restart
```

## Enable the tool

Add `devflow_context_snapshot` to your agent's tool allowlist:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: ["devflow_context_snapshot", "..."]
        }
      }
    ]
  }
}
```

## Tool: devflow_context_snapshot

Generates `context.md` for the project. The agent can invoke it when you say:

- "Save my project context for handoff"
- "Create context I can paste into Claude"
- "Generate context.md for the next AI"

**Note:** OpenClaw requires Node 22+. DevFlow works on Node 18+.
