import { useState } from 'react'

export default function DevPanel({ validation, doc }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const issues = [
    ...validation.errors.map(e => ({ ...e, severity: 'error' })),
    ...validation.warnings.map(w => ({ ...w, severity: 'warning' })),
  ]

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-100 font-mono text-xs">
      {/* Math issues */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-amber-400 font-bold uppercase tracking-widest mb-3">
          Math Validation — {validation.errors.length}E / {validation.warnings.length}W
        </h2>
        {issues.length === 0 ? (
          <p className="text-green-400">All clear</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700 text-left">
                <th className="py-1 pr-3 w-14">SEV</th>
                <th className="py-1 pr-3 w-40">PATH</th>
                <th className="py-1">MESSAGE</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, i) => (
                <tr key={i} className="border-b border-gray-800 align-top">
                  <td className={`py-1 pr-3 font-bold ${issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {issue.severity === 'error' ? 'ERR' : 'WARN'}
                  </td>
                  <td className="py-1 pr-3 text-gray-400 break-all">{issue.path || '—'}</td>
                  <td className="py-1 text-gray-200 break-words">{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* JSON viewer */}
      <div className="flex flex-col flex-1 min-h-0 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-amber-400 font-bold uppercase tracking-widest">
            Document JSON — {doc.sections?.length ?? 0} sections
          </h2>
          <button
            onClick={handleCopy}
            className="border border-gray-700 px-2 py-1 rounded text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="flex-1 overflow-auto bg-gray-900 rounded p-3 text-gray-300 whitespace-pre text-xs leading-relaxed">
          {JSON.stringify(doc, null, 2)}
        </pre>
      </div>
    </div>
  )
}
