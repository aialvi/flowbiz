import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { MAX_ATTACHMENT_BYTES } from '@/utils/validation'
import { render } from '../helpers'

function input(selector, value) {
  const element = document.querySelector(selector)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

it('edits and validates message fields and removes an individual message text', async () => {
  const { store, router } = await render(NodeDrawer, { route: '/node/b0653a' })
  input('[name="node-title"]', 'x')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(document.body.textContent).toContain('Use at least 3 characters')
  input('[name="node-title"]', 'Welcome updated')
  input('[name="node-description"]', 'A fresh welcome')
  input('[name="message-text"]', 'Updated message')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('b0653a').data).toMatchObject({ title: 'Welcome updated', description: 'A fresh welcome', messages: [{ text: 'Updated message' }] })
  document.querySelector('[aria-label="Remove message text 1"]').click()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('b0653a').data.messages).toEqual([])
  expect(store.nodeById('b0653a').data.message).toBe('')
  await router.push('/')
  await flushPromises()
  await router.push('/node/b0653a')
  await flushPromises()
  expect(document.querySelector('[name="message-text"]')).toBeNull()
  input('[name="node-title"]', 'No text required')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('b0653a').data.title).toBe('No text required')
})

it('shows existing attachments and uploads any new file in memory', async () => {
  const { store } = await render(NodeDrawer, { route: '/node/b0653a' })
  expect(document.querySelectorAll('[data-testid="attachment-tile"]')).toHaveLength(1)
  const file = new File(['notes'], 'brief.txt', { type: 'text/plain' })
  const upload = document.querySelector('input[type="file"]')
  Object.defineProperty(upload, 'files', { value: [file] })
  upload.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
  expect(document.body.textContent).toContain('brief.txt')
  expect(store.nodeById('b0653a').data.attachments.at(-1).name).toBe('brief.txt')
})

it('shows accessible errors for blank text entries and oversized uploads', async () => {
  await render(NodeDrawer, { route: '/node/b0653a' })
  input('[name="message-text"]', '')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(document.querySelector('[name="message-text"]').getAttribute('aria-invalid')).toBe('true')
  expect(document.body.textContent).toContain('Remove empty message fields')

  const upload = document.querySelector('input[type="file"]')
  Object.defineProperty(upload, 'files', { value: [{ name: 'large.bin', size: MAX_ATTACHMENT_BYTES + 1, type: 'application/octet-stream' }] })
  upload.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
  expect(upload.getAttribute('aria-invalid')).toBe('true')
  expect(document.body.textContent).toContain('10 MB or smaller')
})

it('requires confirmation before deleting the node and navigates home', async () => {
  const { store, router } = await render(NodeDrawer, { route: '/node/b0653a' })
  document.querySelector('[data-testid="delete-node"]').click()
  await flushPromises()
  expect(document.querySelector('[data-testid="confirm-delete"]')).toBeTruthy()
  document.querySelector('[data-testid="confirm-delete"]').click()
  await flushPromises()
  expect(store.nodeById('b0653a')).toBeUndefined()
  expect(router.currentRoute.value.path).toBe('/')
})
