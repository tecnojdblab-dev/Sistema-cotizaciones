import assert from 'node:assert/strict'
import test from 'node:test'
import { paginateCartaCanvas } from '../src/modules/Cartas/utils/cartaPdfPagination.js'

const layout = { pageHeight: 1000, headerSpace: 110, footerSpace: 60 }

test('a short letter keeps its existing first-page top padding', () => {
  assert.deepEqual(paginateCartaCanvas({ ...layout, contentHeight: 700 }), [
    { start: 0, height: 700, topSpace: 0 },
  ])
})

test('all continuation pages reserve header/footer space without losing content', () => {
  for (const pageHeight of [1056, 1123, 1344]) {
    const contentHeight = pageHeight * 5
    const pages = paginateCartaCanvas({ ...layout, pageHeight, contentHeight })
    let consumed = 0
    for (const [index, page] of pages.entries()) {
      assert.equal(page.start, consumed)
      assert.equal(page.topSpace, index ? layout.headerSpace : 0)
      assert.ok(page.topSpace + page.height <= pageHeight - layout.footerSpace)
      assert.ok(page.height > 0)
      consumed += page.height
    }
    assert.equal(consumed, contentHeight)
  }
})

test('a line crossing the page break moves intact to the next page', () => {
  const pages = paginateCartaCanvas({
    ...layout,
    contentHeight: 1500,
    protectedRanges: [{ top: 925, bottom: 950 }],
  })
  assert.equal(pages[0].height, 925)
  assert.equal(pages[1].start, 925)
  assert.equal(pages[1].topSpace, layout.headerSpace)
})

test('overlapping text and signature ranges stay together', () => {
  const pages = paginateCartaCanvas({
    ...layout,
    contentHeight: 1200,
    protectedRanges: [{ top: 930, bottom: 950 }, { top: 800, bottom: 1000 }],
  })
  assert.equal(pages[0].height, 800)
  assert.equal(pages[1].start, 800)
})

test('an image taller than a page does not block pagination', () => {
  const pages = paginateCartaCanvas({
    ...layout,
    contentHeight: 3000,
    protectedRanges: [{ top: 0, bottom: 3000 }],
  })
  assert.equal(pages.reduce((total, page) => total + page.height, 0), 3000)
  assert.ok(pages.every((page) => page.height > 0))
})
