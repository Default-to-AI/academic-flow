function normalize(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

export function auditGeneratedDocument({ outline, generated }) {
  const expectedHeaders = new Set((outline || []).map(item => normalize(item.text)))
  const generatedSections = generated?.sections || []
  const generatedHeaders = generatedSections.map(section => normalize(section.header))

  const missingHeaders = [...expectedHeaders].filter(header => {
    if (normalize(generated?.title) === header) return false
    return !generatedHeaders.includes(header)
  })

  const unexpectedHeaders = generatedHeaders.filter(header => !expectedHeaders.has(header))

  const emptyBlocks = []
  for (const section of generatedSections) {
    if (!normalize(section.body)) {
      emptyBlocks.push({ header: normalize(section.header), field: 'body' })
    }
  }

  return {
    missingHeaders,
    unexpectedHeaders,
    emptyBlocks,
    passed: missingHeaders.length === 0 && unexpectedHeaders.length === 0 && emptyBlocks.length === 0,
  }
}
