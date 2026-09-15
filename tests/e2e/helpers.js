import { test as base, expect } from '@playwright/test'
import fixture from '../fixtures/payload.json' with { type: 'json' }
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/candidate-assessments/payload.json', route => route.fulfill({ json: fixture }))
    await use(page)
  },
})
export { expect }
export const canvasNode = (page, id) => page.locator(`.vue-flow__node[data-id="${id}"]`)
export async function load(page, path = '/') {
  await page.goto(path)
  await expect(page.locator('.vue-flow__node')).toHaveCount(7)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
}
export async function dragNode(page, id, dx = 90, dy = 40) {
  const node = canvasNode(page, id)
  const box = await node.boundingBox()
  await page.mouse.move(box.x + 70, box.y + 25)
  await page.mouse.down()
  await page.mouse.move(box.x + 70 + dx, box.y + 25 + dy, { steps: 15 })
  await page.mouse.up()
}
