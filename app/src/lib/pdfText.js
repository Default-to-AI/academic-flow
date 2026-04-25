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

/**
 * Group PDF items into lines using Y-coordinate proximity.
 * Uses a two-pass approach:
 *   Pass 1 – split by Y gaps > 4px (tight, catches subscripts as separate groups)
 *   Pass 2 – merge any group where ALL items are sub/superscript-sized
 *             (smaller than the body median) into the nearest preceding full line.
 * This prevents '𝑥 → 0' subscript rows, lone '1', '7' fraction fragments, etc.
 * from becoming isolated lines that the section scorer mislabels as headings.
 */
function groupItemsIntoLines(items, medianSize) {
  // --- Pass 1: split by Y proximity ---
  const rawGroups = []
  let currentGroup = []
  let lastY = null

  for (const item of items) {
    if (!('str' in item)) continue
    const y = Math.round(item.transform[5])
    if (lastY !== null && Math.abs(lastY - y) > 4) {
      if (currentGroup.length > 0) rawGroups.push({ items: currentGroup, y: lastY })
      currentGroup = []
    }
    currentGroup.push(item)
    lastY = y
  }
  if (currentGroup.length > 0) rawGroups.push({ items: currentGroup, y: lastY })

  // --- Pass 2: merge sub/superscript-only rows into parent ---
  const base = medianSize ?? 12
  const merged = []

  for (const group of rawGroups) {
    const maxSize = Math.max(...group.items.map(estimateItemFontSize))
    const isSubSuperOnly = maxSize < base - 1   // clearly smaller than body text

    if (isSubSuperOnly && merged.length > 0) {
      // Attach to the last real line (it's a subscript/superscript row)
      merged[merged.length - 1].push(...group.items)
    } else {
      merged.push([...group.items])
    }
  }

  return merged
}

/**
 * Compute the median font size across all raw items on a page.
 * Done before line grouping so we have the baseline to classify sub/superscripts.
 */
function computeMedianFontSize(items) {
  const sizes = items
    .filter(item => 'str' in item && item.str.trim())
    .map(estimateItemFontSize)
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
 *   - Bold AND at least 1pt larger than the median.
 * Bold body copy at the same size as surrounding text does NOT get a hint.
 */
function lineToText(lineItems, medianSize) {
  const text = normalizeLine(lineItems.map(item => item.str).join(' '))
  if (!text) return null

  const fontSize = Math.max(...lineItems.map(estimateItemFontSize))
  const bold = lineItems.some(item => isBoldFont(item.fontName))
  const base = medianSize ?? 12

  const sizeStep = fontSize - base
  const isLarger = sizeStep >= 2
  const isBoldAndBigger = bold && sizeStep >= 1

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
    const medianSize = computeMedianFontSize(textContent.items)
    const lineGroups = groupItemsIntoLines(textContent.items, medianSize)
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

export async function renderPdfPageImages(file, pageNumbers, scale = 3) {
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
