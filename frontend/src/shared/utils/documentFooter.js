export const DOCUMENT_FOOTER_TEXT = 'TELEFONO: 4-4292937 - CEL: 70769521 - AV. CIRCUNVALACION, ENTRE C. VATICANO Y GUTIERREZ,\nCOCHABAMBA - BOLIVIA'

export function createDocumentWordFooter(docx) {
  return new docx.Footer({
    children: [new docx.Paragraph({
      children: [new docx.TextRun({
        font: 'Arial', size: 18, bold: true, color: '757575',
        text: DOCUMENT_FOOTER_TEXT.split('\n')[0],
      }), new docx.TextRun({
        font: 'Arial', size: 18, bold: true, color: '757575',
        break: 1, text: DOCUMENT_FOOTER_TEXT.split('\n')[1],
      })],
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 100, line: 220 },
      border: {
        top: {
          style: docx.BorderStyle.SINGLE,
          size: 12,
          color: '4F9BD3',
          space: 8,
        },
      },
    })],
  })
}
