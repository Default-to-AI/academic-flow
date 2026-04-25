const EXERCISE_HEADING_PATTERN = /^(?:\d+[.)-]|[א-ת][.)])\s+\S/
const SELF_PRACTICE_PATTERN = /^אם יש זמן/
const SENTENCE_START_WORDS = ['כאשר', 'אם', 'לכן', 'כדי', 'משום', 'בגלל', 'לאחר', 'לפני', 'במילים', 'נסמן', 'נגדיר', 'נאמר']
const HEADING_KEYWORDS = [
  'מבוא',
  'רקע',
  'הגדרה',
  'הגדרות',
  'משפט',
  'טענה',
  'סיווג',
  'מסקנה',
  'סיכום',
  'תרגיל',
  'תרגילים',
  'שאלה',
  'שאלות',
  'יישום',
  'שיווי',
  'ביקוש',
  'היצע',
]

function normalizeHeading(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function countWords(text) {
  return (text.match(/\S+/g) || []).length
}

function isNoiseLine(line) {
  return /^\d+$/.test(line)
    || /^עמוד\s+\d+$/i.test(line)
    || /^page\s+\d+$/i.test(line)
    || /^-\s*\d+\s*-$/.test(line)
}

function isCompactLine(line) {
  return line.length <= 72 && countWords(line) <= 8
}

export function extractHintAndText(line) {
  const match = line.match(/^\[Size: (\d+)pt, Bold: (true|false)\]\s*(.*)/);
  if (match) {
    return {
      size: parseInt(match[1], 10),
      bold: match[2] === 'true',
      text: match[3]
    };
  }
  return { size: 12, bold: false, text: line };
}

function scoreHeadingCandidate({ line, previousLine, nextLine, isFirstLineOnFirstPage }) {
  const parsed = extractHintAndText(line);
  const rawText = parsed.text;

  if (!rawText || isNoiseLine(rawText)) return Number.NEGATIVE_INFINITY;
  
  // High confidence heading based on font hints
  if (parsed.size > 14) return 20;
  if (parsed.size > 12 && parsed.bold) return 15;

  if (EXERCISE_HEADING_PATTERN.test(rawText)) return 10;
  if (SELF_PRACTICE_PATTERN.test(rawText)) return 10;

  let score = 0;
  const hasKeyword = HEADING_KEYWORDS.some(keyword => rawText.includes(keyword));
  const hasContextCue =
    Boolean(nextLine && nextLine.length >= line.length + 12) ||
    Boolean(previousLine && previousLine.length >= line.length + 20);

  if (isFirstLineOnFirstPage && isCompactLine(rawText)) score += 4;
  if (isCompactLine(rawText)) score += 2;
  if (countWords(rawText) <= 5) score += 1;
  if (hasKeyword) score += 2;
  if (!/[.!?]$/.test(rawText)) score += 1;
  if (!/[,;]|:\s+\S{4,}/.test(rawText)) score += 1;
  if (hasContextCue) score += 1;
  if (SENTENCE_START_WORDS.some(word => rawText.startsWith(`${word} `))) score -= 3;
  if (/^[•·–—●▪▸►]/.test(rawText)) score -= 4;

  if (rawText.length > 85) score -= 3;
  if (countWords(rawText) > 12) score -= 3;
  if (/[=<>+\-/*→←↔⇒⇔∈∉∀∃]/.test(rawText)) score -= 2;
  if (/[\u{1D400}-\u{1D7FF}]/u.test(rawText)) score -= 4;

  if (!isFirstLineOnFirstPage && !hasKeyword && !hasContextCue) {
    score -= 3;
  }

  if (countWords(rawText) === 1 && !hasKeyword && !EXERCISE_HEADING_PATTERN.test(rawText)) score -= 3;

  if (parsed.bold) score += 5;

  return score;
}

export function buildSourceOutline(pages) {
  const counters = { H1: 0, H2: 0, H3: 0 }
  const outline = []
  let detectedTitle = false

  pages.forEach((pageText, pageIndex) => {
    const lines = (pageText || '').split('\n').map(normalizeHeading).filter(Boolean)

    lines.forEach((line, lineIndex) => {
      const previousLine = lineIndex > 0 ? lines[lineIndex - 1] : ''
      const nextLine = lineIndex < lines.length - 1 ? lines[lineIndex + 1] : ''
      const score = scoreHeadingCandidate({
        line,
        previousLine,
        nextLine,
        isFirstLineOnFirstPage: pageIndex === 0 && lineIndex === 0,
      })

      if (score < 4) return

      const parsed = extractHintAndText(line);
      const level = !detectedTitle
        ? 'H1'
        : ((EXERCISE_HEADING_PATTERN.test(parsed.text) || SELF_PRACTICE_PATTERN.test(parsed.text)) ? 'H3' : 'H2')

      counters[level] += 1
      outline.push({
        id: `${level.toLowerCase()}-${counters[level]}`,
        level,
        text: line,
        page: pageIndex + 1,
      })

      if (level === 'H1') {
        detectedTitle = true
      }
    })
  })

  return outline
}

function slicePageToHeading(pageText, currentHeading, nextHeading = null) {
  const startIndex = currentHeading ? pageText.indexOf(currentHeading) : 0
  const fromIndex = startIndex > -1 ? startIndex : 0

  if (!nextHeading) {
    return pageText.slice(fromIndex).trim()
  }

  const nextIndex = pageText.indexOf(nextHeading, fromIndex + currentHeading.length)
  const toIndex = nextIndex > -1 ? nextIndex : pageText.length
  return pageText.slice(fromIndex, toIndex).trim()
}

function sliceUntilNextHeading(pages, item, next) {
  const normalizedPages = pages.map(page => page || '')
  const currentPageIndex = item.page - 1
  const chunks = []

  if (next && next.page === item.page) {
    return slicePageToHeading(normalizedPages[currentPageIndex], item.text, next.text)
  }

  chunks.push(slicePageToHeading(normalizedPages[currentPageIndex], item.text))

  if (!next) {
    normalizedPages.slice(currentPageIndex + 1).forEach((pageText) => {
      const text = pageText.trim()
      if (text) chunks.push(text)
    })
    return chunks.join('\n\n').trim()
  }

  normalizedPages.slice(currentPageIndex + 1, next.page - 1).forEach((pageText) => {
    const text = pageText.trim()
    if (text) chunks.push(text)
  })

  const nextPageText = normalizedPages[next.page - 1] || ''
  const nextHeadingIndex = nextPageText.indexOf(next.text)
  if (nextHeadingIndex > -1) {
    const leadIn = nextPageText.slice(0, nextHeadingIndex).trim()
    if (leadIn) chunks.push(leadIn)
  }

  return chunks.join('\n\n').trim()
}

export function buildSectionInputs(pages, outline) {
  return outline.map((item, index) => {
    const next = outline[index + 1]

    return {
      id: item.id,
      level: item.level,
      heading: item.text,
      page: item.page,
      sourceText: sliceUntilNextHeading(pages, item, next),
    }
  })
}
