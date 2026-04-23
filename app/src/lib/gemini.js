import { GoogleGenerativeAI } from '@google/generative-ai'
import systemPromptText from '../../prompts/academic-flow.system.md?raw'
import {
  normalizeAcademicDocument,
  validateAcademicDocument,
} from './math.js'
import { extractPdfPages, isPdfFile, renderPdfPageImages } from './pdfText'
import { buildProcessingState, auditPipelineOutput, processSections } from './processPipeline'
import { buildSectionInputs, buildSourceOutline } from './sourceOutline'

const DEFAULT_MODEL = 'gemini-2.5-flash'

function fixBackslashes(text) {
  return text.replace(/\\([^"\\\/bfnrtu\d])/g, '\\\\$1')
}

function extractJSON(text) {
  try { return JSON.parse(text) } catch {}

  try { return JSON.parse(fixBackslashes(text)) } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (fenced) {
    try { return JSON.parse(fenced[1]) } catch {}
    try { return JSON.parse(fixBackslashes(fenced[1])) } catch {}
  }

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
    .replace(/<[^>]+>/g, '')
    .trim()
}

function sanitize(value) {
  if (typeof value === 'string') return sanitizeField(value)
  if (Array.isArray(value)) return value.map(sanitize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sanitize(nested)]))
  }
  return value
}

function normalizeWhitespace(text) {
  return (text || '').replace(/\r/g, '').trim()
}

export function normalizeModelText(text) {
  let normalized = normalizeWhitespace(text)

  normalized = normalized
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\begin\{align\*?\}/g, '\\begin{aligned}')
    .replace(/\\end\{align\*?\}/g, '\\end{aligned}')

  normalized = normalized.replace(
    /\$\$\s*\\begin\{aligned\}([\s\S]*?)\$\$\s*\\end\{aligned\}\s*\$\$/g,
    (_, body) => `$$\n\\begin{aligned}${body}\\end{aligned}\n$$`,
  )

  normalized = normalized.replace(
    /(^|[\n\r])\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}($|[\n\r])/g,
    (_, start, body, end) => `${start}$$\n\\begin{aligned}${body}\\end{aligned}\n$$${end}`,
  )

  normalized = normalized
    .replace(/\$\$\s*\n+/g, '$$\n')
    .replace(/\n+\s*\$\$/g, '\n$$')
    .replace(/\$\$\s*\$\$/g, '$$')

  return normalized.trim()
}

function getFallbackOutline(pages, fileName) {
  const firstLine = pages
    .flatMap(page => page.split('\n'))
    .map(line => normalizeWhitespace(line))
    .find(Boolean)

  const title = firstLine || fileName.replace(/\.[^.]+$/, '')
  const outline = [{ id: 'h1-1', level: 'H1', text: title, page: 1 }]

  pages.forEach((page, index) => {
    outline.push({
      id: `h2-${index + 1}`,
      level: 'H2',
      text: index === 0 ? title : `עמוד ${index + 1}`,
      page: index + 1,
    })
  })

  return outline
}

function getTitleFromOutline(outline, fileName) {
  const h1 = outline.find(item => item.level === 'H1')
  return h1?.text || fileName.replace(/\.[^.]+$/, '')
}

function buildSelectedPageInputs(pages, pageNumbers) {
  return pageNumbers.map((pageNumber) => ({
    id: `page-${pageNumber}`,
    level: 'H2',
    heading: `עמוד ${pageNumber}`,
    page: pageNumber,
    sourceText: pages[pageNumber - 1] || '',
  }))
}

async function extractSourcePages(file) {
  if (isPdfFile(file)) {
    return extractPdfPages(file)
  }

  const text = await file.text()
  return text
    .split(/\f+/)
    .map(page => normalizeWhitespace(page))
    .filter(Boolean)
}

function buildDocumentPrompt(section, attempt, mode = 'outline') {
  const scopeNote = mode === 'page'
    ? 'זהו עמוד PDF יחיד שנשלח למטרת דיבוג. הסתמך על התמונה המצורפת קודם, והשתמש בטקסט רק כעזר.'
    : 'זהו מקטע שנגזר ממבנה המסמך.'

  return `
הפק קטע לימוד יחיד בפורמט JSON תקין בלבד.

הקשר:
${scopeNote}

כותרת מקור מחייבת:
${section.heading}

רמת כותרת:
${section.level}

מספר ניסיון:
${attempt}

טקסט המקור למקטע:
${section.sourceText}

החזר אובייקט JSON יחיד בצורה:
{
  "header": "חייב להיות זהה בדיוק לכותרת המקור",
  "content": "הסבר עברי פורמלי, קריא, סריק, עם נוסחאות מתוחמות היטב",
  "common_mistakes": "טעויות נפוצות",
  "example": "דוגמה פתורה"
}

חוקים קשיחים:
- header חייב להיות בדיוק "${section.heading}"
- אין להמציא כותרת חדשה
- אין להשאיר אף שדה ריק
- כל LaTeX חייב להופיע בתוך $...$ או $$...$$ בלבד
- אין לחשוף \\begin, \\frac, \\sqrt או פקודות אחרות מחוץ לתוחמי מתמטיקה
- אם צורפה תמונת עמוד, היא מקור האמת למבנה המתמטי והטיפוגרפי
`.trim()
}

function normalizeSectionPayload(payload, section) {
  const candidate = payload?.sections?.[0] || payload

  return {
    header: section.heading,
    content: normalizeModelText(candidate?.content),
    common_mistakes: normalizeModelText(candidate?.common_mistakes),
    example: normalizeModelText(candidate?.example),
  }
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
  if (msg.includes('Section failed validation')) {
    return 'חלק מהמסמך נכשל בבדיקות שלמות או נוסחאות. נסה שוב לאחר תיקון ההגדרות או הקובץ.'
  }
  if (error instanceof SyntaxError || msg.includes('JSON') || msg.includes('אינה JSON')) {
    return 'הבינה המלאכותית החזירה תגובה שגויה לאחר מספר ניסיונות. נסה להעלות את הקובץ שוב.'
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('NetworkError')) {
    return 'שגיאת רשת — בדוק את החיבור לאינטרנט ונסה שוב.'
  }
  return 'שגיאה בעיבוד הקובץ — נסה שוב.'
}

export function getModel() {
  return localStorage.getItem('academicflow_model') || DEFAULT_MODEL
}

export async function processDocument(file, apiKey, options = {}) {
  const {
    onStatus = () => {},
    onAudit = () => {},
    pageNumbers = null,
  } = options

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('הקובץ גדול מדי — מקסימום 20MB')
  }

  const attemptLogs = []
  const pushStatus = (line) => {
    attemptLogs.push(line)
    onStatus(line)
  }

  try {
    const extractedPages = await extractSourcePages(file)
    const pages = Array.isArray(pageNumbers) && pageNumbers.length > 0
      ? pageNumbers.map(pageNumber => extractedPages[pageNumber - 1] || '').filter(Boolean)
      : extractedPages
    const usingSelectedPdfPages = isPdfFile(file) && Array.isArray(pageNumbers) && pageNumbers.length > 0
    const outline = usingSelectedPdfPages ? [] : buildSourceOutline(pages)
    const effectiveOutline = usingSelectedPdfPages
      ? [{ id: 'h1-1', level: 'H1', text: `${file.name} — עמודים ${pageNumbers.join(', ')}`, page: 1 }]
      : (outline.length > 0 ? outline : getFallbackOutline(pages, file.name))
    const title = getTitleFromOutline(effectiveOutline, file.name)
    const contentOutline = effectiveOutline.filter(item => item.level !== 'H1')
    const sectionInputs = usingSelectedPdfPages
      ? buildSelectedPageInputs(extractedPages, pageNumbers)
      : buildSectionInputs(pages, contentOutline.length > 0 ? contentOutline : effectiveOutline)
    const renderedPageImages = usingSelectedPdfPages
      ? await renderPdfPageImages(file, pageNumbers)
      : []
    const renderedPageImageMap = new Map(renderedPageImages.map(image => [image.pageNumber, image]))

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: getModel(),
      systemInstruction: systemPromptText,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const sections = await processSections({
      sections: sectionInputs,
      onStatus: pushStatus,
      generateSection: async (section, attempt) => {
        const pageImage = renderedPageImageMap.get(section.page)
        const parts = [buildDocumentPrompt(section, attempt, usingSelectedPdfPages ? 'page' : 'outline')]

        if (pageImage) {
          parts.unshift({
            inlineData: {
              mimeType: pageImage.mimeType,
              data: pageImage.data,
            },
          })
        }

        const result = await model.generateContent(parts)
        const payload = sanitize(extractJSON(result.response.text()))
        return normalizeSectionPayload(payload, section)
      },
    })

    const generated = {
      title,
      subject_meta: '',
      sections,
    }
    const normalized = normalizeAcademicDocument(generated)
    const validation = validateAcademicDocument(normalized)

    const audit = auditPipelineOutput({
      outline: effectiveOutline,
      generated: normalized,
    })

    const processingState = buildProcessingState({
      attempts: attemptLogs,
      audit,
    })

    onAudit([
      ...processingState.auditSummary,
      `Math validation errors: ${validation.errors.length}`,
      `Math validation warnings: ${validation.warnings.length}`,
    ])

    return normalized
  } catch (error) {
    throw new Error(toUserMessage(error))
  }
}
