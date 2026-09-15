import { flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import CanvasPage from '@/pages/CanvasPage.vue'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { render } from '../helpers'

const VueFlow = { name: 'VueFlow', props: ['nodes', 'edges'], emits: ['nodeDragStop'], template: '<div><span v-for="node in nodes" :key="node.id">{{ node.data.title }}</span></div>' }

it('renders the query graph and commits drag events through a mutation', async () => {
  const { wrapper, store, client } = await render(CanvasPage, { hydrate: false, stubs: { VueFlow, Background: true, Controls: true, MiniMap: true } })
  expect(wrapper.text()).toContain('Welcome Message')
  const flow = wrapper.findComponent(VueFlow)
  expect(flow.props('nodes')).toHaveLength(7)
  expect(flow.props('edges')).toHaveLength(6)
  flow.vm.$emit('nodeDragStop', { node: { id: 'b0653a', position: { x: 90, y: 85 } } })
  await flushPromises()
  expect(store.nodeById('b0653a').position).toEqual({ x: 90, y: 85 })
  expect(client.getMutationCache().getAll().at(-1).state.status).toBe('success')
})

it('routes every supported graph mutation to Pinia, retains the query baseline and exposes errors', async () => {
  let mutation
  const Probe = defineComponent({ setup() { mutation = useGraphMutation(); return () => null } })
  const { store, client } = await render(Probe)
  const id = await mutation.mutateAsync({ action: 'create', fields: { type: 'addComment', title: 'New note', description: 'Team note' } })
  await mutation.mutateAsync({ action: 'update', id, patch: { comment: 'Test comment' } })
  expect(store.nodeById(id).data.comment).toBe('Test comment')
  await mutation.mutateAsync({ action: 'delete', id })
  expect(store.nodeById(id)).toBeUndefined()
  expect(client.getQueryData(['workflow-payload'])).toHaveLength(7)
  await expect(mutation.mutateAsync({ action: 'invalid' })).rejects.toThrow('Unknown')
})
