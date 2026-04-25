# PDF Processing Improvements — Implementation Tasks

Branch: `improving-pdf-processing-by-gemini`
Based on: Research synthesis in `docs/researches/`

## Priority Order

Tasks are ordered by impact-to-effort ratio. Each task is self-contained and verifiable.

---

### Task 1 — Increase PDF render scale 2→3 [`pdfText.js`]

**Why:** `renderPdfPageImages` renders at `scale = 2` (~144 DPI). At this resolution, Greek subscripts
(ϑ, α, λ), fraction bars, and small operators are undersampled — Gemini misreads them.
Scale 3 gives ~216 DPI images with 50% more pixel density, directly improving OCR accuracy for
math-dense pages. No API changes required.

**File:** `app/src/lib/pdfText.js`

**Change:** `scale = 2` → `scale = 3` in `renderPdfPageImages` signature default.

**Verify:** `npm test` — all 34 tests pass. No render logic changed, only default scale value.

- [x] Complete

---

### Task 2 — Replace `extractJSON()` with `jsonrepair` [`gemini.js`]

**Why:** The custom `extractJSON()` function uses brittle regex fallbacks that fail on edge cases:
unbalanced LaTeX braces inside strings, stray text before/after the JSON object, single-quoted keys.
The `jsonrepair` npm library handles all these cases generically and is production-tested.
The existing `fixBackslashes()` workaround for Gemini's redundant-escaping bug also becomes
unnecessary since `jsonrepair` normalizes escape sequences.

**Files:** `app/src/lib/gemini.js`, `app/package.json`

**Changes:**

1. `npm install jsonrepair`
2. Replace the entire `extractJSON()` function body with `jsonrepair`-based parsing
3. Remove `fixBackslashes()` since it's only called inside `extractJSON()`

**Verify:** `npm test` — all 34 tests pass. Manually verify the fenced-JSON and malformed-JSON
fallback paths are handled by `jsonrepair`.

- [x] Complete

---

### Task 3 — Harden system prompt: code-fence prohibition + few-shot example

**Why:** Gemini occasionally wraps LaTeX in triple-backtick code fences instead
of `$...$` delimiters. This is not caught by any existing rule in the prompt and causes KaTeX to
fail silently. A single explicit prohibition closes this gap.

A few-shot JSON example (Hebrew section with inline formula + display block) reduces output
inconsistency on hard mixed-content sections. The research shows this is the single highest-leverage
prompt engineering technique for structured output tasks.

**File:** `app/prompts/academic-flow.system.md`

**Changes:**

1. Add "never triple-backtick for math" rule under Mathematical Notation section
2. Add a `## FEW-SHOT EXAMPLE` section at the end with a complete hard input → correct JSON output

**Verify:** Read the prompt file and confirm rules are present and well-formed.

- [x] Complete

---

### Task 4 — Bump version to 2026.20.0 and run final test suite

**Why:** CLAUDE.md requires a version bump in the same commit as multi-file changes.
Current version: `2026.19.0`. Three files changed across Tasks 1–3 → increment `N`.

**File:** `app/package.json`

**Change:** `"version": "2026.19.0"` → `"version": "2026.20.0"`

**Verify:** `npm test` — all 34 tests pass on the final state.

- [x] Complete

---

## Summary of Changes

| File | Change |
| --- | --- |
| `app/src/lib/pdfText.js` | Default render scale 2 → 3 |
| `app/src/lib/gemini.js` | `extractJSON()` replaced with `jsonrepair`; `fixBackslashes()` removed |
| `app/prompts/academic-flow.system.md` | Code-fence prohibition + few-shot example |
| `app/package.json` | Version bump to `2026.20.0`; `jsonrepair` added to dependencies |
