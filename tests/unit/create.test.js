import { flushPromises } from '@vue/test-utils'
import CreateNode from '@/components/CreateNode.vue'
import { render } from '../helpers'

it('shows inline validation, counts description characters and creates only valid nodes', async () => {
  const { wrapper, store } = await render(CreateNode)
  await wrapper.get('button').trigger('click')
  await flushPromises()
  const form = document.querySelector('[data-testid="create-form"]')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
  expect(document.body.textContent).toContain('Use at least 3 characters')
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
