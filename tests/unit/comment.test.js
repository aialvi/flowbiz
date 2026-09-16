import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { COMMENT_LIMIT } from '@/utils/validation'
import { render } from '../helpers'

async function set(selector, value) {
  const input = document.querySelector(selector)
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

it('updates and removes a comment with shared title and description validation', async () => {
  const { store } = await render(NodeDrawer, { route: '/node/e879e4' })
  expect(document.querySelector('[name="comment"]').value).toBe('User message during off hours')
  await set('[name="node-title"]', 'Off-hours note')
  await set('[name="node-description"]', 'Visible to the team')
  await set('[name="comment"]', 'Follow up tomorrow')
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('e879e4').data).toMatchObject({ title: 'Off-hours note', comment: 'Follow up tomorrow' })
  document.querySelector('[data-testid="clear-comment"]').click()
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('e879e4').data.comment).toBe('')
})

it('rejects an oversized comment and links the error to its field', async () => {
  const { store } = await render(NodeDrawer, { route: '/node/e879e4' })
  await set('[name="comment"]', 'x'.repeat(COMMENT_LIMIT + 1))
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(document.querySelector('[name="comment"]').getAttribute('aria-invalid')).toBe('true')
  expect(document.querySelector('[name="comment"]').getAttribute('aria-describedby')).toBe('comment-text-error')
  expect(store.nodeById('e879e4').data.comment).toBe('User message during off hours')
})
