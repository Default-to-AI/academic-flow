# PDF Pipeline Orchestrator

Repo-level operating bundle for improving the Academic Flow PDF pipeline without leaking agent files into `app/`.

## Mission

Turn teacher PDFs and class notes into high-fidelity study guides with:

- stable structure extraction
- minimal content loss
- safe LaTeX rendering
- readable RTL presentation
- explicit verification before output ships

## Scope

This bundle is for orchestration and quality control across sessions.

- Runtime code changes still belong in `app/`
- Prompt contracts consumed by the site still belong in `app/prompts/`
- Reusable repo-level coordination lives here in `ai-agents/`

## Primary Workflow

1. Audit the current pipeline from extraction to render.
2. Identify the highest-leverage failure mode.
3. Prefer surgical fixes in `app/src/lib/` before adding new abstractions.
4. Add or update regression tests before claiming the pipeline is fixed.
5. Verify both parsing integrity and final rendering quality.

## North Star

Do not summarize the source away. Preserve headings, exercises, and mathematical meaning while making the output cleaner, more structured, and easier to read.
