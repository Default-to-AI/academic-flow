function normalizeToken(token) {
  return token.replace(/\s+/g, '')
}

export function parsePageSelection(input, maxPages) {
  const trimmed = (input || '').trim()
  if (!trimmed) {
    throw new Error('יש להזין עמוד אחד לפחות.')
  }

  const pages = new Set()
  const tokens = trimmed.split(',').map(token => token.trim()).filter(Boolean)

  for (const rawToken of tokens) {
    const token = normalizeToken(rawToken)
    const rangeMatch = token.match(/^(\d+)-(\d+)$/)

    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])

      if (start > end) {
        throw new Error('טווח עמודים חייב להיות בסדר עולה.')
      }
      if (start < 1 || end > maxPages) {
        throw new Error(`יש לבחור עמודים בין 1 ל-${maxPages}.`)
      }

      for (let page = start; page <= end; page += 1) {
        pages.add(page)
      }
      continue
    }

    if (!/^\d+$/.test(token)) {
      throw new Error('פורמט העמודים אינו תקין. השתמש ב-3 או 2-5 או 1,4,7.')
    }

    const page = Number(token)
    if (page < 1 || page > maxPages) {
      throw new Error(`יש לבחור עמודים בין 1 ל-${maxPages}.`)
    }
    pages.add(page)
  }

  return [...pages].sort((a, b) => a - b)
}
