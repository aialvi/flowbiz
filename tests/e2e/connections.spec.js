import { test, expect, load, canvasNode } from './helpers'

async function createStandalone(page, title) {
  await page.getByRole('button', { name: 'Create New Node', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('Title', { exact: true }).fill(title)
  await drawer.getByLabel('Description', { exact: true }).fill('A standalone workflow step')
  await drawer.getByRole('button', { name: 'Create node', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  const node = page.locator('.vue-flow__node').filter({ hasText: title })
  await expect(node).toBeInViewport()
  // Click trial waits for the fit-view transition to settle before dragging.
  await node.locator('.node-add-button').click({ trial: true })
  return node
}

async function connect(page, source, target, targetSelector = '.node-head-handle') {
  const from = await source.locator('.node-add-button').boundingBox()
  const to = await target.locator(targetSelector).boundingBox()
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 })
  await page.mouse.up()
  await expect(page.getByRole('dialog')).not.toBeVisible()
}

test('page creation produces independent nodes that can connect to existing and new nodes with undo/redo', async ({ page }) => {
  await load(page)
  const first = await createStandalone(page, 'Independent message')
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  await connect(page, canvasNode(page, 'b0653a'), first)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(7)
  const firstId = await first.getAttribute('data-id')
  await expect(page.locator(`.vue-flow__edge[data-id="edge-b0653a-${firstId}"] path.vue-flow__edge-path`)).toHaveAttribute('d', /M.+/)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  await expect(first).toBeVisible()
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(page.locator('.vue-flow__edge')).toHaveCount(7)

  const second = await createStandalone(page, 'Independent comment')
  await connect(page, first, second)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(8)
  // Connecting a new step back into an existing branch is also supported.
  await connect(page, second, canvasNode(page, 'e879e4'))
  await expect(page.locator('.vue-flow__edge')).toHaveCount(9)
})

test('duplicate and cyclic connections are refused and dropping on empty canvas does not open a drawer', async ({ page }) => {
  await load(page)
  const source = canvasNode(page, 'b6a0c1')
  const child = canvasNode(page, 'e879e4')
  await connect(page, child, canvasNode(page, 'b0653a'), '.node-add-button')
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  await connect(page, source, child)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  await connect(page, child, source)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  const plus = await child.locator('.node-add-button').boundingBox()
  await page.mouse.move(plus.x + plus.width / 2, plus.y + plus.height / 2)
  await page.mouse.down()
  await page.mouse.move(100, 180, { steps: 20 })
  await page.mouse.up()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  await child.getByRole('button', { name: 'Add node after Add Comment #1' }).click()
  await expect(page.getByRole('dialog')).toContainText('Add after Add Comment #1')
})

test('an existing descendant is a gray banned target, while an unrelated node remains connectable', async ({ page }) => {
  await load(page)
  // Business Hours -> Failure -> Away Message -> Add Comment: not a direct edge.
  const source = canvasNode(page, 'd09c08')
  const descendant = canvasNode(page, 'e879e4').locator('.node-head-handle')
  const from = await source.locator('.node-add-button').boundingBox()
  const to = await descendant.boundingBox()
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 })
  await expect(descendant).toHaveCSS('cursor', 'not-allowed')
  await expect(descendant).toHaveCSS('background-color', 'rgb(208, 213, 221)')
  await expect(descendant).not.toHaveClass(/\bvalid\b/)
  await page.mouse.up()
  await expect(page.locator('.vue-flow__edge')).toHaveCount(6)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(descendant).not.toHaveCSS('cursor', 'not-allowed')

  const unrelated = await createStandalone(page, 'Unrelated step')
  await connect(page, source, unrelated)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(7)
})
