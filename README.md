# Academic Flow

This repository is intentionally split into two layers:

- `app/` holds the actual web product and its runtime assets.
- The repo root holds AI operating files, agent tooling, and structure docs.

## Work In The Right Place

If you are building or debugging the site, work inside `app/`.

```bash
cd app
npm install
npm run dev
```

If you are editing agent workflows or repo instructions, work at the root.

## Top-Level Layout

```text
academic-flow/
├── app/              # Product code, prompt, config, examples, dependencies
├── .claude/          # Claude local state/worktrees
├── ai-agents/        # External agent/tooling bundles
├── docs/             # Repo structure and decisions
├── skills/           # Project-local reusable skills
├── AGENTS.md         # Project rules for coding agents
├── CLAUDE.md         # Claude-facing shorthand
└── LICENSE
```
