import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import CanvasPage from '@/pages/CanvasPage.vue'
import { render } from '../helpers'

const VueFlow = { name: 'VueFlow', props: ['nodes', 'edges'], emits: ['nodeClick'], template: '<div />' }

it('deep-links to an editable node and closing returns to the canvas route', async () => {
  const { router } = await render(NodeDrawer, { route: '/node/b0653a' })
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Welcome Message')
  document.querySelector('[data-testid="drawer-close"]').click()
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
})

it('edits Trigger details from its own URL-addressable drawer', async () => {
  const { store } = await render(NodeDrawer, { route: '/node/1' })
  const drawer = Array.from(document.querySelectorAll('[role="dialog"]')).find(element => element.textContent.includes('Conversation Opened'))
  const title = drawer.querySelector('[name="node-title"]')
  const description = drawer.querySelector('[name="node-description"]')
  title.value = 'Conversation Started'
  title.dispatchEvent(new Event('input', { bubbles: true }))
  description.value = 'Starts when a contact opens a conversation'
  description.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
  drawer.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('1').data).toMatchObject({ title: 'Conversation Started', description: 'Starts when a contact opens a conversation' })
})

it('canvas node clicks toggle detail drawers and ignore display-only branch nodes', async () => {
  const { wrapper, router } = await render(CanvasPage, { stubs: { VueFlow, Background: true, Controls: true, MiniMap: true } })
  const flow = wrapper.findComponent(VueFlow)
  flow.vm.$emit('nodeClick', { node: { id: 'b0653a', type: 'sendMessage' } })
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/node/b0653a')
  flow.vm.$emit('nodeClick', { node: { id: 'b0653a', type: 'sendMessage' } })
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
  flow.vm.$emit('nodeClick', { node: { id: '1', type: 'trigger' } })
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/node/1')
  flow.vm.$emit('nodeClick', { node: { id: '1', type: 'trigger' } })
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
  for (const node of [{ id: '161f52', type: 'success' }, { id: '28c4b9', type: 'failure' }]) {
    flow.vm.$emit('nodeClick', { node })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  }
})

it('does not open a drawer for unknown or display-only deep links', async () => {
  await render(NodeDrawer, { route: '/node/161f52' })
  expect(document.querySelector('[role="dialog"]')).toBeNull()
})
