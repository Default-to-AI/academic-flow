import katex from 'katex'

function parseText(text) {
  const segments = []
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const isBlock = match[0].startsWith('$$')
    const formula = isBlock
      ? match[0].slice(2, -2).trim()
      : match[0].slice(1, -1).trim()
    segments.push({ type: isBlock ? 'block' : 'inline', value: formula })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+?\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-b-${i}`}>{part.slice(2, -2)}</strong>
    }
    return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
  })
}

function renderTextSegment(text, segKey) {
  const lines = text.split('\n')
  const result = []

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      result.push(<br key={`${segKey}-br-${lineIdx}`} />)
    }

    const bulletMatch = line.match(/^\*\s+(.+)$/)
    if (bulletMatch) {
      result.push(
        <span key={`${segKey}-li-${lineIdx}`} className="doc-list-item">
          {renderInline(bulletMatch[1], `${segKey}-${lineIdx}`)}
        </span>
      )
    } else {
      result.push(...renderInline(line, `${segKey}-${lineIdx}`))
    }
  })

  return result
}

export default function MathText({ text }) {
  if (!text) return null
  const segments = parseText(text)

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{renderTextSegment(seg.value, i)}</span>
        }

        const html = katex.renderToString(seg.value, {
          throwOnError: false,
          displayMode: seg.type === 'block',
          output: 'html',
        })

        if (seg.type === 'block') {
          return (
            <div key={i} className="math-block" dangerouslySetInnerHTML={{ __html: html }} />
          )
        }

        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        )
      })}
    </>
  )
}
