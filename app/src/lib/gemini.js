import { GoogleGenerativeAI } from '@google/generative-ai'
import systemPromptText from '../../prompts/academic-flow.system.md?raw'
import {
  formatValidationMessage,
  normalizeAcademicDocument,
  validateAcademicDocument,
} from './math.js'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const RETRIES = 3
const RETRY_DELAY_MS = 2500

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Fix invalid LaTeX backslashes before JSON.parse (e.g. \sigma → \\sigma)
function fixBackslashes(text) {
  return text.replace(/\\([^"\\\/bfnrtu\d])/g, '\\\\$1')
}

function extractJSON(text) {
  // Pass 1: direct parse
  try { return JSON.parse(text) } catch {}

  // Pass 2: fix LaTeX backslashes, try again
  try { return JSON.parse(fixBackslashes(text)) } catch {}

  // Pass 3: extract from markdown fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (fenced) {
    try { return JSON.parse(fenced[1]) } catch {}
    try { return JSON.parse(fixBackslashes(fenced[1])) } catch {}
  }

  // Pass 4: extract raw JSON object
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    const slice = text.slice(start, end + 1)
    try { return JSON.parse(slice) } catch {}
    try { return JSON.parse(fixBackslashes(slice)) } catch {}
  }

  throw new Error('התגובה מה-API אינה JSON תקין')
}

function sanitizeField(str) {
  return str
    .replace(/<[^>]+>/g, '')  // strip HTML tags the model shouldn't output (<br>, <b>, etc.)
    .trim()
}

function sanitize(obj) {
  if (typeof obj === 'string') return sanitizeField(obj)
  if (Array.isArray(obj)) return obj.map(sanitize)
  if (obj && typeof obj === 'object')
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitize(v)]))
  return obj
}

function isRetryable(error) {
  if (error instanceof SyntaxError) return true
  const msg = error?.message || ''
  return msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand')
}

function toUserMessage(error) {
  const msg = error?.message || ''
  if (msg.includes('בדיקת רינדור מתמטי נכשלה')) return msg
  if (msg.includes('גדול מדי')) return msg
  if (msg.includes('401') || msg.includes('403') || msg.includes('API key')) {
    return 'מפתח ה-API שגוי או פג תוקפו — בדוק את ההגדרות.'
  }
  if (msg.includes('503') || msg.includes('overloaded')) {
    return 'שרת ה-AI עמוס כרגע — נסה שוב בעוד מספר דקות.'
  }
  if (error instanceof SyntaxError || msg.includes('JSON') || msg.includes('אינה JSON')) {
    return 'הבינה המלאכותית החזירה תגובה שגויה לאחר מספר ניסיונות. נסה להעלות את הקובץ שוב.'
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('NetworkError')) {
    return 'שגיאת רשת — בדוק את החיבור לאינטרנט ונסה שוב.'
  }
  return 'שגיאה בעיבוד הקובץ — נסה שוב.'
}

async function withRetry(fn, onStatus) {
  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    if (attempt > 1) {
      onStatus(`ניסיון ${attempt} מתוך ${RETRIES} — מנסה שוב...`)
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt - 1)))
    }
    try {
      return await fn(attempt)
    } catch (e) {
      lastError = e
      if (attempt < RETRIES && isRetryable(e)) continue
      throw e
    }
  }
  throw lastError
}

export function getModel() {
  return localStorage.getItem('academicflow_model') || DEFAULT_MODEL
}

export async function processDocument(file, apiKey, onStatus = () => {}) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('הקובץ גדול מדי — מקסימום 20MB')
  }

  onStatus('מכין את הקובץ...')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: getModel(),
    systemInstruction: systemPromptText,
    generationConfig: { responseMimeType: 'application/json' },
  })

  let parts
  if (file.type === 'text/plain') {
    const text = await file.text()
    parts = [text]
  } else {
    const base64 = await fileToBase64(file)
    parts = [{ inlineData: { data: base64, mimeType: file.type } }]
  }
  parts.push('נתח את חומר ההרצאה הזה ויצר מדריך למידה מובנה.')

  try {
    return await withRetry(async () => {
      onStatus('שולח לבינה המלאכותית...')
      const result = await model.generateContent(parts)
      onStatus('מעבד את התגובה...')
      const sanitized = sanitize(extractJSON(result.response.text()))
      const normalized = normalizeAcademicDocument(sanitized)
      onStatus('בודק תקינות רינדור מתמטי...')
      const validation = validateAcademicDocument(normalized)

      if (validation.errors.length > 0) {
        throw new Error(formatValidationMessage(validation))
      }

      return { doc: normalized, validation }
    }, onStatus)
  } catch (e) {
    throw new Error(toUserMessage(e))
  }
}
