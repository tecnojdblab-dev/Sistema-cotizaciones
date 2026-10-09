import headerLogo from '../../../../images/cabezeralogo.webp'
import { DOCUMENT_FOOTER_TEXT } from '../../../shared/utils/documentFooter.js'
import { PAPER_SIZES } from '../domain/carta.js'
import { safeFileName } from './cartaFormatters.js'
import { paginateCartaCanvas } from './cartaPdfPagination.js'

/**
 * Converts an image source (URL or data-URI) to a data-URL string suitable
 * for jsPDF.addImage.  Uses a canvas to transcode to PNG.
 */
function imageToDataUrl(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d').drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => reject(new Error('No se pudo cargar la imagen del encabezado'))
    image.src = source
  })
}

/**
 * Measures the natural aspect ratio of an image and calculates the
 * placement dimensions to fit inside a bounding box.
 */
function fitImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      aspect: image.naturalWidth / image.naturalHeight,
    })
    image.onerror = () => reject(new Error('No se pudo medir la imagen del encabezado'))
    image.src = source
  })
}

/** Header and footer layout constants (in mm). */
const HEADER_MARGIN_TOP = 4
const HEADER_LOGO_MAX_WIDTH_MM = 43
const HEADER_LOGO_MAX_HEIGHT_MM = 20
const FOOTER_MARGIN_BOTTOM = 8
const FOOTER_LINE_Y_OFFSET = 3
const SIDE_MARGIN = 25
const HEADER_CONTENT_GAP = 5
const FOOTER_CONTENT_GAP = 4

/**
 * Draws the logo-only header on the current page of the PDF.
 */
function drawPageHeader(pdf, logoDataUrl, logoInfo) {
  if (!logoDataUrl || !logoInfo) return

  const scale = Math.min(
    HEADER_LOGO_MAX_WIDTH_MM / logoInfo.naturalWidth,
    HEADER_LOGO_MAX_HEIGHT_MM / logoInfo.naturalHeight,
  )
  const logoWidth = logoInfo.naturalWidth * scale
  const logoHeight = logoInfo.naturalHeight * scale

  pdf.addImage(logoDataUrl, 'PNG', SIDE_MARGIN, HEADER_MARGIN_TOP, logoWidth, logoHeight)
}

/**
 * Draws the footer text with a top border line on the current page.
 */
function drawPageFooter(pdf, pageWidth, pageHeight) {
  const footerY = pageHeight - FOOTER_MARGIN_BOTTOM
  const lineY = footerY - FOOTER_LINE_Y_OFFSET

  // Blue top border line
  pdf.setDrawColor(79, 155, 211)
  pdf.setLineWidth(0.5)
  pdf.line(SIDE_MARGIN, lineY, pageWidth - SIDE_MARGIN, lineY)

  // Footer text
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.setTextColor(0, 0, 0)
  const centerX = pageWidth / 2
  pdf.text(DOCUMENT_FOOTER_TEXT, centerX, footerY, { align: 'center', maxWidth: pageWidth - SIDE_MARGIN * 2 })
}

function getProtectedRanges(previewElement, scale) {
  const previewTop = previewElement.getBoundingClientRect().top
  const ranges = []
  const addRect = (rect) => {
    if (!rect.width || !rect.height) return
    ranges.push({
      top: Math.floor((rect.top - previewTop) * scale),
      bottom: Math.ceil((rect.bottom - previewTop) * scale),
    })
  }
  const walker = document.createTreeWalker(previewElement, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent.trim()) continue
    range.selectNodeContents(walker.currentNode)
    Array.from(range.getClientRects()).forEach(addRect)
  }
  previewElement.querySelectorAll('img, .carta-preview__signature').forEach((element) => {
    addRect(element.getBoundingClientRect())
  })
  return ranges
}

function createPageCanvas(sourceCanvas, sourceY, sourceHeight, fullPageHeight, topSpace) {
  const pageCanvas = document.createElement('canvas')
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = fullPageHeight
  const context = pageCanvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
  context.drawImage(
    sourceCanvas,
    0,
    sourceY,
    sourceCanvas.width,
    sourceHeight,
    0,
    topSpace,
    sourceCanvas.width,
    sourceHeight,
  )
  return pageCanvas
}

export async function downloadCartaPdf(carta, previewElement) {
  if (!previewElement) throw new Error('No se encontró la vista previa de la carta')

  const [{ jsPDF }, html2canvasModule, logoDataUrl, logoInfo] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
    imageToDataUrl(headerLogo),
    fitImage(headerLogo),
  ])
  const html2canvas = html2canvasModule.default || html2canvasModule
  const paper = PAPER_SIZES[carta.papel] || PAPER_SIZES.letter
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paper.format })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  previewElement.classList.add('carta-preview--export')
  try {
    const canvas = await html2canvas(previewElement, {
      backgroundColor: '#ffffff',
      logging: false,
      scale: 2,
      useCORS: true,
      width: previewElement.scrollWidth,
      height: previewElement.scrollHeight,
      windowWidth: previewElement.scrollWidth,
      windowHeight: previewElement.scrollHeight,
    })

    const pageHeightInPixels = Math.round(canvas.width * (pageHeight / pageWidth))
    const pixelsPerMm = canvas.width / pageWidth
    const canvasScale = canvas.width / previewElement.scrollWidth
    const bottomPadding = parseFloat(getComputedStyle(previewElement).paddingBottom) * canvasScale
    const pages = paginateCartaCanvas({
      contentHeight: Math.max(1, canvas.height - Math.floor(bottomPadding)),
      pageHeight: pageHeightInPixels,
      headerSpace: Math.ceil((HEADER_MARGIN_TOP + HEADER_LOGO_MAX_HEIGHT_MM + HEADER_CONTENT_GAP) * pixelsPerMm),
      footerSpace: Math.ceil((FOOTER_MARGIN_BOTTOM + FOOTER_LINE_Y_OFFSET + FOOTER_CONTENT_GAP) * pixelsPerMm),
      protectedRanges: getProtectedRanges(previewElement, canvasScale),
    })

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const { start, height, topSpace } = pages[pageIndex]
      const pageCanvas = createPageCanvas(canvas, start, height, pageHeightInPixels, topSpace)

      if (pageIndex > 0) pdf.addPage(paper.format, 'portrait')

      // Add the rendered content as background
      pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight)

      // Draw native header on every page (the HTML header is hidden during export)
      const headerBottom = HEADER_MARGIN_TOP + HEADER_LOGO_MAX_HEIGHT_MM
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pageWidth, headerBottom, 'F')
      drawPageHeader(pdf, logoDataUrl, logoInfo)

      // Draw native footer on every page
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, pageHeight - FOOTER_MARGIN_BOTTOM - FOOTER_LINE_Y_OFFSET - 2, pageWidth, FOOTER_MARGIN_BOTTOM + FOOTER_LINE_Y_OFFSET + 2, 'F')
      drawPageFooter(pdf, pageWidth, pageHeight)
    }

    pdf.save(`${safeFileName(carta.numero || carta.referencia)}.pdf`)
  } finally {
    previewElement.classList.remove('carta-preview--export')
  }
}
