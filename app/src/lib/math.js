import katex from 'katex'

const RAW_LATEX_PATTERN = /\\(?:begin\{[^}]+\}|end\{[^}]+\}|[a-zA-Z]+)/
const COMPLEX_INLINE_ENV_PATTERN = /\\begin\{(?:cases|aligned|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|align\*?)\}/
const PDF_MATH_UNICODE_PATTERN = /[\u{1D400}-\u{1D7FF}\u2102\u2115\u211A\u211D\u2124\u2147]/u

function normalizePdfMathUnicode(text) {
  if (!text) return ''
  if (!PDF_MATH_UNICODE_PATTERN.test(text)) return text
  return text.normalize('NFKD')
}

function isEscaped(text, index) {
  let backslashes = 0
  let cursor = index - 1

  while (cursor >= 0 && text[cursor] === '\\') {
    backslashes += 1
    cursor -= 1
  }

  return backslashes % 2 === 1
}

export function splitMathSegments(text = '') {
  const segments = []
  let cursor = 0
  let textStart = 0

  while (cursor < text.length) {
    if (text[cursor] !== '$' || isEscaped(text, cursor)) {
      cursor += 1
      continue
    }

    const isBlock = text[cursor + 1] === '$' && !isEscaped(text, cursor + 1)
    const delimiter = isBlock ? '$$' : '$'

    if (cursor > textStart) {
      segments.push({ type: 'text', value: text.slice(textStart, cursor) })
    }

    const formulaStart = cursor + delimiter.length
    let formulaEnd = formulaStart
    let closed = false

    while (formulaEnd < text.length) {
      if (text[formulaEnd] === '$' && !isEscaped(text, formulaEnd)) {
        if (isBlock) {
          if (text[formulaEnd + 1] === '$' && !isEscaped(text, formulaEnd + 1)) {
            segments.push({ type: 'block', value: text.slice(formulaStart, formulaEnd) })
            formulaEnd += 2
            textStart = formulaEnd
            cursor = formulaEnd
            closed = true
            break
          }
        } else if (text[formulaEnd + 1] !== '$') {
          segments.push({ type: 'inline', value: text.slice(formulaStart, formulaEnd) })
          formulaEnd += 1
          textStart = formulaEnd
          cursor = formulaEnd
          closed = true
          break
        }
      }

      formulaEnd += 1
    }

    if (!closed) {
      segments.push({ type: 'text', value: text.slice(cursor) })
      return { segments, unclosedDelimiter: delimiter }
    }
  }

  if (textStart < text.length) {
    segments.push({ type: 'text', value: text.slice(textStart) })
  }

  return { segments, unclosedDelimiter: null }
}

export function normalizeMathText(text = '') {
  const normalizedDelimiters = normalizePdfMathUnicode(text)
    .replace(/\\\$\$/g, '$$')
    .replace(/\\\$/g, '$')

  const { segments } = splitMathSegments(normalizedDelimiters)

  return segments
    .map((segment) => {
      if (segment.type === 'text') {
        return segment.value.replace(/\\\\/g, '\n')
      }

      if (segment.type === 'block') {
        return `$$${segment.value}$$`
      }

      return `$${segment.value}$`
    })
    .join('')
}

function validateFormula(formula, displayMode) {
  katex.renderToString(formula, { throwOnError: true, displayMode, output: 'html' })
}

export function validateMathText(text = '') {
  const issues = []
  const { segments, unclosedDelimiter } = splitMathSegments(text)

  if (unclosedDelimiter) {
    issues.push({
      severity: 'error',
      message: `Unclosed math delimiter ${unclosedDelimiter}`,
    })
  }

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      const rawLatex = segment.value.match(RAW_LATEX_PATTERN)
      if (rawLatex) {
        issues.push({
          severity: 'error',
          message: `Raw LaTeX outside math: ${rawLatex[0]}`,
        })
      }
      return
    }

    const formula = segment.value.trim()
    if (!formula) {
      issues.push({
        severity: 'error',
        message: 'Empty math expression',
      })
      return
    }

    try {
      validateFormula(formula, segment.type === 'block')
    } catch (error) {
      issues.push({
        severity: 'error',
        message: `Invalid ${segment.type} math: ${error.message}`,
      })
    }

    if (segment.type === 'inline' && COMPLEX_INLINE_ENV_PATTERN.test(formula)) {
      issues.push({
        severity: 'warning',
        message: 'Complex LaTeX environment is inline; prefer $$...$$ for stable PDF rendering.',
      })
    }
  })

  return issues
}

function walkStrings(value, path = '', entries = []) {
  if (typeof value === 'string') {
    entries.push({ path, value })
    return entries
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, `${path}[${index}]`, entries))
    return entries
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nested]) => {
      const nextPath = path ? `${path}.${key}` : key
      walkStrings(nested, nextPath, entries)
    })
  }

  return entries
}

export function normalizeAcademicDocument(document) {
  if (typeof document === 'string') return normalizeMathText(document).trim()
  if (Array.isArray(document)) return document.map(normalizeAcademicDocument)
  if (document && typeof document === 'object') {
    return Object.fromEntries(
      Object.entries(document).map(([key, value]) => [key, normalizeAcademicDocument(value)])
    )
  }
  return document
}

export function validateAcademicDocument(document) {
  const checks = walkStrings(document)
    .map(({ path, value }) => ({
      path,
      issues: validateMathText(value),
    }))
    .filter((entry) => entry.issues.length > 0)

  const errors = checks.flatMap((entry) =>
    entry.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => ({ ...issue, path: entry.path }))
  )

  const warnings = checks.flatMap((entry) =>
    entry.issues
      .filter((issue) => issue.severity === 'warning')
      .map((issue) => ({ ...issue, path: entry.path }))
  )

  return {
    errors,
    warnings,
  }
}

export function formatValidationMessage(report) {
  const lines = ['בדיקת רינדור מתמטי נכשלה.']
  const topIssues = report.errors.slice(0, 5)

  topIssues.forEach((issue) => {
    lines.push(`- ${issue.path}: ${issue.message}`)
  })

  if (report.errors.length > topIssues.length) {
    lines.push(`- ועוד ${report.errors.length - topIssues.length} שגיאות נוספות.`)
  }

  return lines.join('\n')
}
