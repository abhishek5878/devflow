# Nightly DevFlow Health & Fix Cycle (Example)

This example shows how to wire DevFlow + OpenClaw into a **"wake up to magic"** loop:

- Refresh DevFlow context
- Run tests
- Summarize pending changes for review

You can do this in **one call** via the `devflow_nightly_health_cycle` tool, or by chaining the lower-level tools yourself.

## Prerequisites

- DevFlow installed and working (`npm run dev` for the proxy, `npx github:abhishek5878/devflow` for snapshots).
- OpenClaw running locally with:
  - The DevFlow plugin installed (`openclaw-devflow`).
  - An agent that allows the DevFlow tools:

```json5
{
  agents: {
    list: [
      {
        id: "devflow-main",
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

## Option A: One-shot health cycle tool

If you prefer a single tool invocation from your scheduler, use `devflow_nightly_health_cycle`:

```jsonc
{
  "name": "Nightly DevFlow Health & Fix Cycle",
  "schedule": "0 3 * * *", // Run at 3 AM local time (example)
  "steps": [
    {
      "tool": "devflow_nightly_health_cycle",
      "params": {
        "projectPath": "/path/to/your/repo",
        "testCommand": "npm test",
        "range": "origin/main...HEAD"
      }
    }
  ]
}
```

The tool returns structured JSON with snapshot, tests, and diff information that you can feed into notification or follow-up actions.

## Option B: Chain tools manually

If you want more control (e.g. conditional auto-fixes), you can still chain individual tools:

```jsonc
{
  "name": "Nightly DevFlow Health & Fix Cycle",
  "schedule": "0 3 * * *",
  "steps": [
    { "tool": "devflow_context_snapshot", "params": { "projectPath": "/path/to/your/repo", "skipTypeCheck": true } },
    { "tool": "devflow_e2e_guard", "params": { "projectPath": "/path/to/your/repo", "command": "npm test" } },
    {
      "if": "tests_failed",
      "then": [
        {
          "action": "agent_prompt",
          "prompt": "Tests failed. Use the latest DevFlow context (context.md) and git diff to understand the failures, propose fixes, and apply them in small, reviewable commits. Narrate what you changed."
        }
      ]
    },
    {
      "tool": "devflow_pr_reviewer",
      "params": {
        "projectPath": "/path/to/your/repo",
        "range": "origin/main...HEAD",
        "fullDiff": false
      }
    }
  ]
}
```

### How to use this

Depending on your environment, you might:

- **Cron + CLI:** Call your preferred OpenClaw CLI entrypoint on a schedule, passing a prompt like:

  > "Run the Nightly DevFlow Health & Fix Cycle on `/path/to/your/repo`: refresh DevFlow context, run tests, if tests fail attempt fixes and commit them, then summarize pending changes with `devflow_pr_reviewer`."

- **GitHub Actions / CI:** Trigger a job on a schedule that:
  - Checks out your repo.
  - Starts DevFlow proxy (if needed).
  - Calls into OpenClaw (HTTP or CLI) with the same instruction as above.

- **OpenClaw workflow skill:** If you use the `workflow` skill, you can map the `steps` above into a `flow.md` + `config.yaml` in your `workflows/` directory, with nodes that:
  - Invoke the DevFlow tools.
  - Inspect their JSON/text output.
  - Call a notification node (Slack/Telegram/Email) with a summary.

## Example agent instruction

You can paste this as a **system prompt** or a reusable instruction for your DevFlow-enabled agent:

> You are my nightly DevFlow maintainer. Every time you are triggered, you must:
>
> 1. Run `devflow_context_snapshot` for the project root to refresh `context.md` (use `skipTypeCheck: true` for speed).
> 2. Run `devflow_e2e_guard` with the project test command (default `npm test`).
> 3. If tests fail, use `context.md` and `git diff` to understand the failures, propose fixes, and apply them as small, reviewable commits. Keep a short, human-friendly summary.
> 4. Run `devflow_pr_reviewer` with range `origin/main...HEAD` (no `fullDiff` by default) and use its structured JSON output to summarize what changed, which files were touched, and any risky areas.
> 5. Emit a final summary for me that includes: test status, what you changed (if anything), and any follow-up work you recommend for the next day.

Wire this agent into your scheduler of choice and you’ll start **waking up to context, test status, and PR-ready summaries** generated while you sleep.

