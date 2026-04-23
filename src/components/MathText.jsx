import katex from 'katex'

function renderKatex(formula, displayMode) {
  return katex.renderToString(formula, { throwOnError: false, displayMode, output: 'html' })
}

// Single-pass tokenizer: handles $$block$$, $inline$, and **bold** in one scan
function tokenize(text) {
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*]+?\*\*)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push({ type: 'bold', value: token.slice(2, -2) })
    } else if (token.startsWith('$$')) {
      parts.push({ type: 'block', value: token.slice(2, -2).trim() })
    } else {
      parts.push({ type: 'inline', value: token.slice(1, -1).trim() })
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return parts
}

function renderPart(part, key) {
  switch (part.type) {
    case 'text':
      return <span key={key}>{part.value}</span>
    case 'bold':
      // Bold content may itself contain inline LaTeX — recurse
      return (
        <strong key={key}>
          {tokenize(part.value).map((p, i) => renderPart(p, `${key}-${i}`))}
        </strong>
      )
    case 'inline':
      return <span key={key} dangerouslySetInnerHTML={{ __html: renderKatex(part.value, false) }} />
    case 'block':
      return <div key={key} className="math-block" dangerouslySetInnerHTML={{ __html: renderKatex(part.value, true) }} />
    default:
      return null
  }
}

export default function MathText({ text }) {
  if (!text) return null

  const lines = text.replace(/\\n(?![a-zA-Z])/g, '\n').split('\n')
  const result = []

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) result.push(<br key={`br-${lineIdx}`} />)

    const bulletMatch = line.match(/^\*\s+([\s\S]+)$/)
    const content = bulletMatch ? bulletMatch[1] : line
    const parts = tokenize(content)
    const rendered = parts.map((p, i) => renderPart(p, `${lineIdx}-${i}`))

    if (bulletMatch) {
      result.push(
        <span key={`li-${lineIdx}`} className="doc-list-item">
          {rendered}
        </span>
      )
    } else {
      result.push(...rendered)
    }
  })

  return <>{result}</>
}
