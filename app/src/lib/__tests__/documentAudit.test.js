import { describe, expect, it } from 'vitest'
import { auditGeneratedDocument } from '../documentAudit'

describe('auditGeneratedDocument', () => {
  const outline = [
    { id: 'h1-1', level: 'H1', text: 'רציפות ואי רציפות', page: 1 },
    { id: 'h2-1', level: 'H2', text: 'תרגילים', page: 2 },
    { id: 'h3-1', level: 'H3', text: 'אם יש זמן פותרים לבד', page: 9 },
  ]

  it('reports missing headers and hallucinated headers', () => {
    const generated = {
      title: 'רציפות ואי רציפות',
      sections: [
        { header: 'תרגילים', body: '...' },
        { header: 'דוגמה חדשה', body: '...' },
      ],
    }

    expect(auditGeneratedDocument({ outline, generated })).toEqual({
      missingHeaders: ['אם יש זמן פותרים לבד'],
      unexpectedHeaders: ['דוגמה חדשה'],
      emptyBlocks: [],
      passed: false,
    })
  })

  it('flags empty body blocks', () => {
    const generated = {
      title: 'רציפות ואי רציפות',
      sections: [
        { header: 'תרגילים', body: '' },
        { header: 'אם יש זמן פותרים לבד', body: 'x' },
      ],
    }

    expect(auditGeneratedDocument({ outline, generated }).emptyBlocks).toEqual([
      { header: 'תרגילים', field: 'body' },
    ])
  })
})
