import { useState } from 'react'
import FileUpload from './components/FileUpload.jsx'
import Settings, { getApiKey } from './components/Settings.jsx'
import AcademicDocument from './components/AcademicDocument.jsx'
import RenderDebugger from './components/RenderDebugger.jsx'
import { processDocument } from './lib/gemini.js'
import { version } from '../package.json'

export default function App() {
  const [status, setStatus] = useState('idle') // idle | processing | done | error
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  const [processingMsg, setProcessingMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const handleFile = async (file) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowSettings(true)
      return
    }
    setStatus('processing')
    setError('')
    setProcessingMsg('')
    try {
      const data = await processDocument(file, apiKey, setProcessingMsg)
      setDoc(data)
      setStatus('done')
    } catch (e) {
      setError(e.message || 'שגיאה בעיבוד הקובץ')
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setDoc(null)
    setError('')
    setProcessingMsg('')
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100">

      {/* ── Header (hidden on print) ── */}
      <header className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <span className="font-bold text-gray-900 text-lg tracking-tight">
          Academic Flow
          <span className="text-xs font-normal text-gray-400 mr-2">v{version}</span>
        </span>
        <div className="flex items-center gap-2">
          {status === 'done' && !debugMode && (
            <>
              <button
                onClick={reset}
                className="text-sm text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                קובץ חדש
              </button>
              <button
                onClick={() => window.print()}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                שמור PDF ↓
              </button>
            </>
          )}
          <button
            onClick={() => setDebugMode(d => !d)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-mono ${
              debugMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Debug Renderer"
          >
            {debugMode ? '← חזור' : 'debug'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 text-lg transition-colors"
            title="הגדרות"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* ── Debug Panel ── */}
      {debugMode && (
        <div className="no-print">
          <RenderDebugger />
        </div>
      )}

      {/* ── Upload / Processing / Error (hidden on print) ── */}
      {!debugMode && status !== 'done' && (
        <main className="no-print max-w-2xl mx-auto px-6 py-12">
          {status === 'idle' && (
            <div className="space-y-4">
              {!getApiKey() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                  נדרש מפתח Gemini API.{' '}
                  <button
                    className="underline font-medium"
                    onClick={() => setShowSettings(true)}
                  >
                    הוסף כאן
                  </button>
                </div>
              )}
              <FileUpload onFile={handleFile} />
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
              <div className="w-11 h-11 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 font-medium">
                {processingMsg || 'מעבד את חומר ההרצאה...'}
              </p>
              <p className="text-sm text-gray-400">עשוי לקחת מספר שניות</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center space-y-2">
              <p className="font-bold text-red-700 text-lg">שגיאה בעיבוד</p>
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={reset}
                className="mt-3 inline-block bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-2 rounded-lg transition-colors"
              >
                נסה שוב
              </button>
            </div>
          )}
        </main>
      )}

      {/* ── Academic Document (visible on screen + print) ── */}
      {!debugMode && status === 'done' && doc && (
        <div className="max-w-[860px] mx-auto px-4 py-8 print:p-0 print:max-w-none">
          <AcademicDocument data={doc} />
        </div>
      )}

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
