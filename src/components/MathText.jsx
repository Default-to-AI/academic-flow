import katex from 'katex'

function renderKatex(formula, displayMode) {
  return katex.renderToString(formula, { throwOnError: false, displayMode, output: 'html' })
}

// Single-pass tokenizer: handles $$block$$, $inline$, **bold**, __underline__
function tokenize(text) {
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*]+?\*\*|__[^_\n]+?__)/g
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
    } else if (token.startsWith('__')) {
      parts.push({ type: 'underline', value: token.slice(2, -2) })
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
      // Bold content may itself contain __underline__ or inline LaTeX — recurse
      return (
        <strong key={key}>
          {tokenize(part.value).map((p, i) => renderPart(p, `${key}-${i}`))}
        </strong>
      )
    case 'underline':
      return (
        <u key={key}>
          {tokenize(part.value).map((p, i) => renderPart(p, `${key}-${i}`))}
        </u>
      )
    case 'inline':
      return <span key={key} dangerouslySetInnerHTML={{ __html: renderKatex(part.value, false) }} />
    case 'block':
      return <div key={key} className="math-block" dangerouslySetInnerHTML={{ __html: renderKatex(part.value, true) }} />
    default:
      return null
  }
}

function isListLine(line) {
  return /^( {4,})?\*\s+/.test(line) || /^\d+[.)]\s+/.test(line)
}

export default function MathText({ text }) {
  if (!text) return null

  const lines = text
    .replace(/\\n(?![a-zA-Z])/g, '\n')
    .replace(/\n{3,}/g, '\n\n')  // collapse 3+ newlines to max 2
    .split('\n')

  const result = []

  lines.forEach((line, lineIdx) => {
    const currIsList = isListLine(line)
    const prevIsList = lineIdx > 0 && isListLine(lines[lineIdx - 1])

    // <br> only between non-list lines — list items are display:block and handle their own line breaks
    if (lineIdx > 0 && !currIsList && !prevIsList) {
      result.push(<br key={`br-${lineIdx}`} />)
    }

    const indentedMatch = line.match(/^( {4,})\*\s+([\s\S]+)$/)
    const bulletMatch = !indentedMatch && line.match(/^\*\s+([\s\S]+)$/)
    const numberedMatch = !indentedMatch && !bulletMatch && line.match(/^(\d+)[.)]\s+([\s\S]+)$/)

    const content = indentedMatch
      ? indentedMatch[2]
      : bulletMatch
      ? bulletMatch[1]
      : numberedMatch
      ? numberedMatch[2]
      : line

    const parts = tokenize(content)
    const rendered = parts.map((p, i) => renderPart(p, `${lineIdx}-${i}`))

    if (indentedMatch) {
      result.push(
        <span key={`li-indent-${lineIdx}`} className="doc-list-item doc-list-item-indent">
          {rendered}
        </span>
      )
    } else if (bulletMatch) {
      result.push(
        <span key={`li-${lineIdx}`} className="doc-list-item">
          {rendered}
        </span>
      )
    } else if (numberedMatch) {
      result.push(
        <span key={`li-num-${lineIdx}`} className="doc-list-item doc-list-item-numbered" data-n={numberedMatch[1]}>
          {rendered}
        </span>
      )
    } else {
      result.push(...rendered)
    }
  })

  return <>{result}</>
}
