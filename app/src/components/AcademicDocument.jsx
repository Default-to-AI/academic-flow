import MathText from './MathText.jsx'

export default function AcademicDocument({ data, auditSummary = [] }) {
  return (
    <article className="academic-document bg-white max-w-[794px] mx-auto px-14 py-12 shadow-sm print:shadow-none print:px-0 print:py-0">
      <header>
        <h1 className="doc-title">{data.title}</h1>
        {data.subject_meta && (
          <p className="doc-subject">{data.subject_meta}</p>
        )}
        {auditSummary.length > 0 && (
          <aside className="doc-audit-banner no-print">
            <strong>Integrity checks</strong>
            <div className="doc-audit-list">
              {auditSummary.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </aside>
        )}
        <hr className="doc-divider" />
      </header>

      {data.sections.map((section, i) => {
        const prevPage = i > 0 ? data.sections[i - 1]._page : null
        const showPageMarker = section._page != null && section._page !== prevPage
        return (
          <section key={i} className="doc-section">
            {showPageMarker && (
              <span className="doc-page-marker no-print">generated from page {section._page}</span>
            )}
            <h2 className="doc-section-header">{section.header}</h2>
            <div className="doc-content">
              <MathText text={section.body} />
            </div>
          </section>
        )
      })}
    </article>
  )
}
