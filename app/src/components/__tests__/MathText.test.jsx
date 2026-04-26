import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import MathText from '../MathText.jsx'

function render(component) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    createRoot(container).render(component)
  })
  return container
}

describe('MathText', () => {
  it('renders markdown headings without exposing hash markers', () => {
    const container = render(<MathText text={'# רציפות ואי רציפות\n\n## רציפות'} />)

    const headings = [...container.querySelectorAll('h3, h4')].map(node => node.textContent)
    expect(headings).toContain('רציפות ואי רציפות')
    expect(headings).toContain('רציפות')
    expect(container.textContent).not.toContain('#')
  })

  it('joins soft-wrapped paragraph lines instead of inserting hard breaks', () => {
    const container = render(
      <MathText text={'פונקציה רציפה אם ניתן לצייר אותה\nמבלי להרים את העט מהדף.'} />,
    )

    expect(container.textContent).toContain('פונקציה רציפה אם ניתן לצייר אותה מבלי להרים את העט מהדף.')
    expect(container.querySelectorAll('br')).toHaveLength(0)
  })

  it('renders markdown images as inline <img> tags', () => {
    const container = render(<MathText text={'![עמוד 3](data:image/png;base64,AAAA)'} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toContain('data:image/png;base64,AAAA')
  })
})
