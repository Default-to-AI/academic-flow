import { useState } from 'react'
import MathText from './MathText.jsx'
import { normalizeMathText, validateMathText } from '../lib/math.js'

const REFERENCE = [
  { syntax: '**טקסט**',         label: 'מודגש (Bold)' },
  { syntax: '__טקסט__',         label: 'קו תחתון (Underline)' },
  { syntax: '**__טקסט__**',     label: 'מודגש + קו תחתון' },
  { syntax: '$נוסחה$',          label: 'LaTeX inline' },
  { syntax: '$$נוסחה$$',        label: 'LaTeX block' },
  { syntax: '* פריט',           label: 'פריט רשימה (bullets)' },
  { syntax: '1. פריט',          label: 'פריט ממוספר' },
  { syntax: '    * פריט',       label: 'פריט מוזח (4 רווחים)' },
  { syntax: '3+ ירידות שורה',   label: 'מצטמצם ל-2 אוטומטית' },
]

const DEFAULT_INPUT = `**__מכנה:__**
המכנה **אסור שיהיה שווה לאפס**.
**לדוגמה:** עבור $Q(x,y)/P(x,y)$, נדרש $Q(x,y) \\neq 0$.

**__שורש מסדר זוגי:__**
הביטוי **חייב** להיות **אי-שלילי**.
**לדוגמה:** עבור $G(x,y)$, נדרש $G(x,y) \\geq 0$.

**__לוגריתם:__**
הארגומנט חייב להיות **חיובי לחלוטין**.



שלוש ירידות שורה מעל ← מצטמצמות לשתיים.

* פריט ראשון
* פריט שני
    * תת-פריט מוזח
    * תת-פריט נוסף

1. שלב ראשון
2. שלב שני
3. שלב שלישי`

const BOX_STYLES = {
  none:     'bg-white border border-gray-200',
  example:  'doc-box doc-box-example',
  mistakes: 'doc-box doc-box-mistakes',
}

const BOX_LABELS = {
  none:     'ללא תיבה',
  example:  'תיבת דוגמה (כחול)',
  mistakes: 'תיבת טעויות (אדום)',
}

export default function RenderDebugger() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [boxStyle, setBoxStyle] = useState('example')
  const normalizedInput = normalizeMathText(input)
  const issues = validateMathText(normalizedInput)
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-5">

      {/* Syntax reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Syntax Reference</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
          {REFERENCE.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-700 whitespace-pre shrink-0">
                {r.syntax}
              </code>
              <span className="text-gray-500 text-xs">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Box style selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">תצוגת פלט:</span>
        {Object.entries(BOX_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setBoxStyle(key)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              boxStyle === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${
        errors.length
          ? 'border-red-200 bg-red-50 text-red-800'
          : warnings.length
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}>
        {errors.length > 0 && <p className="font-semibold">Math preflight failed</p>}
        {errors.length === 0 && warnings.length > 0 && <p className="font-semibold">Math preflight warnings</p>}
        {errors.length === 0 && warnings.length === 0 && <p className="font-semibold">Math preflight passed</p>}
        {issues.length > 0 && (
          <div className="mt-2 space-y-1 font-mono text-xs">
            {issues.map((issue, index) => (
              <p key={index}>{issue.severity.toUpperCase()}: {issue.message}</p>
            ))}
          </div>
        )}
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-2 gap-5">

        {/* Input */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">קלט גולמי</p>
          <textarea
            dir="rtl"
            className="w-full h-96 font-mono text-sm bg-gray-950 text-emerald-300 rounded-xl p-4 resize-none outline-none border-0 leading-relaxed"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            placeholder="הכנס טקסט עם syntax..."
          />
          <p className="text-xs text-gray-400">{input.split('\n').length} שורות · {input.length} תווים</p>
        </div>

        {/* Output */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">פלט מרונדר</p>
          <div className={`h-96 rounded-xl overflow-auto academic-document ${BOX_STYLES[boxStyle]}`} dir="rtl">
            {boxStyle !== 'none' && (
              <div className="doc-box-label">
                {boxStyle === 'example' ? 'דוגמה' : 'טעויות נפוצות'}
              </div>
            )}
            <MathText text={input} />
          </div>
        </div>

      </div>
    </div>
  )
}
