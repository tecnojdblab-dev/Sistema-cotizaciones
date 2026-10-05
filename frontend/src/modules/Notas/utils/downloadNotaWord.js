import logoJdblab from '../../../../images/logojdblab.jpeg.png'
import { FIRMANTE_PRESETS } from '../../../shared/utils/firmantePresets.js'
import { createDocumentWordFooter } from '../../../shared/utils/documentFooter.js'
import { getNotaTotal } from '../domain/nota.js'
import { formatMoney, formatMoneyInWords, formatNotaDate, safeNotaFileName } from './notaFormatters.js'

const BLUE = '80DDF4'
const borders = { top: { style: 'single', size: 8 }, bottom: { style: 'single', size: 8 }, left: { style: 'single', size: 8 }, right: { style: 'single', size: 8 }, insideHorizontal: { style: 'single', size: 8 }, insideVertical: { style: 'single', size: 8 } }

function text(docx, value, options = {}) {
  return new docx.TextRun({ text: String(value || ''), font: 'Arial', size: 18, ...options })
}

function paragraph(docx, value, options = {}) {
  return new docx.Paragraph({ children: [text(docx, value, options.run)], alignment: options.alignment, spacing: options.spacing || { after: 0 } })
}

function cell(docx, children, options = {}) {
  return new docx.TableCell({
    children: Array.isArray(children) ? children : [paragraph(docx, children, options)],
    borders,
    shading: options.blue ? { fill: BLUE } : undefined,
    columnSpan: options.columnSpan,
    rowSpan: options.rowSpan,
    width: options.width ? { size: options.width, type: docx.WidthType.PERCENTAGE } : undefined,
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo procesar una imagen de la nota'))
    image.src = source
  })
}

async function imageRun(source, docx, maxWidth, maxHeight) {
  if (!source) return null
  const image = await loadImage(source)
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  canvas.getContext('2d').drawImage(image, 0, 0)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo convertir una imagen de la nota')
  return new docx.ImageRun({ type: 'png', data: await blob.arrayBuffer(), transformation: { width: Math.max(1, Math.round(image.naturalWidth * scale)), height: Math.max(1, Math.round(image.naturalHeight * scale)) } })
}

function download(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function downloadNotaWord(nota) {
  const docx = await import('docx')
  const preset = FIRMANTE_PRESETS[nota.empresaEntregadoPor]
  const [logo, firmaEntregado, sello, firmaRecibido] = await Promise.all([
    imageRun(logoJdblab, docx, 145, 65),
    imageRun(nota.entregadoFirma, docx, 130, 60),
    imageRun(nota.ocultarSello ? '' : nota.entregadoSello || preset?.selloImagen, docx, 85, 60),
    imageRun(nota.recibidoFirma, docx, 130, 60),
  ])
  const header = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders, rows: [
    new docx.TableRow({ children: [cell(docx, [new docx.Paragraph({ children: logo ? [logo] : [], alignment: docx.AlignmentType.CENTER })], { rowSpan: 4, width: 28 }), cell(docx, [paragraph(docx, 'SISTEMA DE GESTIÓN DE CALIDAD', { alignment: docx.AlignmentType.CENTER, run: { bold: true, size: 20 } })], { width: 46 }), cell(docx, 'Código:', { width: 11 }), cell(docx, nota.codigo, { width: 15 })] }),
    new docx.TableRow({ children: [cell(docx, 'REGISTRO', { run: { bold: true }, alignment: docx.AlignmentType.CENTER }), cell(docx, 'Revisión:'), cell(docx, nota.revision)] }),
    new docx.TableRow({ children: [cell(docx, 'NOTA DE ENTREGA Y VERIFICACIÓN DE COMPONENTES', { run: { bold: true }, alignment: docx.AlignmentType.CENTER }), cell(docx, 'Página:'), cell(docx, '1') ] }),
    new docx.TableRow({ children: [cell(docx, 'N.º de nota:'), cell(docx, nota.numero, { columnSpan: 2 })] }),
  ] })
  const info = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders, rows: [
    ['CLIENTE O ENTIDAD CONTRATANTE:', nota.clienteEntidad],
    ['INSTITUCIÓN:', nota.institucion],
    ['OBJETO DE LA CONTRATACIÓN:', nota.objetoContratacion],
    ['LUGAR DE ENTREGA:', nota.lugarEntrega],
    ['FECHA DE ENTREGA:', formatNotaDate(nota.fechaEntrega)],
  ].map(([label, value]) => new docx.TableRow({ children: [cell(docx, label, { blue: true, width: 34, run: { bold: true } }), cell(docx, value, { width: 66 })] })) })
  const items = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders, rows: [
    new docx.TableRow({ tableHeader: true, children: [['ÍTEM', 6], ['EQUIPO Y DESCRIPCIÓN', 40], ['CÓDIGO', 10], ['N.º DE SERIE', 13], ['CANT.', 7], ['P. UNITARIO\nBs', 13], ['TOTAL Bs', 11]].map(([value, width]) => cell(docx, value, { blue: true, width, run: { bold: true }, alignment: docx.AlignmentType.CENTER })) }),
    ...(nota.items || []).map((item, index) => new docx.TableRow({ children: [
      cell(docx, String(index + 1), { alignment: docx.AlignmentType.CENTER }),
      cell(docx, [paragraph(docx, item.nombre, { run: { bold: true } }), paragraph(docx, item.descripcion)]),
      cell(docx, item.codigo, { alignment: docx.AlignmentType.CENTER }),
      cell(docx, item.numeroSerie, { alignment: docx.AlignmentType.CENTER }),
      cell(docx, String(item.cantidad), { alignment: docx.AlignmentType.CENTER }),
      cell(docx, formatMoney(item.precioUnitario), { alignment: docx.AlignmentType.RIGHT }),
      cell(docx, formatMoney(Number(item.cantidad) * Number(item.precioUnitario)), { alignment: docx.AlignmentType.RIGHT }),
    ] })),
    new docx.TableRow({ children: [cell(docx, 'TOTAL Bs:', { blue: true, columnSpan: 6, alignment: docx.AlignmentType.RIGHT, run: { bold: true } }), cell(docx, formatMoney(getNotaTotal(nota)), { run: { bold: true }, alignment: docx.AlignmentType.RIGHT })] }),
    new docx.TableRow({ children: [cell(docx, `SON: ${formatMoneyInWords(getNotaTotal(nota))}`, { blue: true, columnSpan: 7, run: { bold: true } })] }),
  ] })
  const signatures = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' }, insideHorizontal: { style: 'none' }, insideVertical: { style: 'none' } }, rows: [
    new docx.TableRow({ children: [
      cell(docx, [paragraph(docx, 'ENTREGADO POR', { alignment: docx.AlignmentType.CENTER, run: { bold: true } }), new docx.Paragraph({ children: firmaEntregado ? [firmaEntregado] : [], alignment: docx.AlignmentType.CENTER, spacing: { before: 160 } }), paragraph(docx, nota.entregadoNombre || '', { alignment: docx.AlignmentType.CENTER, run: { bold: true } }), paragraph(docx, nota.entregadoCargo || '', { alignment: docx.AlignmentType.CENTER }), paragraph(docx, nota.entregadoDocumento || '', { alignment: docx.AlignmentType.CENTER }), paragraph(docx, nota.entregadoTelefono || '', { alignment: docx.AlignmentType.CENTER }), ...(sello ? [new docx.Paragraph({ children: [sello], alignment: docx.AlignmentType.CENTER, spacing: { before: 100 } })] : [])], { width: 50 }),
      cell(docx, [paragraph(docx, 'RECIBIDO POR', { alignment: docx.AlignmentType.CENTER, run: { bold: true } }), new docx.Paragraph({ children: firmaRecibido ? [firmaRecibido] : [], alignment: docx.AlignmentType.CENTER, spacing: { before: 160 } }), paragraph(docx, nota.recibidoNombre || '', { alignment: docx.AlignmentType.CENTER, run: { bold: true } }), paragraph(docx, nota.recibidoCargo || '', { alignment: docx.AlignmentType.CENTER })], { width: 50 }),
    ] }),
  ] })
  const document = new docx.Document({
    creator: 'JDBLab Sistema de Cotizaciones',
    title: `Nota de entrega ${nota.numero || ''}`.trim(),
    sections: [{
      properties: { page: { size: { width: docx.convertMillimetersToTwip(nota.papel === 'a4' ? 210 : 215.9), height: docx.convertMillimetersToTwip(nota.papel === 'a4' ? 297 : 279.4) }, margin: { top: 720, right: 720, bottom: 1050, left: 720, footer: 454 } } },
      footers: { default: createDocumentWordFooter(docx) },
      children: [header, paragraph(docx, '', { spacing: { after: 120 } }), info, paragraph(docx, '1.  DESCRIPCIÓN DE LA ENTREGA.', { spacing: { before: 220, after: 100 }, run: { bold: true } }), paragraph(docx, nota.introduccion, { alignment: docx.AlignmentType.JUSTIFIED, spacing: { after: 130 } }), items, paragraph(docx, '', { spacing: { after: 160 } }), signatures],
    }],
  })
  download(await docx.Packer.toBlob(document), `${safeNotaFileName(nota.numero ? `nota-${nota.numero}` : 'nota-entrega')}.docx`)
}
