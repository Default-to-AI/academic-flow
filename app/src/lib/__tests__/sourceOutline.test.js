import { describe, expect, it } from 'vitest'
import { buildSectionInputs, buildSourceOutline } from '../sourceOutline'

describe('buildSourceOutline', () => {
  it('extracts ordered headings from OCR-like PDF text pages', () => {
    const pages = [
      'רציפות ואי רציפות\nרציפות\nסיווג נקודות אי רציפות',
      'תרגילים\n1. האם הפונקציות הבאות אלמנטריות',
      'אם יש זמן פותרים לבד',
    ]

    expect(buildSourceOutline(pages)).toEqual([
      { id: 'h1-1', level: 'H1', text: 'רציפות ואי רציפות', page: 1 },
      { id: 'h2-1', level: 'H2', text: 'רציפות', page: 1 },
      { id: 'h2-2', level: 'H2', text: 'סיווג נקודות אי רציפות', page: 1 },
      { id: 'h2-3', level: 'H2', text: 'תרגילים', page: 2 },
      { id: 'h3-1', level: 'H3', text: '1. האם הפונקציות הבאות אלמנטריות', page: 2 },
      { id: 'h3-2', level: 'H3', text: 'אם יש זמן פותרים לבד', page: 3 },
    ])
  })

  it('builds section inputs from the extracted outline', () => {
    const pages = [
      'רציפות ואי רציפות\nפתיחה',
      'תרגילים\nשאלה 1',
      'אם יש זמן פותרים לבד\nשאלה 2',
    ]
    const outline = buildSourceOutline(pages)

    expect(buildSectionInputs(pages, outline)).toEqual([
      {
        id: 'h1-1',
        level: 'H1',
        heading: 'רציפות ואי רציפות',
        page: 1,
        sourceText: 'רציפות ואי רציפות\nפתיחה',
      },
      {
        id: 'h2-1',
        level: 'H2',
        heading: 'תרגילים',
        page: 2,
        sourceText: 'תרגילים\nשאלה 1\n\nאם יש זמן פותרים לבד\nשאלה 2',
      },
      {
        id: 'h3-1',
        level: 'H3',
        heading: 'אם יש זמן פותרים לבד',
        page: 3,
        sourceText: 'אם יש זמן פותרים לבד\nשאלה 2',
      },
    ])
  })
})
