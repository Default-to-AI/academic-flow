import { describe, expect, it, vi } from 'vitest'
import { auditGeneratedDocument } from '../documentAudit'
import { auditMathBlocks } from '../mathAudit'
import { createAttemptLog } from '../pipelineTelemetry'
import { buildProcessingState, processSections } from '../processPipeline'

describe('createAttemptLog', () => {
  it('formats the attempt indicator exactly once per stage update', () => {
    const log = createAttemptLog({
      attempt: 2,
      maxAttempts: 3,
      timestamp: '2026-04-24T00:23:36Z',
      status: 'math_audit_failed',
    })

    expect(log).toBe('[Attempt 2/3] | [2026-04-24T00:23:36Z] | [math_audit_failed]')
  })
})

describe('processSections', () => {
  it('retries only the malformed section when math audit fails', async () => {
    const generateSection = vi
      .fn()
      .mockResolvedValueOnce({ header: 'תרגילים', content: 'f(x)= \\begin{cases}', common_mistakes: 'x', example: 'y' })
      .mockResolvedValueOnce({ header: 'תרגילים', content: '$$f(x)=x$$', common_mistakes: 'x', example: 'y' })

    const result = await processSections({
      sections: [{ id: 'h2-1', heading: 'תרגילים', sourceText: '...' }],
      generateSection,
      onStatus: () => {},
    })

    expect(generateSection).toHaveBeenCalledTimes(2)
    expect(result[0].content).toBe('$$f(x)=x$$')
  })

  it('retries when the section request throws and then succeeds', async () => {
    const generateSection = vi
      .fn()
      .mockRejectedValueOnce(new Error('503 overloaded'))
      .mockResolvedValueOnce({ header: 'תרגילים', content: '$$f(x)=x$$', common_mistakes: 'x', example: 'y' })

    const result = await processSections({
      sections: [{ id: 'h2-1', heading: 'תרגילים', sourceText: '...' }],
      generateSection,
      onStatus: () => {},
    })

    expect(generateSection).toHaveBeenCalledTimes(2)
    expect(result[0]._fallback).toBeUndefined()
  })

  it('uses a fallback section instead of crashing after repeated failures', async () => {
    const generateSection = vi.fn().mockRejectedValue(new Error('network down'))

    const result = await processSections({
      sections: [{ id: 'h3-1', heading: 'אם יש זמן פותרים לבד', sourceText: 'קטע מקור' }],
      generateSection,
      onStatus: () => {},
    })

    expect(generateSection).toHaveBeenCalledTimes(3)
    expect(result[0]._fallback).toBe(true)
    expect(result[0].header).toBe('אם יש זמן פותרים לבד')
  })

  it('retries when the section contains too much English prose', async () => {
    const generateSection = vi
      .fn()
      .mockResolvedValueOnce({
        header: 'תרגילים',
        content: 'DETERMINING SIGN OF INFINITY: The sign of the infinite limit is determined by the sign of the numerator and denominator.',
        common_mistakes: 'Keep the signs consistent on both sides of the point.',
        example: 'If x tends to a, compare the signs.',
      })
      .mockResolvedValueOnce({
        header: 'תרגילים',
        content: 'סימן האינסוף נקבע לפי סימן המונה וסימן המכנה.',
        common_mistakes: 'אין לשכוח לבדוק גבולות חד-צדדיים.',
        example: 'בודקים את הסימנים משמאל ומימין.',
      })

    const result = await processSections({
      sections: [{ id: 'h2-1', heading: 'תרגילים', sourceText: '...' }],
      generateSection,
      onStatus: () => {},
    })

    expect(generateSection).toHaveBeenCalledTimes(2)
    expect(result[0].content).toContain('סימן האינסוף')
  })

  it('accepts sections with empty optional blocks when content is present', async () => {
    const generateSection = vi.fn().mockResolvedValue({
      header: 'הגדרה',
      content: 'הפונקציה מוגדרת לכל $x > 0$.',
      common_mistakes: '',
      example: '',
    })

    const result = await processSections({
      sections: [{ id: 'h2-1', heading: 'הגדרה', sourceText: '...' }],
      generateSection,
      onStatus: () => {},
    })

    expect(generateSection).toHaveBeenCalledTimes(1)
    expect(result[0]._fallback).toBeUndefined()
    expect(result[0].common_mistakes).toBe('')
    expect(result[0].example).toBe('')
  })

  it('rejects output that drops the self-practice section or leaks raw cases latex', () => {
    const generated = {
      title: 'רציפות ואי רציפות',
      sections: [
        { header: 'תרגילים', content: 'f(x)= \\begin{cases}', common_mistakes: 'x', example: 'y' },
      ],
    }

    const outline = [
      { id: 'h2-1', level: 'H2', text: 'תרגילים', page: 2 },
      { id: 'h3-1', level: 'H3', text: 'אם יש זמן פותרים לבד', page: 9 },
    ]

    const audit = auditGeneratedDocument({ outline, generated })
    const math = auditMathBlocks(generated.sections[0].content)

    expect(audit.missingHeaders).toEqual(['אם יש זמן פותרים לבד'])
    expect(math.rawLatexLeaks).toEqual(['\\begin{cases}'])
  })
})

describe('buildProcessingState', () => {
  it('exposes telemetry lines and audit summaries to the UI', () => {
    expect(buildProcessingState({
      attempts: ['[Attempt 1/3] | [2026-04-24T00:23:31Z] | [request_sent]'],
      audit: { missingHeaders: ['אם יש זמן פותרים לבד'], unexpectedHeaders: [], emptyBlocks: [], rawLatexLeaks: ['\\begin{cases}'] },
    })).toEqual({
      attempts: ['[Attempt 1/3] | [2026-04-24T00:23:31Z] | [request_sent]'],
      auditSummary: [
        'Missing headers: 1',
        'Unexpected headers: 0',
        'Empty blocks: 0',
        'Raw LaTeX leaks: 1',
        'Fallback sections: 0',
      ],
    })
  })
})
