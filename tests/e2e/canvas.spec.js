import { test, expect, canvasNode, load, dragNode } from './helpers'
test('loads all seven nodes and six edges from the real payload shape', async ({ page }) => {
  await load(page)
  await expect(canvasNode(page, 'b0653a')).toContainText('Welcome Message')
  await expect(canvasNode(page, 'd09c08')).toContainText('Business Hours')
})
test('keeps the failure series evenly spaced while branches remain display-only', async ({ page }) => {
  await load(page)
  const failure = canvasNode(page, '28c4b9')
  const away = canvasNode(page, 'b6a0c1')
  const comment = canvasNode(page, 'e879e4')
  const [failureBox, awayBox, commentBox, addBox] = await Promise.all([
    failure.boundingBox(), away.boundingBox(), comment.boundingBox(),
    away.getByRole('button', { name: 'Add node after Away Message' }).boundingBox(),
  ])
  await expect(failure.getByRole('button')).toHaveCount(0)
  const firstGap = awayBox.y - (failureBox.y + failureBox.height)
  const secondGap = commentBox.y - (awayBox.y + awayBox.height)
  expect(Math.abs(firstGap - secondGap)).toBeLessThan(2)
  const addCenter = addBox.y + addBox.height / 2
  expect(Math.abs((addCenter - (awayBox.y + awayBox.height)) - (commentBox.y - addCenter))).toBeLessThan(2)
})
test('opens and toggles Trigger details while Success and Failure stay display-only', async ({ page }) => {
  await load(page)
  await canvasNode(page, '1').click()
  const drawer = page.getByRole('dialog')
  await expect(page).toHaveURL(/\/node\/1$/)
  await drawer.getByLabel('Title', { exact: true }).fill('Conversation Started')
  await drawer.getByLabel('Description', { exact: true }).fill('Starts when a contact opens a conversation')
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await page.keyboard.press('Escape')
  await expect(canvasNode(page, '1')).toContainText('Conversation Started')
  for (const id of ['161f52', '28c4b9']) {
    await canvasNode(page, id).click()
    await expect(drawer).not.toBeVisible()
    await expect(canvasNode(page, id).getByRole('button')).toHaveCount(0)
  }
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
