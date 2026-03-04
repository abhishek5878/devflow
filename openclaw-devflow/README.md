# DevFlow OpenClaw Plugin

Use DevFlow's context snapshot, test guard, and PR reviewer tools from within OpenClaw. The agent can generate project context (git history, stack, rules, errors), run tests, and summarize diffs before proposing fixes.

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

## Enable the tools

Add the DevFlow tools to your agent's tool allowlist:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "devflow_context_snapshot",
            "devflow_e2e_guard",
            "devflow_pr_reviewer",
            "..."
          ]
        }
      }
    ]
  }
}
```

## Tools

### `devflow_context_snapshot`

Generate `context.md` for the project. The agent can invoke it when you say:

- "Save my project context for handoff"
- "Create context I can paste into Claude"
- "Generate context.md for the next AI"

The tool runs DevFlow's snapshot engine (git history, stack detection, rules, errors) and reports where `context.md` was written.

### `devflow_e2e_guard`

Run project tests in the background and report a short tail of the output.

- **Parameters:**
  - `projectPath?: string` — project root (defaults to current workspace)
  - `command?: string` — test command (default: `npm test`)
- **Behavior:** runs the command with a generous buffer, then returns the last ~1200 characters of stdout/stderr so the agent can quickly see failures.

Use this before proposing fixes or refactors: "Run the e2e guard before changing anything."

### `devflow_pr_reviewer`

Summarize a git diff for PR-style review, and make sure a fresh DevFlow context exists.

- **Parameters:**
  - `projectPath?: string` — git repo path (defaults to current workspace)
  - `range?: string` — git diff range (default: `origin/main...HEAD`)
  - `fullDiff?: boolean` — if `true`, return a larger unified diff payload; if `false`, return only a tail snippet (safer for long diffs)

- **Behavior:**
  - Ensures `context.md` exists in `projectPath`. If missing, it runs DevFlow's snapshot generator (`skipTypeCheck: true`) and notes whether it refreshed the snapshot.
  - Runs `git diff --stat` and `git diff --unified=3` for the given range.
  - Returns **structured JSON** (as a string) with:
    - `tool`: `"devflow_pr_reviewer"`
    - `range`
    - `snapshotRefreshed`: boolean
    - `snapshotPath`: path to `context.md`
    - `summary`: the `--stat` output
    - `files_changed`: array of `{ file, stats }`
    - `diff`: larger diff text if `fullDiff: true` (trimmed to a safe size)
    - `diff_tail`: tail-only snippet if `fullDiff` is `false`

On error (e.g. not a git repo), the tool still returns JSON with `error: true`, a short `message`, and the raw `detail` from git.

### Example agent prompt

From an OpenClaw chat, you can say:

> Run `devflow_pr_reviewer` with range `origin/main...HEAD` (no fullDiff), then review the changes for bugs, style, and consistency using the latest DevFlow context snapshot.

The agent will:

1. Ensure `context.md` exists (creating it if needed).
2. Summarize the diff as structured JSON.
3. Use that payload to drive a focused code review conversation.

**Note:** OpenClaw requires Node 22+. DevFlow works on Node 18+.
