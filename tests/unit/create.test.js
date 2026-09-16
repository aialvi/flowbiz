import { flushPromises } from '@vue/test-utils'
import CreateNode from '@/components/CreateNode.vue'
import { render } from '../helpers'

it('shows inline validation, counts description characters and creates only valid nodes', async () => {
  const { wrapper, store } = await render(CreateNode)
  wrapper.vm.openAfter('b0653a')
  await flushPromises()
  const form = [...document.querySelectorAll('[data-testid="create-form"]')].at(-1)
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
  expect(document.body.textContent).toContain('Use at least 3 characters')
  expect(form.querySelector('[name="title"]').getAttribute('aria-invalid')).toBe('true')
  expect(form.querySelector('[name="description"]').getAttribute('aria-describedby')).toBe('create-description-error')
  expect(store.nodes).toHaveLength(7)
  const set = (selector, value) => { const input = form.querySelector(selector); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })) }
  set('[name="title"]', 'Follow up')
  set('[name="description"]', 'A helpful follow up')
  await flushPromises()
  expect(form.textContent).toContain('19 / 200')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
  expect(store.nodes).toHaveLength(8)
  expect(store.nodes.at(-1).data.title).toBe('Follow up')
})
it('opens for a terminal node and creates the next connected step', async () => {
  const { wrapper, store } = await render(CreateNode)
  wrapper.vm.openAfter('b0653a')
  await flushPromises()
  const form = [...document.querySelectorAll('[data-testid="create-form"]')].at(-1)
  expect(document.body.textContent).toContain('Add after Welcome Message')
  const set = (selector, value) => { const input = form.querySelector(selector); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })) }
  set('[name="title"]', 'Next message')
  set('[name="description"]', 'Continue this series')
  await flushPromises()
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
  const created = store.nodes.at(-1)
  expect(created.data.parentId).toBe('b0653a')
  expect(store.edges).toContainEqual(expect.objectContaining({ source: 'b0653a', target: created.id }))
})
