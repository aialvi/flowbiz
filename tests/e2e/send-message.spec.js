import { test, expect, canvasNode, load } from './helpers'
import fixture from '../fixtures/payload.json' with { type: 'json' }

test('shows the default payload image in the attachment preview', async ({ page }) => {
  const imageUrl = fixture[5].data.payload[1].attachment
  // Verify the exact payload URL without making CI depend on the image CDN.
  await page.route(imageUrl, route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=', 'base64') }))
  await load(page, '/node/b0653a')
  const preview = page.getByRole('dialog').getByRole('img', { name: '354.jpg' })
  await expect(preview).toHaveAttribute('src', imageUrl)
  await expect.poll(() => preview.evaluate(img => img.complete && img.naturalWidth > 0), { timeout: 10000 }).toBe(true)
  await expect(preview).toHaveCSS('height', '120px')
  await expect(preview).toHaveCSS('object-fit', 'contain')
})

test('edits message details, clears text, uploads a file and keeps edits after close', async ({ page }) => {
  await load(page)
  await canvasNode(page, 'b0653a').click()
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('Title', { exact: true }).fill('A better welcome')
  await drawer.getByLabel('Description', { exact: true }).fill('Greeting for every new chat')
  await drawer.getByLabel('Message text 1', { exact: true }).fill('Hello from Flowbiz')
  await drawer.getByLabel('Upload attachments').setInputFiles({ name: 'brief.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') })
  await expect(drawer.getByText('brief.txt')).toBeVisible()
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await page.keyboard.press('Escape')
  await canvasNode(page, 'b0653a').click()
  await expect(drawer.getByLabel('Title', { exact: true })).toHaveValue('A better welcome')
  await expect(drawer.getByText('brief.txt')).toBeVisible()
  await drawer.getByRole('button', { name: 'Remove message text 1' }).click()
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await expect(drawer.getByText('No message text. Add one when needed.')).toBeVisible()
  await page.keyboard.press('Escape')
  await canvasNode(page, 'b0653a').click()
  await expect(drawer.getByLabel('Message text 1', { exact: true })).toHaveCount(0)
  await drawer.getByLabel('Title', { exact: true }).fill('Welcome without text')
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await expect(drawer.getByRole('heading', { name: 'Welcome without text' })).toBeVisible()
})

test('undo restores uploaded image bytes and preview after attachment removal', async ({ page }) => {
  await load(page, '/node/b0653a')
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('Upload attachments').setInputFiles({
    name: 'pixel.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=', 'base64'),
  })
  const preview = drawer.getByRole('img', { name: 'pixel.png' })
  await expect(preview).toBeVisible()
  const url = await preview.getAttribute('src')
  await expect.poll(() => preview.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true)
  await drawer.getByRole('button', { name: 'Remove pixel.png' }).click()
  await expect(preview).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await canvasNode(page, 'b0653a').click()
  await expect(preview).toHaveAttribute('src', url)
  await expect.poll(() => preview.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true)
  expect(await page.evaluate(async blob => (await fetch(blob)).ok, url)).toBe(true)
})

test('confirmed deletion removes the node and all of its edges', async ({ page }) => {
  await load(page)
  await canvasNode(page, 'b0653a').click()
  const edgesBefore = await page.locator('.vue-flow__edge').count()
  await page.getByRole('button', { name: 'Delete node' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(canvasNode(page, 'b0653a')).toHaveCount(0)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(edgesBefore - 1)
})
