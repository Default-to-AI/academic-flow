# Project Structure

## Thesis

`app/` is the product. The repo root is the operating layer around the product.

That split is intentional:

- App sessions stay visually clean and focused on the website.
- AI agent files do not leak into product directories.
- Reusable agent workflows have a stable home outside the app.

## Ownership Map

### `app/`

Use for anything the site needs to run, build, or render:

- React source code
- Vite/Tailwind/PostCSS config
- Runtime prompts consumed by the app
- Examples and app-level assets
- App package manifest and dependencies

### `.claude/`

Use for Claude local state and worktrees. This is tooling state, not product code.

### `ai-agents/`

Use for external agent bundles, multi-agent toolkits, and imported AI operating systems.

### `skills/`

Use for project-local reusable skills only when the workflow repeats across sessions.

Do not put one-off prompts or product runtime prompts here.

## Decision Rules

- If the browser app imports it or depends on it at runtime, it belongs under `app/`.
- If the file teaches agents how to work in this repo, it belongs at the root or under `docs/`.
- If the file packages agent capabilities that are reusable, it belongs under `skills/` or `ai-agents/`.
- If a directory starts accumulating mixed ownership, split it before drift becomes normal.
