import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export function isPdfFile(file) {
  return file?.type === 'application/pdf' || file?.type === 'application/x-pdf' || file?.name?.toLowerCase().endsWith('.pdf')
}

function normalizeLine(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function estimateItemFontSize(item) {
  // Prefer transform[0] (actual glyph scale) over item.height (line-box height)
  const fromTransform = Math.round(Math.abs(item.transform[0]))
  const fromHeight = Math.round(item.height || 0)
  // Use whichever is more plausible (non-zero and within a sane range)
  if (fromTransform >= 6 && fromTransform <= 144) return fromTransform
  if (fromHeight >= 6 && fromHeight <= 144) return fromHeight
  return 12
}

function isBoldFont(fontName) {
  return /bold|heavy|black/i.test(fontName || '')
}

function groupItemsIntoLines(items) {
  const lines = []
  let currentLine = []
  let lastY = null

  for (const item of items) {
    if (!('str' in item)) continue
    const y = Math.round(item.transform[5])

    if (lastY !== null && Math.abs(lastY - y) > 4) {
      if (currentLine.length > 0) lines.push(currentLine)
      currentLine = []
    }

    currentLine.push(item)
    lastY = y
  }

  if (currentLine.length > 0) lines.push(currentLine)
  return lines
}

/**
 * Compute the median font size across all lines on a page.
 * This gives us the "body text" baseline so we can detect headers
 * by relative size rather than a hard global threshold.
 */
function computeMedianFontSize(lineGroups) {
  const sizes = lineGroups
    .map(items => Math.max(...items.map(estimateItemFontSize)))
    .filter(s => s > 0)
    .sort((a, b) => a - b)
  if (sizes.length === 0) return 12
  const mid = Math.floor(sizes.length / 2)
  return sizes.length % 2 === 0
    ? Math.round((sizes[mid - 1] + sizes[mid]) / 2)
    : sizes[mid]
}

/**
 * A line earns a font hint only when it is:
 *   - At least 2pt larger than the page median (clear size step-up), OR
 *   - Bold AND at least 1pt larger than the median (bold body copy at same
 *     size as surrounding text does NOT get a hint).
 *
 * The hint is still prepended so the scoring heuristic can use it,
 * but the bar is now set relative to each page's own body text.
 */
function lineToText(lineItems, medianSize) {
  const text = normalizeLine(lineItems.map(item => item.str).join(' '))
  if (!text) return null

  const fontSize = Math.max(...lineItems.map(estimateItemFontSize))
  const bold = lineItems.some(item => isBoldFont(item.fontName))
  const base = medianSize ?? 12

  const sizeStep = fontSize - base
  const isLarger = sizeStep >= 2          // meaningfully bigger than body
  const isBoldAndBigger = bold && sizeStep >= 1  // bold only counts when also bigger

  if (isLarger || isBoldAndBigger) {
    return `[Size: ${fontSize}pt, Bold: ${bold}] ${text}`
  }
  return text
}

export async function extractPdfPages(file) {
  const buffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  const pages = []

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex)
    const textContent = await page.getTextContent()
    const lineGroups = groupItemsIntoLines(textContent.items)
    const medianSize = computeMedianFontSize(lineGroups)
    const lines = lineGroups.map(items => lineToText(items, medianSize)).filter(Boolean)
    pages.push(lines.join('\n').trim())
  }

  return pages
}

export async function getPdfPageCount(file) {
  const buffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  return pdf.numPages
}

function canvasToBase64(canvas) {
  const dataUrl = canvas.toDataURL('image/png')
  return dataUrl.split(',')[1]
}

export async function renderPdfPageImages(file, pageNumbers, scale = 2) {
  const buffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  const images = []

  for (const pageNumber of pageNumbers) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)

    await page.render({
      canvasContext: context,
      viewport,
    }).promise

    images.push({
      pageNumber,
      mimeType: 'image/png',
      data: canvasToBase64(canvas),
    })
  }

  return images
}
