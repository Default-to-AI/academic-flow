import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeAcademicDocument,
  normalizeMathText,
  validateAcademicDocument,
  validateMathText,
} from '../src/lib/math.js'

test('normalizeMathText preserves LaTeX line breaks inside math', () => {
  const input = 'לפני\\\\אחרי $$\\begin{cases}x+4 \\\\ 4+e^x\\end{cases}$$'
  const normalized = normalizeMathText(input)

  assert.equal(normalized, 'לפני\nאחרי $$\\begin{cases}x+4 \\\\ 4+e^x\\end{cases}$$')
})

test('normalizeMathText unwraps escaped dollar delimiters', () => {
  const input = 'טיפול במצבי אי-ודאות: \\$\\infty - \\infty\\$'
  const normalized = normalizeMathText(input)

  assert.equal(normalized, 'טיפול במצבי אי-ודאות: $\\infty - \\infty$')
  assert.deepEqual(validateMathText(normalized).filter((issue) => issue.severity === 'error'), [])
})

test('validateMathText flags raw latex outside math', () => {
  const issues = validateMathText('f(x) = \\begin{cases}x+4\\end{cases}')

  assert.equal(issues.some((issue) => issue.severity === 'error' && issue.message.includes('Raw LaTeX outside math')), true)
})

test('validateMathText flags unclosed math delimiters', () => {
  const issues = validateMathText('נסמן $x^2 + 1')

  assert.equal(issues.some((issue) => issue.severity === 'error' && issue.message.includes('Unclosed math delimiter')), true)
})

test('normalizeAcademicDocument and validateAcademicDocument keep cases renderable', () => {
  const document = normalizeAcademicDocument({
    title: 'גבולות',
    subject_meta: 'חדו"א',
    sections: [
      {
        header: 'דוגמה',
        content: 'נחשב: $f(x)=\\begin{cases}x+4 & x>0 \\\\ 4+e^x & x<0\\end{cases}$',
        common_mistakes: '',
        example: 'טיפול במצבי אי-ודאות: \\$\\infty - \\infty\\$',
      },
    ],
  })

  const report = validateAcademicDocument(document)

  assert.deepEqual(report.errors, [])
})
