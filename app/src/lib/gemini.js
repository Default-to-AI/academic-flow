import { GoogleGenerativeAI } from '@google/generative-ai'
import { jsonrepair } from 'jsonrepair'
import systemPromptText from '../../prompts/academic-flow.system.md?raw'
import {
  normalizeAcademicDocument,
  validateAcademicDocument,
} from './math.js'
import { extractPdfPages, isPdfFile, renderPdfPageImages } from './pdfText'
import {
  auditPipelineOutput,
  buildProcessingState,
  isAbortError,
  processSections,
  throwIfAborted,
} from './processPipeline'
import { buildSectionInputs, buildSourceOutline } from './sourceOutline'

const DEFAULT_MODEL = 'gemini-2.5-flash'

function extractJSON(text) {
  try { return JSON.parse(text) } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (fenced) {
    try { return JSON.parse(fenced[1]) } catch {}
    try { return JSON.parse(jsonrepair(fenced[1])) } catch {}
  }

  try { return JSON.parse(jsonrepair(text)) } catch {}

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(jsonrepair(text.slice(start, end + 1))) } catch {}
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

  // Upgrade inline $\begin{cases|aligned|matrix...}\end{...}$ to block $$
  normalized = normalized.replace(
    /(?<!\$)\$([^$]*\\begin\{(?:cases|aligned|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|align\*?)\}[\s\S]*?\\end\{(?:cases|aligned|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|align\*?)\}[^$]*?)\$(?!\$)/g,
    (_, inner) => `$$${inner}$$`,
  )

  // Wrap LaTeX blocks with LRM (U+200E) to force LTR rendering inside RTL flow
  normalized = normalized.replace(/\$\$([\s\S]*?)\$\$/g, (m) => `‎${m}‎`)
  normalized = normalized.replace(/\$([^$\n]+)\$/g, (m) => `‎${m}‎`)

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
  const raw = h1?.text || fileName.replace(/\.[^.]+$/, '')
  return raw.replace(/^\[Size: \d+pt, Bold: (?:true|false)\]\s*/, '')
}

function isSelectedPageNoise(line) {
  return /^\d+$/.test(line)
    || /^-\s*\d+\s*-$/.test(line)
    || /^עמוד\s+\d+$/i.test(line)
    || /^page\s+\d+$/i.test(line)
}

function getSelectedPageHeading(pageText) {
  const heading = (pageText || '')
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .find(line => line && !isSelectedPageNoise(line) && line.length <= 90)

  return heading || 'מקטע נבחר'
}

export function buildSelectedPageInputs(pages, pageNumbers) {
  return pageNumbers.map((pageNumber) => ({
    id: `page-${pageNumber}`,
    level: 'H2',
    heading: getSelectedPageHeading(pages[pageNumber - 1] || ''),
    page: pageNumber,
    sourceText: pages[pageNumber - 1] || '',
  }))
}

const MAX_PAGES_PER_SECTION = 2

function splitLargeSections(sectionInputs, allPages) {
  const totalPages = allPages.length
  const result = []

  sectionInputs.forEach((section, index) => {
    const nextSection = sectionInputs[index + 1]
    const nextPage = nextSection ? nextSection.page : totalPages + 1
    const pageSpan = nextPage - section.page

    if (pageSpan <= MAX_PAGES_PER_SECTION) {
      result.push(section)
      return
    }

    for (let pageNum = section.page; pageNum < nextPage && pageNum <= totalPages; pageNum += 1) {
      const pageText = allPages[pageNum - 1] || ''
      result.push({
        id: `${section.id}-p${pageNum}`,
        level: section.level,
        heading: pageNum === section.page ? section.heading : getSelectedPageHeading(pageText),
        page: pageNum,
        sourceText: pageText,
      })
    }
  })

  return result
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

function hasCIDFontGarbling(text) {
  const matches = (text || '').match(/[\u{1D400}-\u{1D7FF}]/gu)
  return matches !== null && matches.length > 10
}

function buildDocumentPrompt(section, attempt, mode = 'outline', errorContext = null) {
  const scopeNote = mode === 'page'
    ? 'זהו עמוד PDF. הסתמך על התמונה המצורפת קודם, והשתמש בטקסט רק כעזר.'
    : 'זהו מקטע שנגזר ממבנה המסמך.'

  const errorSection = Array.isArray(errorContext) && errorContext.length > 0
    ? `\nתיקון חובה — שגיאות מהניסיון הקודם:\n${errorContext.map(e => `- ${e}`).join('\n')}\n`
    : ''

  const cidWarning = hasCIDFontGarbling(section.sourceText)
    ? '\nאזהרה: הטקסט המקור מכיל תווי OCR פגומים (CID font encoding). השתמש בתמונת העמוד כמקור האמת היחיד לנוסחאות, משתנים ומבנה. התעלם מרצפי תווים מוזרים בטקסט.\n'
    : ''

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
${cidWarning}${errorSection}
טקסט המקור למקטע:
${section.sourceText}

החזר אובייקט JSON יחיד בצורה:
{
  "header": "חייב להיות זהה בדיוק לכותרת המקור",
  "body": "תוכן מלא של הקטע — markdown עברי חופשי. השתמש בכותרות ### לתתי-נושא, רשימות, נוסחאות ומבנה המתאים לחומר. אל תכפה מבנה קבוע."
}

חוקים קשיחים:
- header חייב להיות בדיוק "${section.heading}"
- אין להמציא כותרת חדשה
- אין להשאיר body ריק
- כל LaTeX חייב להופיע בתוך $...$ או $$...$$ בלבד
- אין לחשוף \\begin, \\frac, \\sqrt או פקודות אחרות מחוץ לתוחמי מתמטיקה
- escaping ב-JSON: כל backslash ב-LaTeX חייב להיות כפול — כתוב \\\\frac ולא \\frac, \\\\begin ולא \\begin
- אם צורפה תמונת עמוד, היא מקור האמת למבנה המתמטי והטיפוגרפי
`.trim()
}

function normalizeSectionPayload(payload, section) {
  const candidate = payload?.sections?.[0] || payload

  return {
    header: section.heading,
    body: normalizeModelText(candidate?.body),
    _page: section.page,
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

async function buildSectionInputPlan(file, options = {}) {
  const { pageNumbers = null, signal = null } = options

  throwIfAborted(signal)
  const extractedPages = await extractSourcePages(file)
  throwIfAborted(signal)

  const pages = Array.isArray(pageNumbers) && pageNumbers.length > 0
    ? pageNumbers.map(n => extractedPages[n - 1] || '').filter(Boolean)
    : extractedPages
  const usingSelectedPdfPages = isPdfFile(file) && Array.isArray(pageNumbers) && pageNumbers.length > 0
  const selectedPageInputs = usingSelectedPdfPages
    ? buildSelectedPageInputs(extractedPages, pageNumbers)
    : null
  const outline = usingSelectedPdfPages ? [] : buildSourceOutline(pages)
  const outlineHasContentSections = outline.some(item => item.level !== 'H1')
  const effectiveOutline = usingSelectedPdfPages
    ? [
        { id: 'h1-1', level: 'H1', text: `${file.name} — עמודים ${pageNumbers.join(', ')}`, page: 1 },
        ...selectedPageInputs.map(section => ({
          id: section.id,
          level: 'H2',
          text: section.heading,
          page: section.page,
        })),
      ]
    : (outlineHasContentSections ? outline : getFallbackOutline(pages, file.name))
  const title = getTitleFromOutline(effectiveOutline, file.name)
  const contentOutline = effectiveOutline.filter(item => item.level !== 'H1')
  const rawSectionInputs = usingSelectedPdfPages
    ? selectedPageInputs
    : buildSectionInputs(pages, contentOutline.length > 0 ? contentOutline : effectiveOutline)

  const sectionInputs = (!usingSelectedPdfPages && isPdfFile(file))
    ? splitLargeSections(rawSectionInputs, extractedPages)
    : rawSectionInputs

  return { title, sectionInputs, effectiveOutline }
}

export async function previewDocument(file, options = {}) {
  const { pageNumbers = null, signal = null } = options
  if (file.size > 20 * 1024 * 1024) throw new Error('הקובץ גדול מדי — מקסימום 20MB')
  return buildSectionInputPlan(file, { pageNumbers, signal })
}

export async function processDocument(file, apiKey, options = {}) {
  const {
    onStatus = () => {},
    onAudit = () => {},
    onDebug = () => {},
    pageNumbers = null,
    signal = null,
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
    const { title, sectionInputs, effectiveOutline } = await buildSectionInputPlan(file, { pageNumbers, signal })

    const pagesToRender = isPdfFile(file)
      ? [...new Set(sectionInputs.map(s => s.page))]
      : []
    throwIfAborted(signal)
    const renderedPageImages = pagesToRender.length > 0
      ? await renderPdfPageImages(file, pagesToRender)
      : []
    throwIfAborted(signal)
    const renderedPageImageMap = new Map(renderedPageImages.map(image => [image.pageNumber, image]))

    const genAI = new GoogleGenerativeAI(apiKey)
    const sectionSchema = {
      type: 'object',
      properties: {
        header: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['header', 'body'],
    }

    const model = genAI.getGenerativeModel({
      model: getModel(),
      systemInstruction: systemPromptText,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: sectionSchema,
        temperature: 0,
      },
    })

    // Track which pages have already had their image consumed by a section.
    // Only the FIRST section on a given page gets the page image; subsequent
    // sections on the same page use outline (sourceText-only) mode.  Without
    // this guard every co-page section sees the same full-page image and the
    // AI regenerates the entire page content for each one, producing duplicates.
    const pagesUsedForImage = new Set()

    const sectionsToProcess = sectionInputs.map((section) => ({
      ...section,
      pageImage: renderedPageImageMap.get(section.page) || null,
    }))

    const sections = await processSections({
      sections: sectionsToProcess,
      onStatus: pushStatus,
      generateSection: async (section, attempt, errorContext) => {
        throwIfAborted(signal)
        const pageImage = renderedPageImageMap.get(section.page)
        const canUseImage = pageImage && !pagesUsedForImage.has(section.page)
        if (canUseImage) pagesUsedForImage.add(section.page)
        const mode = canUseImage ? 'page' : 'outline'
        const parts = [buildDocumentPrompt(section, attempt, mode, errorContext)]

        if (canUseImage) {
          parts.unshift({
            inlineData: {
              mimeType: pageImage.mimeType,
              data: pageImage.data,
            },
          })
        }

        const result = await model.generateContent(parts, { signal })
        throwIfAborted(signal)
        const payload = sanitize(extractJSON(result.response.text()))
        return normalizeSectionPayload(payload, section)
      },
      signal,
    })
    throwIfAborted(signal)

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

    onDebug({ validation, doc: normalized })

    return normalized
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) {
      throw error
    }

    throw new Error(toUserMessage(error))
  }
}
