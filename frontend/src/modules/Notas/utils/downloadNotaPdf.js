import { safeNotaFileName } from './notaFormatters.js'
import { DOCUMENT_FOOTER_TEXT } from '../../../shared/utils/documentFooter.js'

const PAGE_MARGIN_MM = 12.7
const FOOTER_MARGIN_BOTTOM = PAGE_MARGIN_MM
const FOOTER_LINE_Y_OFFSET = 3
const FOOTER_SPACE_MM = FOOTER_MARGIN_BOTTOM + FOOTER_LINE_Y_OFFSET + 3
const FOOTER_SIDE_MARGIN = PAGE_MARGIN_MM
const CONTINUATION_TOP_SPACE_MM = PAGE_MARGIN_MM
const REPEATED_HEADER_GAP_MM = 6

function drawFooter(pdf, pageWidth, pageHeight) {
  const footerY = pageHeight - FOOTER_MARGIN_BOTTOM
  const lineY = footerY - FOOTER_LINE_Y_OFFSET
  pdf.setDrawColor(79, 155, 211)
  pdf.setLineWidth(0.5)
  pdf.line(FOOTER_SIDE_MARGIN, lineY, pageWidth - FOOTER_SIDE_MARGIN, lineY)
  pdf.setFont('Helvetica', 'bold')
   pdf.setFontSize(9)
   pdf.setTextColor(117, 117, 117)
   pdf.text(DOCUMENT_FOOTER_TEXT, pageWidth / 2, footerY, { align: 'center', maxWidth: pageWidth - FOOTER_SIDE_MARGIN * 2 })
}

function pageBreaks(previewElement, canvas, contentPixels, continuationTopSpacePixels, pageWidthMm) {
  const previewTop = previewElement.getBoundingClientRect().top
  const scale = canvas.width / previewElement.scrollWidth
  const itemsTable = previewElement.querySelector('.nota-preview__items-table')
  const itemsHeader = itemsTable?.querySelector('thead')
  const documentHeader = previewElement.querySelector('.nota-preview__header-table')
  const itemsTableTop = itemsTable ? Math.round((itemsTable.getBoundingClientRect().top - previewTop) * scale) : null
  const itemsTableBottom = itemsTable ? Math.round((itemsTable.getBoundingClientRect().bottom - previewTop) * scale) : null
  const pageCell = documentHeader?.querySelector('tr:last-child td:last-child')
  const repeatedDocumentHeader = documentHeader ? {
    top: Math.round((documentHeader.getBoundingClientRect().top - previewTop) * scale),
    height: Math.round(documentHeader.getBoundingClientRect().height * scale),
    pageCell: pageCell ? {
      x: Math.round((pageCell.getBoundingClientRect().left - previewElement.getBoundingClientRect().left) * scale),
      y: Math.round((pageCell.getBoundingClientRect().top - previewTop) * scale),
      width: Math.round(pageCell.getBoundingClientRect().width * scale),
      height: Math.round(pageCell.getBoundingClientRect().height * scale),
    } : null,
  } : null
  const repeatedDocumentHeaderGap = Math.round(canvas.width * REPEATED_HEADER_GAP_MM / pageWidthMm)
  const repeatedHeader = itemsHeader ? {
    top: Math.round((itemsHeader.getBoundingClientRect().top - previewTop) * scale),
    height: Math.round(itemsHeader.getBoundingClientRect().height * scale),
  } : null
  const boundaries = Array.from(previewElement.querySelectorAll('tr, .nota-preview__signatures'))
    .map((element) => Math.round((element.getBoundingClientRect().bottom - previewTop) * scale))
    .filter((position) => position > 0 && position < canvas.height)
    .sort((left, right) => left - right)
  const slices = []
  let start = 0

  while (start < canvas.height) {
    const repeatsItemsHeader = Boolean(repeatedHeader && start > itemsTableTop && start < itemsTableBottom)
    const topSpace = start > 0 ? continuationTopSpacePixels : 0
    const repeatsDocumentHeader = Boolean(repeatedDocumentHeader && start > 0)
    const availablePixels = Math.max(1, contentPixels - topSpace
      - (repeatsDocumentHeader ? repeatedDocumentHeader.height : 0)
      - (repeatsDocumentHeader ? repeatedDocumentHeaderGap : 0)
      - (repeatsItemsHeader ? repeatedHeader.height : 0))
    const target = Math.min(start + availablePixels, canvas.height)
    const safeBoundary = boundaries.filter((position) => position > start && position <= target).pop()
    // Only split at a safe boundary when the remaining canvas needs another page.
    const end = target === canvas.height ? target : (safeBoundary || target)
    slices.push({
      start,
      end,
      topSpace,
      repeatedDocumentHeaderGap: repeatsDocumentHeader ? repeatedDocumentHeaderGap : 0,
      repeatedDocumentHeader: repeatsDocumentHeader ? { ...repeatedDocumentHeader, topSpace } : null,
      repeatedHeader: repeatsItemsHeader ? { ...repeatedHeader, topSpace } : null,
    })
    start = end
  }

  return { slices, documentHeaderBounds: repeatedDocumentHeader }
}

function drawPageNumber(context, headerBounds, page, total, topOffset = 0) {
  const pageCell = headerBounds?.pageCell
  if (!pageCell) return

  const { x, y, width, height } = pageCell
  context.fillStyle = '#fff'
  context.fillRect(x + 2, y + topOffset + 2, width - 4, height - 4)
  context.fillStyle = '#222'
  const label = `${page} de ${total}`
  let fontSize = Math.max(12, Math.round(height * 0.36))
  context.font = `${fontSize}px Arial`
  while (fontSize > 12 && context.measureText(label).width > width - 12) {
    fontSize -= 1
    context.font = `${fontSize}px Arial`
  }
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, x + width / 2, y + topOffset + height / 2)
}

export async function downloadNotaPdf(nota, previewElement) {
  if (!previewElement) throw new Error('No se encontró la vista previa de la nota')
  const [{ jsPDF }, canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
  const html2canvas = canvasModule.default || canvasModule
  const format = nota.papel === 'a4' ? 'a4' : 'letter'
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  previewElement.classList.add('nota-preview--export')
  try {
    await document.fonts?.ready
    await Promise.all(Array.from(previewElement.querySelectorAll('img'), (image) => (
      image.decode ? image.decode().catch(() => undefined) : Promise.resolve()
    )))
    const canvas = await html2canvas(previewElement, {
      backgroundColor: '#fff',
      scale: 3,
      useCORS: true,
      logging: false,
      width: previewElement.scrollWidth,
      height: previewElement.scrollHeight,
    })
    const pagePixels = Math.round(canvas.width * pageHeight / pageWidth)
    const contentPixels = Math.round(canvas.width * (pageHeight - FOOTER_SPACE_MM) / pageWidth)
    const continuationTopSpacePixels = Math.round(canvas.width * CONTINUATION_TOP_SPACE_MM / pageWidth)
    const { slices, documentHeaderBounds } = pageBreaks(previewElement, canvas, contentPixels, continuationTopSpacePixels, pageWidth)
    for (let index = 0; index < slices.length; index += 1) {
      const { start, end, topSpace, repeatedDocumentHeader, repeatedDocumentHeaderGap, repeatedHeader } = slices[index]
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = pagePixels
      const context = slice.getContext('2d')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, slice.width, slice.height)
      const contentY = topSpace
        + (repeatedDocumentHeader ? repeatedDocumentHeader.height : 0)
        + repeatedDocumentHeaderGap
        + (repeatedHeader ? repeatedHeader.height : 0)
      if (repeatedDocumentHeader) {
        context.drawImage(canvas, 0, repeatedDocumentHeader.top, canvas.width, repeatedDocumentHeader.height, 0, repeatedDocumentHeader.topSpace, canvas.width, repeatedDocumentHeader.height)
      }
      if (repeatedHeader) {
        context.drawImage(canvas, 0, repeatedHeader.top, canvas.width, repeatedHeader.height, 0, topSpace + (repeatedDocumentHeader ? repeatedDocumentHeader.height : 0) + repeatedDocumentHeaderGap, canvas.width, repeatedHeader.height)
      }
      const height = end - start
      context.drawImage(canvas, 0, start, canvas.width, height, 0, contentY, canvas.width, height)
      const pageNumberTopOffset = repeatedDocumentHeader
        ? repeatedDocumentHeader.topSpace - repeatedDocumentHeader.top
        : 0
      drawPageNumber(context, documentHeaderBounds, index + 1, slices.length, pageNumberTopOffset)
      if (index) pdf.addPage(format, 'portrait')
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight)
      drawFooter(pdf, pageWidth, pageHeight)
    }
    pdf.save(`${safeNotaFileName(nota.numero ? `nota-${nota.numero}` : 'nota-entrega')}.pdf`)
  } finally {
    previewElement.classList.remove('nota-preview--export')
  }
}
