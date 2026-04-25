import { describe, expect, it } from 'vitest'
import { buildSelectedPageInputs } from '../gemini.js'

describe('selected page section inputs', () => {
  it('uses the first meaningful content heading instead of the page number', () => {
    const inputs = buildSelectedPageInputs([
      '- 1 -\nרציפות ואי רציפות\nאינטואיטיבית, פונקציה רציפה אם ניתן לצייר אותה.',
      '- 2 -\nסקירה גרפית של אי-רציפויות\nהגרף הראשי מציג פונקציה.',
    ], [1, 2])

    expect(inputs.map(input => input.heading)).toEqual([
      'רציפות ואי רציפות',
      'סקירה גרפית של אי-רציפויות',
    ])
    expect(inputs.map(input => input.heading)).not.toContain('עמוד 1')
    expect(inputs.map(input => input.heading)).not.toContain('עמוד 2')
  })
})
