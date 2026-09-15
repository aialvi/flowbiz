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

it('canvas node clicks toggle editable drawers and ignore trigger and branch nodes', async () => {
  const { wrapper, router } = await render(CanvasPage, { stubs: { VueFlow, Background: true, Controls: true, MiniMap: true } })
  const flow = wrapper.findComponent(VueFlow)
  flow.vm.$emit('nodeClick', { node: { id: 'b0653a', type: 'sendMessage' } })
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/node/b0653a')
  flow.vm.$emit('nodeClick', { node: { id: 'b0653a', type: 'sendMessage' } })
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
  for (const node of [{ id: '1', type: 'trigger' }, { id: '161f52', type: 'success' }]) {
    flow.vm.$emit('nodeClick', { node })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  }
})

it('does not open a drawer for unknown or read-only deep links', async () => {
  await render(NodeDrawer, { route: '/node/161f52' })
  expect(document.querySelector('[role="dialog"]')).toBeNull()
})
