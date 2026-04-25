# NotebookLM Research Suggestions — Implementation Plan

**Source**: OmniDocBench notebook (3882878f-c85f-453c-80fc-de2ada18b073)
**Date**: 2026-04-25
**Scope**: academic-flow pipeline improvements derived from PDF parsing research

---

## Background

The NotebookLM notebook contains academic research on PDF extraction, VLM-based parsing, and
RTL document handling. Two queries surfaced five concrete improvements applicable to
academic-flow. This plan implements the highest-impact one first and stages the rest.

---

## Step 1 — Flip prompt priority for digital-born PDFs (highest impact)

**Research finding**: For digital-born PDFs, "Assisted Generation / Copy Lookup Decoding"
pipelines treat the text layer as the character-level ground truth and the page image as the
structural/layout reference. This is the inverse of the current academic-flow prompt, which
says "image is the source of truth, use text as auxiliary." Flipping this eliminates
transcription errors (dropped operators, garbled symbols) because the model verifies text
tokens rather than re-reading them from a visual scan.

**File**: `app/src/lib/gemini.js` — `buildDocumentPrompt()`

**Change**:
- Current scope note (mode = 'page'): `"זהו עמוד PDF. הסתמך על התמונה המצורפת קודם, והשתמש בטקסט רק כעזר."`
- New scope note: `"זהו עמוד PDF דיגיטלי. הטקסט שלהלן הוא מקור האמת לתווים ולאופרטורים — אמת אותו ועצב אותו. השתמש בתמונה לאימות המבנה, סדר הקריאה והיררכיה בלבד."`

**Verify**: Run on `temp/input-file.pdf`. Check that exercise ג's second case condition
renders as `x < 1` (not dropped) without needing the prompt fix we added manually.

---

## Step 2 — Type-specific prompts (Heterogeneous Anchor Prompting)

**Research finding**: Using a single generic prompt for all section types causes VLMs to
misclassify elements (e.g., treating a formula as a text paragraph). The research recommends
separate prompt templates per element type: `P_formula` for LaTeX-heavy sections,
`P_text` for prose, `P_exercise` for worked problems.

**File**: `app/src/lib/gemini.js` — `buildDocumentPrompt()`

**Change**:
- Detect section type from `section.heading` and `section.sourceText` before building the prompt
- Add a `sectionType` classifier: `'exercise'` (contains numbered problems),
  `'definition'` (contains הגדרה/משפט), `'mixed'` (default)
- Append type-specific instruction block to the prompt:
  - `exercise`: "This section is a worked exercise set. Preserve every sub-problem label (א, ב, ג...). Every formula in a `\begin{cases}` block must include a complete inequality condition after `&`."
  - `definition`: "This section contains formal definitions and theorems. Preserve the exact logical structure. Use `$$` for all displayed formulas."
  - `mixed`: current default instructions

**Verify**: Section classification unit test — check that "תרגילים:" maps to `exercise` and
"הגדרה" maps to `definition`.

---

## Step 3 — Image resolution bump for math-dense pages

**Research finding**: The research shows that Gemini's default medium resolution (560 tokens/page)
is insufficient for small superscripts, Greek letters, and dense formula regions. High
resolution (1,120 tokens/page) is required for accurate OCR of complex math.

**File**: `app/src/lib/pdfText.js` — `renderPdfPageImages()`

**Current**: `scale = 2`

**Change**:
- Accept a `scale` option from the caller, defaulting to `2`
- In `gemini.js`, pass `scale: 3` when a section is classified as `exercise` or when
  `section.sourceText` contains more than 3 Unicode math characters (𝑓, 𝑥, ∈, etc.)
- This increases rendered image size for math-dense pages without blowing up cost on prose pages

**Verify**: Render page 3 of `temp/input-file.pdf` at scale 3 and confirm sub/superscript
characters are sharper.

---

## Step 4 — Explicit constraint: "Do not infer, only transcribe"

**Research finding**: Adding strict negative constraints to the VLM prompt ("Do not include
any content not visible in the source") sharply reduces hallucinations on long dense sections.
This directly addresses the page 9 fallback issue where Gemini likely hallucinated or
over-generated on the self-practice exercises.

**File**: `app/src/lib/gemini.js` — `buildDocumentPrompt()`
**File**: `app/prompts/academic-flow.system.md`

**Change** (system prompt, CONTENT FIDELITY RULES section):
Add:
> * **No inference rule**: Do not infer, paraphrase, or complete partial content. If a formula
>   is cut off or ambiguous in the source text, render what is visible and mark it with
>   `[?]`. Never guess what a missing operator or symbol should be.

**Verify**: Test on a section with a deliberately truncated source text — confirm the model
marks uncertainty rather than filling in.

---

## Step 5 — Chain-of-Thought auxiliary task for complex math sections

**Research finding**: For complex math, pipelines that require the VLM to complete an
auxiliary task before outputting the formula ("count visible symbols", "identify error tags")
produce structurally consistent LaTeX. This is called "Error-Driven Learning."

**File**: `app/src/lib/gemini.js` — `buildDocumentPrompt()`

**Change** (only for `exercise` section type from Step 2):
Prepend to the prompt body:
> "לפני הפקת ה-JSON, ספור בשקט את מספר משוואות ה-cases הנראות בדף. לכל ענף ב-cases, ודא שישנו אופרטור (<, >, ≤, ≥, =) אחרי &. אם חסר — השתמש בתמונה כדי לאמת ואז כלול אותו."

This creates an internal verification step before the model writes the output.

**Verify**: Confirm that exercise sections with piecewise functions pass the math audit without
manual operator fixes.

---

## Execution Order

| Step | File(s) | Risk | Effort |
|------|---------|------|--------|
| 1 — Flip prompt priority | `gemini.js` | Low | 1 line |
| 2 — Type-specific prompts | `gemini.js` | Medium | ~30 lines |
| 3 — Adaptive image resolution | `pdfText.js`, `gemini.js` | Low | ~10 lines |
| 4 — No-inference constraint | `gemini.js`, system prompt | Low | 3 lines |
| 5 — CoT auxiliary task | `gemini.js` | Medium | ~15 lines |

Do Steps 1, 3, 4 together (low-risk, additive). Do Steps 2 and 5 together after validating
that section classification is accurate.

---

## Success Criteria

- Zero dropped operators in `\begin{cases}` conditions across 5 test PDFs
- Page 9-type fallback sections reduced to 0 on the continuity lecture
- Math audit passes (no `inlineComplexEnv` warnings) on first Gemini attempt, not after retry
- No version bump needed for Step 1 alone (prompt-only change); bump for Steps 2–5 together
