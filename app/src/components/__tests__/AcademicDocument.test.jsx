import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import AcademicDocument from '../AcademicDocument.jsx'

function render(component) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    createRoot(container).render(component)
  })
  return container
}

describe('AcademicDocument', () => {
  it('keeps integrity diagnostics out of the printed document', () => {
    const container = render(
      <AcademicDocument
        data={{ title: 'מסמך', subject_meta: '', sections: [{ header: 'כותרת', body: 'תוכן' }] }}
        auditSummary={['Unexpected headers: 5']}
      />,
    )

    const audit = [...container.querySelectorAll('aside')]
      .find(node => node.textContent.includes('Integrity checks'))
    expect(audit.classList.contains('no-print')).toBe(true)
  })
})
