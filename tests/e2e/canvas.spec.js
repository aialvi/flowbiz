import { test, expect, canvasNode, load, dragNode } from './helpers'
test('loads all seven nodes and six edges from the real payload shape', async ({ page }) => {
  await load(page)
  await expect(canvasNode(page, 'b0653a')).toContainText('Welcome Message')
  await expect(canvasNode(page, 'd09c08')).toContainText('Business Hours')
})
test('keeps the failure series evenly spaced with each add button centered in its gap', async ({ page }) => {
  await load(page)
  const failure = canvasNode(page, '28c4b9')
  const away = canvasNode(page, 'b6a0c1')
  const comment = canvasNode(page, 'e879e4')
  const [failureBox, awayBox, commentBox, addBox] = await Promise.all([
    failure.boundingBox(), away.boundingBox(), comment.boundingBox(),
    failure.getByRole('button', { name: 'Add node after Failure' }).boundingBox(),
  ])
  const firstGap = awayBox.y - (failureBox.y + failureBox.height)
  const secondGap = commentBox.y - (awayBox.y + awayBox.height)
  expect(Math.abs(firstGap - secondGap)).toBeLessThan(2)
  const addCenter = addBox.y + addBox.height / 2
  expect(Math.abs((addCenter - (failureBox.y + failureBox.height)) - (awayBox.y - addCenter))).toBeLessThan(2)
})
test('a real canvas drag commits a position without disturbing another node', async ({ page }) => {
  await load(page)
  const node = canvasNode(page, 'b0653a')
  const original = await node.getAttribute('style')
  const other = await canvasNode(page, 'd09c08').getAttribute('style')
  await dragNode(page, 'b0653a')
  await expect(node).not.toHaveAttribute('style', original)
  await expect(canvasNode(page, 'd09c08')).toHaveAttribute('style', other)
  await expect(page.getByRole('status')).toContainText('Changes saved')
})
