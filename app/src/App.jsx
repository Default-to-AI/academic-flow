import { useRef, useState } from 'react'
import FileUpload from './components/FileUpload.jsx'
import Settings, { getApiKey } from './components/Settings.jsx'
import AcademicDocument from './components/AcademicDocument.jsx'
import RenderDebugger from './components/RenderDebugger.jsx'
import DevPanel from './components/DevPanel.jsx'
import { processDocument } from './lib/gemini.js'
import { parsePageSelection } from './lib/pageSelection.js'
import { getPdfPageCount, isPdfFile } from './lib/pdfText.js'
import { version } from '../package.json'

export default function App() {
  const [status, setStatus] = useState('idle') // idle | processing | stopped | done | error
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  const [attemptLogs, setAttemptLogs] = useState([])
  const [auditSummary, setAuditSummary] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [pageCount, setPageCount] = useState(null)
  const [loadingFileMeta, setLoadingFileMeta] = useState(false)
  const [useCustomPages, setUseCustomPages] = useState(false)
  const [pageSelectionInput, setPageSelectionInput] = useState('')
  const [selectionError, setSelectionError] = useState('')
  const activeController = useRef(null)

  const handleFile = async (file) => {
    activeController.current?.abort()
    activeController.current = null
    setStatus('idle')
    setSelectedFile(file)
    setDoc(null)
    setError('')
    setAttemptLogs([])
    setAuditSummary([])
    setSelectionError('')
    setUseCustomPages(false)
    setPageSelectionInput('')

    if (!isPdfFile(file)) {
      setPageCount(null)
      return
    }

    setLoadingFileMeta(true)
    try {
      const count = await getPdfPageCount(file)
      setPageCount(count)
      setPageSelectionInput(`1-${count}`)
    } catch (e) {
      setSelectedFile(null)
      setPageCount(null)
      setError('לא ניתן לקרוא את קובץ ה-PDF הזה.')
      setStatus('error')
    } finally {
      setLoadingFileMeta(false)
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) return

    const apiKey = getApiKey()
    if (!apiKey) {
      setShowSettings(true)
      return
    }

    let pageNumbers = null
    if (isPdfFile(selectedFile) && useCustomPages) {
      try {
        pageNumbers = parsePageSelection(pageSelectionInput, pageCount)
        setSelectionError('')
      } catch (e) {
        setSelectionError(e.message)
        return
      }
    }

    setStatus('processing')
    setError('')
    setAttemptLogs([])
    setAuditSummary([])
    const controller = new AbortController()
    activeController.current = controller

    try {
      const data = await processDocument(selectedFile, apiKey, {
        onStatus: (line) => {
          if (activeController.current === controller) {
            setAttemptLogs(prev => [...prev, line])
          }
        },
        onAudit: (summary) => {
          if (activeController.current === controller) {
            setAuditSummary(summary)
          }
        },
        onDebug: (info) => {
          if (activeController.current === controller) {
            setDebugInfo(info)
          }
        },
        pageNumbers,
        signal: controller.signal,
      })
      if (activeController.current !== controller) return
      setDoc(data)
      setStatus('done')
    } catch (e) {
      if (activeController.current !== controller) return
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        setStatus('stopped')
        return
      }
      setError(e.message || 'שגיאה בעיבוד הקובץ')
      setStatus('error')
    } finally {
      if (activeController.current === controller) {
        activeController.current = null
      }
    }
  }

  const stopProcessing = () => {
    activeController.current?.abort()
  }

  const reset = () => {
    activeController.current?.abort()
    activeController.current = null
    setStatus('idle')
    setDoc(null)
    setError('')
    setAttemptLogs([])
    setAuditSummary([])
    setDebugInfo(null)
    setShowDevPanel(false)
    setSelectedFile(null)
    setPageCount(null)
    setLoadingFileMeta(false)
    setUseCustomPages(false)
    setPageSelectionInput('')
    setSelectionError('')
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
              {!showDevPanel && (
                <button
                  onClick={() => window.print()}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  שמור PDF ↓
                </button>
              )}
              <button
                onClick={() => setShowDevPanel(d => !d)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-mono ${
                  showDevPanel
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {showDevPanel ? 'close dev' : 'dev panel'}
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
              {loadingFileMeta && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                  בודק את מבנה ה-PDF...
                </div>
              )}
              {selectedFile && !loadingFileMeta && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected File</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">{selectedFile.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {isPdfFile(selectedFile) && pageCount
                          ? `${pageCount} עמודים זמינים לבחירה`
                          : 'הקובץ יישלח כפי שהוא'}
                      </p>
                    </div>
                    <button
                      onClick={reset}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50"
                    >
                      החלף קובץ
                    </button>
                  </div>

                  {isPdfFile(selectedFile) && pageCount && (
                    <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomPages(false)
                            setSelectionError('')
                          }}
                          className={`rounded-full px-4 py-2 text-sm transition-colors ${
                            !useCustomPages
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          כל העמודים
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomPages(true)
                            setSelectionError('')
                          }}
                          className={`rounded-full px-4 py-2 text-sm transition-colors ${
                            useCustomPages
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          בחירה ידנית
                        </button>
                      </div>

                      {useCustomPages && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            אילו עמודים לשלוח ל-Gemini
                          </label>
                          <input
                            value={pageSelectionInput}
                            onChange={(e) => {
                              setPageSelectionInput(e.target.value)
                              setSelectionError('')
                            }}
                            dir="ltr"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            placeholder="למשל: 7 או 7-9 או 3,5,11"
                          />
                          <p className="text-xs text-slate-500">
                            תומך בעמוד בודד, טווח, או רשימה. לדוגמה: <span dir="ltr">4</span>, <span dir="ltr">4-6</span>, <span dir="ltr">2,4,9</span>
                          </p>
                          {selectionError && (
                            <p className="text-sm text-red-600">{selectionError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      {isPdfFile(selectedFile)
                        ? 'אפשר לבחור עמודים ספציפיים כדי לדבג קטע נקודתי בלי לשלוח את כל המסמך.'
                        : 'לקבצים שאינם PDF אין בחירת עמודים.'}
                    </p>
                    <button
                      onClick={handleProcess}
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      עבד את הקובץ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
              <div className="w-11 h-11 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 font-medium">מעבד את חומר ההרצאה...</p>
              <p className="text-sm text-gray-400">עשוי לקחת מספר שניות</p>
              <button
                type="button"
                onClick={stopProcessing}
                className="mt-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                עצור עיבוד
              </button>
              {attemptLogs.length > 0 && (
                <div className="mt-4 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 text-right shadow-sm">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Pipeline Telemetry
                  </p>
                  <div className="space-y-1">
                    {attemptLogs.map((line, index) => (
                      <div key={`${line}-${index}`} className="font-mono text-xs text-slate-600">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'stopped' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm space-y-4">
              <p className="font-bold text-slate-800 text-lg">העיבוד נעצר</p>
              <p className="text-sm text-slate-500">
                הבקשות הבאות לא יישלחו. בקשה שכבר נשלחה ל-Gemini עשויה עדיין להסתיים בצד השירות.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleProcess}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  הפעל שוב
                </button>
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  בחר קובץ אחר
                </button>
              </div>
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
        showDevPanel ? (
          <div className="no-print flex" style={{ height: 'calc(100vh - 57px)' }}>
            <div className="flex-1 overflow-y-auto px-4 py-8">
              <AcademicDocument data={doc} auditSummary={auditSummary} />
            </div>
            <div className="w-[480px] shrink-0 border-l border-gray-200 overflow-hidden">
              {debugInfo && <DevPanel validation={debugInfo.validation} doc={debugInfo.doc} />}
            </div>
          </div>
        ) : (
          <div className="max-w-[860px] mx-auto px-4 py-8 print:p-0 print:max-w-none">
            <AcademicDocument data={doc} auditSummary={auditSummary} />
          </div>
        )
      )}

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
