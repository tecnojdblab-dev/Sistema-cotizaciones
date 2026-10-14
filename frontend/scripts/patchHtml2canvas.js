import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const targets = [
  'node_modules/html2canvas/dist/html2canvas.esm.js',
  'node_modules/html2canvas/dist/html2canvas.js',
]
const cloneDocumentWrite = /documentClone\.open\(\);\s*documentClone\.write\(serializeDoctype\(document\.doctype\) \+ "<html><\/html>"\);\s*\/\/ Chrome scrolls the parent document for some reason after the write to the cloned window\?\?\?\s*restoreOwnerScroll\(this\.referenceElement\.ownerDocument, scrollX, scrollY\);\s*documentClone\.replaceChild\(documentClone\.adoptNode\(this\.documentElement\), documentClone\.documentElement\);\s*documentClone\.close\(\);/
const safeCloneDocument = `restoreOwnerScroll(this.referenceElement.ownerDocument, scrollX, scrollY);
        documentClone.replaceChild(documentClone.adoptNode(this.documentElement), documentClone.documentElement);
        var base = documentClone.createElement('base');
        base.href = ownerDocument.location.href;
        documentClone.head.insertBefore(base, documentClone.head.firstChild);`

for (const target of targets) {
  const path = resolve(target)
  const source = await readFile(path, 'utf8')
  if (!source.includes('documentClone.write(')) continue
  if (!cloneDocumentWrite.test(source)) {
    throw new Error(`No se pudo aplicar el parche de html2canvas en ${target}`)
  }
  await writeFile(path, source.replace(cloneDocumentWrite, safeCloneDocument))
}
