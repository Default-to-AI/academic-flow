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
          <aside className="doc-audit-banner">
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

      {data.sections.map((section, i) => (
        <section key={i} className="doc-section">
          <h2 className="doc-section-header">{section.header}</h2>

          <div className="doc-content">
            <MathText text={section.content} />
          </div>

          {section.common_mistakes && (
            <div className="doc-box doc-box-mistakes">
              <div className="doc-box-label">טעויות נפוצות</div>
              <div>
                <MathText text={section.common_mistakes} />
              </div>
            </div>
          )}

          {section.example && (
            <div className="doc-box doc-box-example">
              <div className="doc-box-label">דוגמה</div>
              <div>
                <MathText text={section.example} />
              </div>
            </div>
          )}
        </section>
      ))}
    </article>
  )
}
