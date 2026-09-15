import { test, expect, canvasNode, load, dragNode } from './helpers'
test('loads all seven nodes and six edges from the real payload shape', async ({ page }) => {
  await load(page)
  await expect(canvasNode(page, 'b0653a')).toContainText('Welcome Message')
  await expect(canvasNode(page, 'd09c08')).toContainText('Business Hours')
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
