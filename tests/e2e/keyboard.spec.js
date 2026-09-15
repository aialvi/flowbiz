import { test, expect, load } from './helpers'
test('tabs to a node, opens it with Enter and Space, and closes with Escape', async ({ page }) => {
  await load(page)
  let focusedId = null
  for (let attempt = 0; attempt < 20 && !focusedId; attempt++) {
    await page.keyboard.press('Tab')
    focusedId = await page.evaluate(() => document.activeElement?.closest('.vue-flow__node')?.dataset.id || null)
  }
  expect(focusedId).toBeTruthy()
  const focusedNode = page.locator(`.vue-flow__node[data-id="${focusedId}"]`)
  await expect(focusedNode.locator('.workflow-node')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await focusedNode.locator('.workflow-node').focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('dialog')).toBeVisible()
})
