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

export default function MathText({ text }) {
  if (!text) return null
  const segments = parseText(text)

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }

        const html = katex.renderToString(seg.value, {
          throwOnError: false,
          displayMode: seg.type === 'block',
          output: 'html',
        })

        if (seg.type === 'block') {
          return (
            <div
              key={i}
              className="katex-display"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }

        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        )
      })}
    </>
  )
}
