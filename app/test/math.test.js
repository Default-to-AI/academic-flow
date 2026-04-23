import { describe, expect, it } from 'vitest'

import {
  normalizeAcademicDocument,
  normalizeMathText,
  validateAcademicDocument,
  validateMathText,
} from '../src/lib/math.js'

describe('math helpers', () => {
  it('normalizeMathText preserves LaTeX line breaks inside math', () => {
    const input = 'לפני\\\\אחרי $$\\begin{cases}x+4 \\\\ 4+e^x\\end{cases}$$'
    const normalized = normalizeMathText(input)

    expect(normalized).toBe('לפני\nאחרי $$\\begin{cases}x+4 \\\\ 4+e^x\\end{cases}$$')
  })

  it('normalizeMathText unwraps escaped dollar delimiters', () => {
    const input = 'טיפול במצבי אי-ודאות: \\$\\infty - \\infty\\$'
    const normalized = normalizeMathText(input)

    expect(normalized).toBe('טיפול במצבי אי-ודאות: $\\infty - \\infty$')
    expect(validateMathText(normalized).filter((issue) => issue.severity === 'error')).toEqual([])
  })

  it('validateMathText flags raw latex outside math', () => {
    const issues = validateMathText('f(x) = \\begin{cases}x+4\\end{cases}')

    expect(issues.some((issue) => issue.severity === 'error' && issue.message.includes('Raw LaTeX outside math'))).toBe(true)
  })

  it('validateMathText flags unclosed math delimiters', () => {
    const issues = validateMathText('נסמן $x^2 + 1')

    expect(issues.some((issue) => issue.severity === 'error' && issue.message.includes('Unclosed math delimiter'))).toBe(true)
  })

  it('normalizeAcademicDocument and validateAcademicDocument keep cases renderable', () => {
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

    expect(report.errors).toEqual([])
  })
})
