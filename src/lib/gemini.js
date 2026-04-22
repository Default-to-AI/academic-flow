import { GoogleGenerativeAI } from '@google/generative-ai'
import systemPromptText from '../../the_system_prompt.md?raw'

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

function extractJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
    if (fenced) return JSON.parse(fenced[1])
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1))
    throw new Error('התגובה מה-API אינה JSON תקין')
  }
}

function isRetryable(error) {
  const msg = error?.message || ''
  return msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand')
}

async function withRetry(fn) {
  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt < RETRIES && isRetryable(e)) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
        continue
      }
      throw e
    }
  }
  throw lastError
}

export function getModel() {
  return localStorage.getItem('academicflow_model') || DEFAULT_MODEL
}

export async function processDocument(file, apiKey) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('הקובץ גדול מדי — מקסימום 20MB')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: getModel(),
    systemInstruction: systemPromptText,
    generationConfig: {
      responseMimeType: 'application/json',
    },
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

  return withRetry(async () => {
    const result = await model.generateContent(parts)
    return extractJSON(result.response.text())
  })
}
