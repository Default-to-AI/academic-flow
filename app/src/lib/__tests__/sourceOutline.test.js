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
      { id: 'h2-1', level: 'H2', text: 'סיווג נקודות אי רציפות', page: 1 },
      { id: 'h2-2', level: 'H2', text: 'תרגילים', page: 2 },
      { id: 'h3-1', level: 'H3', text: '1. האם הפונקציות הבאות אלמנטריות', page: 2 },
      { id: 'h3-2', level: 'H3', text: 'אם יש זמן פותרים לבד', page: 3 },
    ])
  })

  it('extracts a generic lecture-note outline without hardcoded course titles', () => {
    const pages = [
      'מבוא למיקרו כלכלה\nהיצע וביקוש\nהקשר בין מחיר לכמות',
      'שיווי משקל בשוק\nכאשר הביקוש שווה להיצע מתקבל שיווי משקל\n1. תרגול קצר',
    ]

    expect(buildSourceOutline(pages)).toEqual([
      { id: 'h1-1', level: 'H1', text: 'מבוא למיקרו כלכלה', page: 1 },
      { id: 'h2-1', level: 'H2', text: 'היצע וביקוש', page: 1 },
      { id: 'h2-2', level: 'H2', text: 'שיווי משקל בשוק', page: 2 },
      { id: 'h3-1', level: 'H3', text: '1. תרגול קצר', page: 2 },
    ])
  })

  it('rejects standalone inline labels after keyword removal', () => {
    const pages = ['רציפות ואי רציפות\nפתרון\nדוגמה\nהוכחה\nמסקנה חשובה']
    const outline = buildSourceOutline(pages)
    const texts = outline.map(h => h.text)
    expect(texts).not.toContain('פתרון')
    expect(texts).not.toContain('דוגמה')
    expect(texts).not.toContain('הוכחה')
  })

  it('retains single-word keyword headings that stand alone', () => {
    const pages = ['הגדרה\nהגדרה של רציפות היא תנאי על הגבול']
    const outline = buildSourceOutline(pages)
    expect(outline[0].text).toBe('הגדרה')
  })

  it('builds bounded section inputs that stop at the next heading across pages', () => {
    const pages = [
      'מבוא למיקרו כלכלה\nפתיחה\nהיצע וביקוש\nעקומת הביקוש יורדת',
      'המשך הסבר על הביקוש\nשיווי משקל בשוק\nנקודת החיתוך בין ההיצע לביקוש',
    ]
    const outline = [
      { id: 'h1-1', level: 'H1', text: 'מבוא למיקרו כלכלה', page: 1 },
      { id: 'h2-1', level: 'H2', text: 'היצע וביקוש', page: 1 },
      { id: 'h2-2', level: 'H2', text: 'שיווי משקל בשוק', page: 2 },
    ]

    expect(buildSectionInputs(pages, outline)).toEqual([
      {
        id: 'h1-1',
        level: 'H1',
        heading: 'מבוא למיקרו כלכלה',
        page: 1,
        sourceText: 'מבוא למיקרו כלכלה\nפתיחה',
      },
      {
        id: 'h2-1',
        level: 'H2',
        heading: 'היצע וביקוש',
        page: 1,
        sourceText: 'היצע וביקוש\nעקומת הביקוש יורדת\n\nהמשך הסבר על הביקוש',
      },
      {
        id: 'h2-2',
        level: 'H2',
        heading: 'שיווי משקל בשוק',
        page: 2,
        sourceText: 'שיווי משקל בשוק\nנקודת החיתוך בין ההיצע לביקוש',
      },
    ])
  })
})
