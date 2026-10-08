import { formatCertificateDate, safeCertificateFileName, sanitizeCertificateHtml } from './certificadoFormatters.js'
import { createDocumentWordFooter } from '../../../shared/utils/documentFooter.js'

const BLUE = '82DDF5'
const borders = { top: { style: 'single', size: 8 }, bottom: { style: 'single', size: 8 }, left: { style: 'single', size: 8 }, right: { style: 'single', size: 8 }, insideHorizontal: { style: 'single', size: 8 }, insideVertical: { style: 'single', size: 8 } }
const JDBLAB_STAMP_SIZE = Object.freeze({
  width: Math.round(4.5 * 96 / 2.54),
  height: Math.round(1.8 * 96 / 2.54),
})

function text(docx, value, options = {}) {
  return new docx.TextRun({ text: String(value || ''), font: 'Arial', size: 20, ...options })
}
function paragraph(docx, value, options = {}) {
  return new docx.Paragraph({ children: [text(docx, value, options.run)], alignment: options.alignment, spacing: options.spacing || { after: 0 } })
}
function cell(docx, children, options = {}) {
  return new docx.TableCell({ children: Array.isArray(children) ? children : [paragraph(docx, children, options)], shading: options.blue ? { fill: BLUE } : undefined, columnSpan: options.columnSpan, rowSpan: options.rowSpan, width: options.width ? { size: options.width, type: docx.WidthType.PERCENTAGE } : undefined, verticalAlign: docx.VerticalAlign.CENTER })
}
function conditionParagraphs(docx, html) {
  const element = document.createElement('div')
  element.innerHTML = sanitizeCertificateHtml(html)
  const blocks = []
  let runs = []
  const flush = () => {
    if (runs.length) blocks.push(runs)
    runs = []
  }
  const visit = (node, formatting = { italics: true }) => {
    if (node.nodeType === 3) {
      if (node.textContent.trim() || runs.length) runs.push(text(docx, node.textContent, formatting))
      return
    }
    if (node.nodeType !== 1) return
    const tag = node.tagName
    if (tag === 'BR') {
      runs.push(new docx.TextRun({ break: 1 }))
      return
    }
    const isBlock = ['P', 'DIV', 'LI', 'UL', 'OL'].includes(tag)
    if (isBlock) flush()
    const next = { ...formatting }
    if (tag === 'B' || tag === 'STRONG') next.bold = true
    if (tag === 'I' || tag === 'EM') next.italics = true
    if (tag === 'U') next.underline = {}
    if (tag === 'S') next.strike = true
    node.childNodes.forEach((child) => visit(child, next))
    if (isBlock) flush()
  }
  element.childNodes.forEach((node) => visit(node))
  flush()
  if (!blocks.length) return [paragraph(docx, '')]
  return blocks.map((children, index) => new docx.Paragraph({
    children,
    alignment: docx.AlignmentType.JUSTIFIED,
    spacing: { after: index < blocks.length - 1 ? 160 : 0 },
  }))
}
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo procesar una imagen del certificado'))
    image.src = source
  })
}
async function imageRun(source, docx, maxWidth, maxHeight, exactSize) {
  if (!source) return null
  const image = await loadImage(source)
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
  const width = exactSize?.width || Math.max(1, Math.round(image.naturalWidth * scale))
  const height = exactSize?.height || Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  canvas.getContext('2d').drawImage(image, 0, 0)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo convertir una imagen del certificado')

  return new docx.ImageRun({ type: 'png', data: await blob.arrayBuffer(), transformation: { width, height } })
}
function download(blob, name) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function downloadCertificadoWord(certificado, logoSource) {
  const docx = await import('docx')
  const logo = await imageRun(logoSource, docx, 150, 65)
  const signatureMaxSize = certificado.empresaFirmante
    ? { width: 170, height: 80 }
    : { width: 150, height: 70 }
  const signature = await imageRun(
    certificado.firmaImagen,
    docx,
    signatureMaxSize.width,
    signatureMaxSize.height,
  )
  const stampSize = certificado.empresaFirmante === 'jdblab' ? JDBLAB_STAMP_SIZE : undefined
  const stamp = await imageRun(certificado.selloImagen, docx, 150, 80, stampSize)
  const header = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders, rows: [
    new docx.TableRow({ children: [cell(docx, [new docx.Paragraph({ children: logo ? [logo] : [], alignment: docx.AlignmentType.CENTER })], { rowSpan: 3, width: 22 }), cell(docx, [paragraph(docx, 'SISTEMA DE GESTIÓN DE LA CALIDAD', { alignment: docx.AlignmentType.CENTER, run: { bold: true, size: 24 } })], { width: 48 }), cell(docx, 'Código', { width: 12 }), cell(docx, certificado.codigo, { width: 18 })] }),
    new docx.TableRow({ children: [cell(docx, 'REGISTRO'), cell(docx, 'Revisión'), cell(docx, certificado.revision)] }),
    new docx.TableRow({ children: [cell(docx, 'CERTIFICADO DE GARANTÍA'), cell(docx, 'Página'), cell(docx, '1 de 1')] }),
  ] })
  const info = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders, rows: [
    new docx.TableRow({ children: [cell(docx, 'CLIENTE O ENTIDAD CONTRATANTE:', { blue: true, width: 39 }), cell(docx, certificado.clienteEntidad, { width: 61 })] }),
    new docx.TableRow({ children: [cell(docx, 'OBJETO DE LA CONTRATACIÓN:', { blue: true, width: 39 }), cell(docx, certificado.objetoContratacion, { width: 61 })] }),
    new docx.TableRow({ children: [cell(docx, [paragraph(docx, `TIEMPO DE GARANTÍA ${certificado.garantiaAnos} AÑO${certificado.garantiaAnos === 1 ? '' : 'S'}`, { alignment: docx.AlignmentType.CENTER, run: { bold: true } })], { blue: true, columnSpan: 2 })] }),
    new docx.TableRow({ children: [cell(docx, `DESDE: ${formatCertificateDate(certificado.fechaDesde)}`), cell(docx, `HASTA: ${formatCertificateDate(certificado.fechaHasta)}`)] }),
  ] })
  const items = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders, rows: [
    new docx.TableRow({ tableHeader: true, children: ['ÍTEM', 'DESCRIPCIÓN', 'CANTIDAD', 'ACLARACIONES'].map((value) => cell(docx, value, { blue: true })) }),
    ...(certificado.items || []).map((item, index) => new docx.TableRow({ children: [
      cell(docx, String(index + 1)),
      cell(docx, [
        paragraph(docx, item.descripcion, { run: { bold: true } }),
        paragraph(docx, `MARCA: ${item.marca || '-'}  MODELO: ${item.modelo || '-'}`),
      ]),
      cell(docx, String(item.cantidad)),
      cell(docx, item.aclaraciones),
    ] })),
  ] })
  const warranty = new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    borders,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    rows: [
      new docx.TableRow({ children: [cell(docx, 'CERTIFICADO DE GARANTÍA', { blue: true, alignment: docx.AlignmentType.CENTER })] }),
      new docx.TableRow({ children: [cell(docx, conditionParagraphs(docx, certificado.condicionesHtml))] }),
    ],
  })
  const children = [header, paragraph(docx, '', { spacing: { after: 120 } }), info, paragraph(docx, '1.  DESCRIPCIÓN DE LA ENTREGA.', { spacing: { before: 240, after: 160 }, run: { bold: true } }), items, paragraph(docx, '', { spacing: { after: 120 } }), warranty]
  if (signature) children.push(new docx.Paragraph({ children: [signature], alignment: docx.AlignmentType.CENTER, spacing: { before: 180 } }))
  const signerLines = [
    { value: certificado.firmanteNombre?.toUpperCase(), bold: true },
    { value: certificado.firmanteCargo },
    { value: certificado.firmanteDocumento },
    { value: certificado.firmanteTelefono },
  ].filter((item) => item.value)
  signerLines.forEach((item) => {
    children.push(paragraph(docx, item.value, {
      alignment: docx.AlignmentType.CENTER,
      run: { bold: item.bold },
    }))
  })
  if (stamp) children.push(new docx.Paragraph({ children: [stamp], alignment: docx.AlignmentType.CENTER, spacing: { before: 80 } }))
  const file = new docx.Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: docx.convertMillimetersToTwip(certificado.papel === 'letter' ? 215.9 : 210),
            height: docx.convertMillimetersToTwip(certificado.papel === 'letter' ? 279.4 : 297),
          },
          margin: { top: 900, right: 900, bottom: 1360, left: 900, footer: 454 },
        },
      },
      footers: { default: createDocumentWordFooter(docx) },
      children,
    }],
  })
  download(await docx.Packer.toBlob(file), `${safeCertificateFileName(certificado.codigo)}.docx`)
}
