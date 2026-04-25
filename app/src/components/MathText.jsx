import katex from 'katex'
import { normalizeMathText } from '../lib/math.js'

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

function isRule(line) {
  return /^---+$/.test(line.trim())
}

function flushParagraph(result, paragraphLines, keyPrefix) {
  if (paragraphLines.length === 0) return
  const content = paragraphLines.join(' ')
  const parts = tokenize(content)
  result.push(
    <p key={`${keyPrefix}-${result.length}`} className="doc-paragraph">
      {parts.map((p, i) => renderPart(p, `${keyPrefix}-${result.length}-${i}`))}
    </p>,
  )
  paragraphLines.length = 0
}

export default function MathText({ text }) {
  if (!text) return null

  const lines = normalizeMathText(text)
    .replace(/\\n(?![a-zA-Z])/g, '\n')
    .replace(/\n{3,}/g, '\n\n')  // collapse 3+ newlines to max 2
    .split('\n')

  const result = []
  const paragraphLines = []

  lines.forEach((line, lineIdx) => {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      flushParagraph(result, paragraphLines, `p-${lineIdx}`)
      return
    }

    if (isRule(line)) {
      flushParagraph(result, paragraphLines, `p-${lineIdx}`)
      result.push(<hr key={`hr-${lineIdx}`} className="doc-inline-divider" />)
      return
    }

    const headingMatch = line.match(/^(#{1,6})\s+([\s\S]+)$/)
    if (headingMatch) {
      flushParagraph(result, paragraphLines, `p-${lineIdx}`)
      const Tag = headingMatch[1].length <= 3 ? 'h3' : 'h4'
      const className = headingMatch[1].length <= 3 ? 'doc-inline-h3' : 'doc-inline-h4'
      const parts = tokenize(headingMatch[2])
      result.push(
        <Tag key={`h-${lineIdx}`} className={className}>
          {parts.map((p, i) => renderPart(p, `${lineIdx}-${i}`))}
        </Tag>
      )
      return
    }

    const currIsList = isListLine(line)

    const indentedMatch = line.match(/^( {4,})\*\s+([\s\S]+)$/)
    const bulletMatch = !indentedMatch && line.match(/^\*\s+([\s\S]+)$/)
    const numberedMatch = !indentedMatch && !bulletMatch && line.match(/^(\d+)[.)]\s+([\s\S]+)$/)

    if (!currIsList) {
      paragraphLines.push(trimmedLine)
      return
    }

    flushParagraph(result, paragraphLines, `p-${lineIdx}`)

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

  flushParagraph(result, paragraphLines, 'p-final')

  return <>{result}</>
}
