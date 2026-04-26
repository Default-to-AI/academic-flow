import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MathText from '../../components/MathText'
import { auditMathBlocks } from '../mathAudit'
import { normalizeMathText } from '../math.js'

describe('auditMathBlocks', () => {
  it('passes balanced inline and block LaTeX', () => {
    const result = auditMathBlocks('נדרש $x \\neq 0$ וכן $$\\frac{x+1}{x-1}$$')
    expect(result.passed).toBe(true)
  })

  it('fails on raw latex outside delimiters', () => {
    const result = auditMathBlocks('f(x) = \\begin{cases} x & x > 1')
    expect(result.rawLatexLeaks).toEqual(['\\begin{cases}'])
    expect(result.passed).toBe(false)
  })

  it('fails on unbalanced delimiters', () => {
    const result = auditMathBlocks('נדרש $x > 0')
    expect(result.unbalancedDelimiters).toBe(true)
    expect(result.passed).toBe(false)
  })
})

describe('MathText rendering', () => {
  it('renders markdown-style hierarchy instead of a wall of text', () => {
    const html = renderToStaticMarkup(
      <MathText text={'**הגדרה**\n---\n* תנאי ראשון\n* תנאי שני\n$$x^2$$'} />
    )

    expect(html).toContain('doc-list-item')
    expect(html).toContain('math-block')
  })
})

describe('normalizeMathText', () => {
  it('normalizes unicode math alphabet characters into plain ASCII', () => {
    expect(normalizeMathText('𝑓(𝑥)=ⅇ𝑥+ℝ')).toContain('f(x)=ex+R')
  })
})
