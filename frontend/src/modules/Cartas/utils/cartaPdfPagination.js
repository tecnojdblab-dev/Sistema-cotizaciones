export function paginateCartaCanvas({ contentHeight, pageHeight, headerSpace, footerSpace, protectedRanges = [] }) {
  const pages = []
  let start = 0

  while (start < contentHeight) {
    // The first page already includes the preview's top padding.
    const topSpace = pages.length ? headerSpace : 0
    const availableHeight = pageHeight - topSpace - footerSpace
    if (availableHeight <= 0) throw new Error('No hay espacio disponible para el contenido de la carta')
    const target = Math.min(start + availableHeight, contentHeight)
    let end = target

    if (target < contentHeight) {
      // Move the break above any text line/image it would cut through.
      // Repeat because overlapping ranges can move the break into another line.
      let crossing
      while ((crossing = protectedRanges.find((range) => range.top < end && range.bottom > end))) {
        if (crossing.top <= start) {
          // Oversized content must still advance to avoid an infinite loop.
          end = target
          break
        }
        end = crossing.top
      }
    }

    pages.push({ start, height: end - start, topSpace })
    start = end
  }

  return pages
}
