# Academic Flow App

The product code lives here. This folder contains everything required to run and iterate on the web app without dragging AI agent scaffolding into the same working view.

## What It Does

Academic Flow converts lecture material into structured Hebrew study guides with RTL layout and LaTeX rendering.

Each generated section includes:

- Refined Hebrew explanation
- Common mistakes and pitfalls
- Step-by-step solved example

## Run The App

```bash
cd app
npm install
npm run dev
```

Set your Gemini API key in the settings panel before processing files.

## App Structure

```text
app/
├── src/
│   ├── components/                # React UI and rendering components
│   ├── lib/gemini.js              # Gemini integration and response parsing
│   ├── App.jsx
│   └── main.jsx
├── prompts/
│   └── academic-flow.system.md    # Runtime system prompt used by the app
├── examples/                      # Local screenshots and sample inputs
├── index.html
├── package.json
└── vite.config.js
```

## Runtime Prompt Contract

The app imports `prompts/academic-flow.system.md` directly at runtime. If you change the output schema there, keep the frontend renderer compatible with the same JSON shape.

Expected output:

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
