const EXERCISE_HEADING_PATTERN = /^(?:\d+[.)-]|[א-ת][.)])\s+\S/
const SELF_PRACTICE_PATTERN = /^אם יש זמן/
const SENTENCE_START_WORDS = [
  'כאשר', 'אם', 'לכן', 'כדי', 'משום', 'בגלל', 'לאחר', 'לפני', 'במילים',
  'נסמן', 'נגדיר', 'נאמר', 'נבדוק', 'נחשב', 'נציב', 'נצמצם', 'נפרק',
  'נפתח', 'נבחן', 'נקבל', 'נשתמש', 'נדרוש', 'נחלק', 'נכפיל', 'נסיק',
  'מכיוון', 'מאחר', 'עבור', 'נתון', 'נתונה', 'נתוני',
]
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
  // Page number patterns
  if (/^\d+$/.test(line)) return true
  if (/^עמוד\s+\d+$/i.test(line)) return true
  if (/^page\s+\d+$/i.test(line)) return true
  if (/^-\s*\d+\s*-$/.test(line)) return true
  // Fraction/formula fragments: only digits, math symbols, spaces — no Hebrew
  if (/^[\d\s\u{1D400}-\u{1D7FF}+\-*/=<>(){}\[\].,!?|^~]+$/u.test(line)) return true
  return false
}

function hasHebrew(text) {
  return /[\u05D0-\u05EA]/.test(text)
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

  if (!rawText || isNoiseLine(rawText)) return Number.NEGATIVE_INFINITY

  // Lines with no Hebrew can never be headings in this document type.
  // They are invariably formula rows, fraction fragments, or math expressions.
  if (!hasHebrew(rawText)) return Number.NEGATIVE_INFINITY

  const hasKeyword = HEADING_KEYWORDS.some(keyword => rawText.includes(keyword));
  const hasContextCue =
    Boolean(nextLine && nextLine.length >= line.length + 12) ||
    Boolean(previousLine && previousLine.length >= line.length + 20);

  let score = 0

  // A line needs at least one strong structural signal to qualify as a heading.
  // Without one, short Hebrew phrases that happen to be compact and unpunctuated
  // (mid-solution labels like 'נבדוק בתפר', 'ימין', 'פתרון א') would accumulate
  // enough layout micro-bonuses to cross the threshold despite being body text.
  const hasStrongSignal =
    parsed.size >= 13 ||                          // font-hint step-up
    hasKeyword ||                                 // known section keyword
    EXERCISE_HEADING_PATTERN.test(rawText) ||     // numbered exercise
    SELF_PRACTICE_PATTERN.test(rawText) ||        // "אם יש זמן"
    isFirstLineOnFirstPage                        // document title

  if (!hasStrongSignal) score -= 5

  // --- Font hint bonuses (additive, NOT hard bypasses) ---
  // A big size step is a strong positive signal but can still be overridden
  // by the negative signals below (math, punctuation, long sentences, etc.)
  if (parsed.size > 0) {
    // Treat the median body size as ~12pt; reward genuine step-ups
    // (these numbers are calibrated assuming pdfText.js already filtered
    //  lines that are NOT bigger than median — so any hinted line is already
    //  at least 2pt above body text)
    if (parsed.size >= 18) score += 10;       // clearly a section title
    else if (parsed.size >= 15) score += 7;   // likely a heading
    else if (parsed.size >= 13) score += 4;   // possible subheading
  }
  if (parsed.bold) score += 3;  // bold alone is only a weak positive

  // --- Pattern shortcuts (still high confidence) ---
  if (EXERCISE_HEADING_PATTERN.test(rawText)) score += 8;
  if (SELF_PRACTICE_PATTERN.test(rawText)) score += 8;

  // --- Layout / content bonuses ---
  if (isFirstLineOnFirstPage && isCompactLine(rawText)) score += 4;
  if (isCompactLine(rawText)) score += 2;
  if (countWords(rawText) <= 5) score += 1;
  if (hasKeyword) score += 2;
  if (!/[.!?]$/.test(rawText)) score += 1;
  if (!/[,;]|:\s+\S{4,}/.test(rawText)) score += 1;
  if (hasContextCue) score += 1;

  // --- Penalty signals ---
  if (SENTENCE_START_WORDS.some(word => rawText.startsWith(`${word} `))) score -= 4;
  if (/^[•·–—●▪▸►]/.test(rawText)) score -= 4;
  if (rawText.length > 85) score -= 4;
  if (countWords(rawText) > 12) score -= 4;
  // Math / formula content strongly suggests body text, not a heading
  if (/[=<>+\-/*→←↔⇒⇔∈∉∀∃]/.test(rawText)) score -= 4;
  if (/[\u{1D400}-\u{1D7FF}]/u.test(rawText)) score -= 5;
  // Ends with comma/semicolon typical of inline emphasis, not a heading
  if (/[,;]$/.test(rawText)) score -= 3;
  // "משפט: פונקציה..." style — a keyword immediately followed by ': ' and
  // substantive continuation text is a theorem/definition *statement* (body text),
  // not a standalone section heading.  Penalise heavily so it never crosses the
  // threshold, regardless of font-size bonuses it may have accumulated.
  if (HEADING_KEYWORDS.some(kw => new RegExp(`^${kw}[:\s]\\s*\\S{4,}`).test(rawText))) score -= 6;

  if (!isFirstLineOnFirstPage && !hasKeyword && !hasContextCue) {
    score -= 3;
  }

  if (countWords(rawText) === 1 && !hasKeyword && !EXERCISE_HEADING_PATTERN.test(rawText)) score -= 3;

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

      if (score < 5) return

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
    // Strip the font-hint prefix so Gemini receives clean Hebrew text in the
    // heading field. The raw item.text (with hint) is still used for slicing.
    const cleanHeading = extractHintAndText(item.text).text

    return {
      id: item.id,
      level: item.level,
      heading: cleanHeading,
      page: item.page,
      sourceText: sliceUntilNextHeading(pages, item, next),
    }
  })
}
