# Handoff Format Best Practices

DevFlow's context output follows community best practices from Claude, Cursor, Continue.dev, and handoff standards. This doc captures the research.

## Sources

- **JLE** — [AI Context Window: Guide to Handoff Documents](https://jlellis.net/blog/ai-context-window-guide-to-long-conversations-handoff-documents/)
- **claude-handoff** — HANDOFF.md structure (goal, progress, failed approaches, decisions, resume instructions)
- **Cursor** — [Agent best practices](https://cursor.com/blog/agent-best-practices), dynamic context discovery
- **Continue.dev** — [Context selection](https://docs.continue.dev/features/chat/context-selection), XML tags for structure
- **AGENTS.md** — Vendor-neutral agent instructions (concise, actionable)

## Format Structure (Universal)

A strong handoff document includes:

| Section | Purpose |
|--------|---------|
| **Immediate Next Step** | The specific task for the new session |
| **Current Status** | Where you left off (files, stack, state) |
| **Constraints & Rules** | Project rules, conventions, tech stack |
| **Known Errors / Failed Approaches** | What didn't work — avoid repetition |
| **Do Not Revisit** | Decisions that are final; don't reopen |

**Principles:**
- Precision over volume — tightly structured beats long
- One task per conversation — handoff helps reset cleanly
- Explicit "do not revisit" — models explore alternatives unless told otherwise
- Include tests/expected outputs when possible — highest leverage for verification

## Platform-Specific Tips

### Claude.ai
- Start fresh when context gauge is high or responses feel generic
- Handoff preserves continuity without dragging long threads
- Model can draft handoff — ask: "Write a context summary I can paste into a new conversation"

### Cursor
- Use `@` to reference files; agent discovers context on demand
- Clear context between tasks (`/clear` or new chat)
- Fewer details upfront — let agent pull context via search
- Handoff helps when shifting to different codebase areas

### Continue.dev
- Use @Files, cmd+L (highlighted code), opt+enter (active file)
- Clear, direct instructions — tech stack, structure, edge cases
- XML tags structure information for measurable quality gains
- Custom prompts as slash commands for repetitive workflows

## DevFlow Output

DevFlow generates a single markdown document that works across all platforms. Use `--target claude|cursor|continue` for platform-specific paste hints (shown after copy, not in the document).
