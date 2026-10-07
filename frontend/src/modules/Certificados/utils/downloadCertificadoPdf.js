import { safeCertificateFileName } from './certificadoFormatters.js'
import { DOCUMENT_FOOTER_TEXT } from '../../../shared/utils/documentFooter.js'

const FORMATS = { a4: 'a4', letter: 'letter' }
const PAGE_MARGIN_MM = 12.7
const FOOTER_MARGIN_BOTTOM = PAGE_MARGIN_MM
const FOOTER_LINE_Y_OFFSET = 3
const FOOTER_SPACE_MM = FOOTER_MARGIN_BOTTOM + FOOTER_LINE_Y_OFFSET + 3
const FOOTER_SIDE_MARGIN = PAGE_MARGIN_MM
const CONTINUATION_TOP_SPACE_MM = PAGE_MARGIN_MM

function drawFooter(pdf, pageWidth, pageHeight) {
  const footerY = pageHeight - FOOTER_MARGIN_BOTTOM
  const lineY = footerY - FOOTER_LINE_Y_OFFSET
  pdf.setDrawColor(79, 155, 211)
  pdf.setLineWidth(0.5)
  pdf.line(FOOTER_SIDE_MARGIN, lineY, pageWidth - FOOTER_SIDE_MARGIN, lineY)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.setTextColor(0, 0, 0)
  pdf.text(DOCUMENT_FOOTER_TEXT, pageWidth / 2, footerY, { align: 'center', maxWidth: pageWidth - FOOTER_SIDE_MARGIN * 2 })
}

function pageBreaks(previewElement, canvas, contentPixels, continuationTopSpacePixels) {
  const previewTop = previewElement.getBoundingClientRect().top
  const scale = canvas.width / previewElement.scrollWidth
  const itemsTable = previewElement.querySelector('.certificado-preview__items-table')
  const itemsHeader = itemsTable?.querySelector('thead')
  const itemsTableTop = itemsTable ? Math.round((itemsTable.getBoundingClientRect().top - previewTop) * scale) : null
  const itemsTableBottom = itemsTable ? Math.round((itemsTable.getBoundingClientRect().bottom - previewTop) * scale) : null
  const repeatedHeader = itemsHeader ? {
    top: Math.round((itemsHeader.getBoundingClientRect().top - previewTop) * scale),
    height: Math.round(itemsHeader.getBoundingClientRect().height * scale),
  } : null
  const boundaries = Array.from(previewElement.querySelectorAll('tr, .certificado-preview__warranty, .certificado-preview__signature'))
    .map((element) => Math.round((element.getBoundingClientRect().bottom - previewTop) * scale))
    .filter((position) => position > 0 && position < canvas.height)
    .sort((left, right) => left - right)
  const slices = []
  let start = 0

  while (start < canvas.height) {
    const repeatsItemsHeader = Boolean(repeatedHeader && start > itemsTableTop && start < itemsTableBottom)
    const topSpace = start > 0 ? continuationTopSpacePixels : 0
    const availablePixels = contentPixels - topSpace - (repeatsItemsHeader ? repeatedHeader.height : 0)
    const target = Math.min(start + availablePixels, canvas.height)
    const safeBoundary = boundaries.filter((position) => position > start && position <= target).pop()
    // Only split at a safe boundary when the remaining canvas needs another page.
    const end = target === canvas.height ? target : (safeBoundary || target)
    slices.push({ start, end, topSpace, repeatedHeader: repeatsItemsHeader ? { ...repeatedHeader, topSpace } : null })
    start = end
  }

  return slices
}

export async function downloadCertificadoPdf(certificado, previewElement) {
  if (!previewElement) throw new Error('No se encontró la vista previa')
  const [{ jsPDF }, canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
  const html2canvas = canvasModule.default || canvasModule
  const format = FORMATS[certificado.papel] || 'a4'
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  previewElement.classList.add('certificado-preview--export')
  try {
    const canvas = await html2canvas(previewElement, {
      backgroundColor: '#fff', logging: false, scale: 2, useCORS: true,
      width: previewElement.scrollWidth, height: previewElement.scrollHeight,
    })
    const pagePixels = Math.round(canvas.width * height / width)
    const contentPixels = Math.round(canvas.width * (height - FOOTER_SPACE_MM) / width)
    const continuationTopSpacePixels = Math.round(canvas.width * CONTINUATION_TOP_SPACE_MM / width)
    const slices = pageBreaks(previewElement, canvas, contentPixels, continuationTopSpacePixels)
    for (let index = 0; index < slices.length; index += 1) {
      const { start, end, topSpace, repeatedHeader } = slices[index]
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = pagePixels
      const context = pageCanvas.getContext('2d')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      const contentY = topSpace + (repeatedHeader ? repeatedHeader.height : 0)
      if (repeatedHeader) {
        context.drawImage(canvas, 0, repeatedHeader.top, canvas.width, repeatedHeader.height, 0, repeatedHeader.topSpace, canvas.width, repeatedHeader.height)
      }
      const contentHeight = end - start
      context.drawImage(canvas, 0, start, canvas.width, contentHeight, 0, contentY, canvas.width, contentHeight)
      if (index) pdf.addPage(format, 'portrait')
      pdf.addImage(pageCanvas.toDataURL('image/jpeg', .95), 'JPEG', 0, 0, width, height)
      drawFooter(pdf, width, height)
    }
    pdf.save(`${safeCertificateFileName(certificado.codigo)}.pdf`)
  } finally {
    previewElement.classList.remove('certificado-preview--export')
  }
}
