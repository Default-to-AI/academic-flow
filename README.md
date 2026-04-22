# acedemic-flow

AI-powered academic content transformer — converts raw lecture materials (PDFs, OCR, handwritten notes) into structured Hebrew study guides with LaTeX math rendering and RTL support.

## What It Does

Paste or upload lecture content in any academic discipline. acedemic-flow sends it through a structured AI pipeline and returns a clean, pedagogically enriched study guide — in Hebrew, with proper LaTeX typesetting for mathematical notation.

**Output per section:**

- Refined Hebrew explanation
- Common mistakes and pitfalls
- Step-by-step solved example

**Built-in KPIs** (e.g. sampling distribution formula always surfaces when relevant):

$$Z = \frac{\bar{x} - \mu}{\sigma / \sqrt{n}}$$

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Google Gemini API
- **Math rendering**: KaTeX / LaTeX inline and block syntax
- **Language**: Hebrew (RTL) with English/LaTeX mixed safely

## Project Structure

```text
acedemic-flow/
├── src/
│   ├── components/       # UI components (FileUpload, MathText, Settings, AcademicDocument)
│   ├── lib/gemini.js     # Gemini API integration
│   ├── App.jsx
│   └── main.jsx
├── examples/             # Sample PDFs for testing
├── AGENTS.md             # Agent role definition (KPI-structured)
├── the_system_prompt.md  # Runtime system prompt used at inference
└── CLAUDE.md             # Claude Code project instructions
```

## Getting Started

```bash
npm install
npm run dev
```

Set your Gemini API key in the settings panel before use.

## System Prompt Architecture

The AI pipeline is defined in two files:

- **`the_system_prompt.md`** — the authoritative runtime prompt. Includes the mandatory Planning Protocol pre-step and exact JSON output schema.
- **`AGENTS.md`** — the agent card / role spec. Keep consistent with the system prompt when updating either.

### Planning Protocol (mandatory pre-step)

Before generating output, the agent runs:

1. Subject identification
2. Core essence extraction
3. Structure mapping
4. Pitfall identification

### Output Schema

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
