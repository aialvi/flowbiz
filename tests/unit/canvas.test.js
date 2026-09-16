import { flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import CanvasPage from '@/pages/CanvasPage.vue'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { render } from '../helpers'

const VueFlow = { name: 'VueFlow', props: ['nodes', 'edges'], emits: ['nodeDragStop', 'connectStart', 'connectEnd'], template: '<div><span v-for="node in nodes" :key="node.id">{{ node.data.title }}</span></div>' }

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
  await mutation.mutateAsync({ action: 'connect', connection: { source: 'b0653a', target: id, sourceHandle: 'plus', targetHandle: 'head' } })
  expect(store.edges).toHaveLength(7)
  await mutation.mutateAsync({ action: 'undo' })
  expect(store.edges).toHaveLength(6)
  await mutation.mutateAsync({ action: 'redo' })
  expect(store.edges).toHaveLength(7)
  await mutation.mutateAsync({ action: 'delete', id })
  expect(store.nodeById(id)).toBeUndefined()
  expect(client.getQueryData(['workflow-payload'])).toHaveLength(7)
  await expect(mutation.mutateAsync({ action: 'invalid' })).rejects.toThrow('Unknown')
})

it('keeps page-level creation accessible even with no nodes', async () => {
  const { wrapper, store } = await render(CanvasPage, { stubs: { VueFlow, Background: true, Controls: true, MiniMap: true } })
  store.nodes = []
  store.edges = []
  await flushPromises()
  await wrapper.get('.canvas-create-button').trigger('click')
  await flushPromises()
  expect(document.body.textContent).toContain('Create a new node')
})

it('marks descendant targets as blocked during a connection and clears the feedback when it ends', async () => {
  const { wrapper, store } = await render(CanvasPage, { stubs: { VueFlow, Background: true, Controls: true, MiniMap: true } })
  const unrelatedId = store.addNode({ type: 'addComment', title: 'Unrelated note', description: 'An independent node' })
  const flow = wrapper.findComponent(VueFlow)
  flow.vm.$emit('connectStart', { nodeId: 'd09c08', handleId: 'plus' })
  await flushPromises()
  const data = id => flow.props('nodes').find(node => node.id === id).data
  expect(data('e879e4').connectionBlocked).toBe(true)
  expect(data(unrelatedId).connectionBlocked).toBe(false)
  flow.vm.$emit('connectEnd')
  await flushPromises()
  expect(flow.props('nodes').every(node => !node.data.connectionBlocked)).toBe(true)
  expect(store.edges).toHaveLength(6)
})
