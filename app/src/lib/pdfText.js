import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export function isPdfFile(file) {
  return file?.type === 'application/pdf' || file?.type === 'application/x-pdf' || file?.name?.toLowerCase().endsWith('.pdf')
}

function normalizeLine(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function groupItemsIntoLines(items) {
  const lines = []
  let currentLine = []
  let lastY = null

  for (const item of items) {
    if (!('str' in item)) continue
    const y = Math.round(item.transform[5])

    if (lastY !== null && Math.abs(lastY - y) > 4) {
      const lineText = normalizeLine(currentLine.map(part => part.str).join(' '))
      if (lineText) lines.push(lineText)
      currentLine = []
    }

    currentLine.push(item)
    lastY = y
  }

  const finalLine = normalizeLine(currentLine.map(part => part.str).join(' '))
  if (finalLine) lines.push(finalLine)

  return lines
}

export async function extractPdfPages(file) {
  const buffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  const pages = []

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex)
    const textContent = await page.getTextContent()
    const lines = groupItemsIntoLines(textContent.items)
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
