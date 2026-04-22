# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

acedemic-flow is a prompt engineering project — no application code exists yet. The repo contains two AI system prompt definitions for a "Universal Academic Content Transformer" agent.

### Core Concept

The agent ingests raw lecture materials (OCR text, PDFs, handwritten notes) in any academic discipline and outputs a structured JSON learning guide, enriched with pedagogical layers and formatted for Hebrew RTL + LaTeX rendering.

### Files

- **`AGENTS.md`** — The agent role definition (KPI-structured, slightly higher-level framing).
- **`the_system_prompt.md`** — The operational system prompt used at inference time (more prescriptive, includes the mandatory Planning Protocol pre-step and exact output schema).
- **`superpowers/`** — A nested git repo (gstack superpowers toolkit). It is a dependency/toolset, not part of the acedemic-flow agent itself.

## Output Schema

The agent returns **only** a valid JSON object:

```json
{
  "title": "Clean Academic Title (Hebrew)",
  "subject_meta": "The identified field",
  "sections": [
    {
      "header": "Section Heading (Hebrew)",
      "content": "Refined Hebrew explanation with $LaTeX$",
      "common_mistakes": "Pitfalls (Hebrew + LaTeX)",
      "example": "Solved step-by-step example (Hebrew + LaTeX)"
    }
  ]
}
```

## Key Rules Baked Into the Prompts

- **Planning Protocol** (mandatory pre-step): Subject ID → Core Essence → Structure Map → Pitfall ID — must happen before generating JSON.
- **Sampling Distribution KPI**: Any mention of a sample mean in stats/economics must include $Z = \frac{\bar{x} - \mu}{\sigma / \sqrt{n}}$ with component explanations.
- **LaTeX**: Inline `$ $`, block `$$ $$` — no exceptions.
- **RTL Integrity**: Formal academic Hebrew; English/LaTeX must not disrupt RTL flow.
- **Section flow**: Definition → Mechanism → Proof → Application.

## Development Notes

When iterating on the prompts, `the_system_prompt.md` is the authoritative runtime prompt. `AGENTS.md` is the agent card / role spec — keep them consistent when updating either.
