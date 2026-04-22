import { useState, useEffect } from 'react'

const KEY_API = 'academicflow_api_key'
const KEY_MODEL = 'academicflow_model'
const DEFAULT_MODEL = 'gemini-2.5-flash'

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (מומלץ)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (יציב יותר)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (גיבוי)' },
]

export function getApiKey() {
  return localStorage.getItem(KEY_API) || ''
}

export default function Settings({ onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)

  useEffect(() => {
    setApiKey(localStorage.getItem(KEY_API) || '')
    setModel(localStorage.getItem(KEY_MODEL) || DEFAULT_MODEL)
  }, [])

  const save = () => {
    localStorage.setItem(KEY_API, apiKey.trim())
    localStorage.setItem(KEY_MODEL, model)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-5">הגדרות</h2>

        <label className="block text-sm text-gray-600 mb-1.5">
          מפתח API — Google Gemini
        </label>
        <input
          type="password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="AIza..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <p className="text-xs text-gray-400 mb-5">
          נשמר רק בדפדפן שלך — לא נשלח לשום שרת חיצוני.
        </p>

        <label className="block text-sm text-gray-600 mb-1.5">
          מודל
        </label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={onClose}
          >
            ביטול
          </button>
          <button
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            onClick={save}
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}
