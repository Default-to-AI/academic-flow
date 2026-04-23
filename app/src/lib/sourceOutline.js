const HEADING_RULES = [
  { level: 'H1', pattern: /^רציפות ואי רציפות$/ },
  { level: 'H2', pattern: /^(רציפות|סיווג נקודות אי רציפות|תרגילים|היכן נצפה למצוא אי רציפות)$/ },
  { level: 'H3', pattern: /^(\d+\.\s+.+|אם יש זמן פותרים לבד)$/ },
]

function normalizeHeading(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

export function buildSourceOutline(pages) {
  const counters = { H1: 0, H2: 0, H3: 0 }
  const outline = []

  pages.forEach((pageText, pageIndex) => {
    for (const rawLine of (pageText || '').split('\n')) {
      const line = normalizeHeading(rawLine)
      if (!line) continue

      const match = HEADING_RULES.find(rule => rule.pattern.test(line))
      if (!match) continue

      counters[match.level] += 1
      outline.push({
        id: `${match.level.toLowerCase()}-${counters[match.level]}`,
        level: match.level,
        text: line,
        page: pageIndex + 1,
      })
    }
  })

  return outline
}

export function buildSectionInputs(pages, outline) {
  const normalizedPages = pages.map(page => page || '')

  return outline.map((item, index) => {
    const currentPageIndex = item.page - 1
    const currentPageText = normalizedPages[currentPageIndex] || ''
    const next = outline[index + 1]
    const headingStart = currentPageText.indexOf(item.text)
    const nextHeadingInSamePage = next && next.page === item.page
      ? currentPageText.indexOf(next.text, Math.max(headingStart + item.text.length, 0))
      : -1

    let sourceText = ''
    if (nextHeadingInSamePage && nextHeadingInSamePage > -1) {
      sourceText = currentPageText.slice(headingStart, nextHeadingInSamePage).trim()
    } else if (item.level === 'H1') {
      sourceText = currentPageText.slice(Math.max(headingStart, 0)).trim()
    } else {
      const nextPageIndex = next ? next.page - 1 : normalizedPages.length - 1
      const pageSlice = normalizedPages.slice(currentPageIndex, nextPageIndex + 1)
      sourceText = pageSlice.join('\n\n').trim()
    }

    return {
      id: item.id,
      level: item.level,
      heading: item.text,
      page: item.page,
      sourceText,
    }
  })
}
