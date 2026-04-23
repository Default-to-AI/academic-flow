import { describe, expect, it } from 'vitest'
import { normalizeModelText } from '../gemini'

describe('normalizeModelText', () => {
  it('normalizes align environments into a single renderable math block', () => {
    const raw = '$$ \\begin{align*} a&=b \\\\ c&=d $$ \\end{align*} $$'
    const normalized = normalizeModelText(raw)

    expect(normalized).toContain('\\begin{aligned}')
    expect(normalized).toContain('\\end{aligned}')
    expect(normalized).not.toContain('align*')
    expect(normalized).toContain('a&=b')
  })

  it('converts bracket math delimiters into dollar delimiters', () => {
    const normalized = normalizeModelText('\\[x^2\\] וגם \\(y^2\\)')

    expect(normalized).toContain('x^2')
    expect(normalized).toContain('y^2')
    expect(normalized).not.toContain('\\[')
    expect(normalized).not.toContain('\\(')
    expect(normalized).toContain('$')
  })
})
