import { mount } from '@vue/test-utils'
import WorkflowNode from '@/components/nodes/WorkflowNode.vue'
import { nodeMeta, truncate } from '@/utils/nodes'

it.each(['trigger', 'sendMessage', 'addComment', 'businessHours', 'success', 'failure'])('renders the %s icon, title and accessible full description', (type) => {
  const description = 'A long description '.repeat(20)
  const wrapper = mount(WorkflowNode, { props: { id: 'test', type, data: { title: 'A title', description } }, global: { stubs: { Handle: true } } })
  expect(wrapper.text()).toContain('A title')
  expect(wrapper.find('[data-node-icon]').attributes('data-node-icon')).toBe(type)
  expect(wrapper.find('[title]').attributes('title')).toBe(description)
  expect(wrapper.find('.node-description').text().length).toBeLessThan(description.length)
})
it('shares icon/label mapping and truncates text predictably', () => {
  expect(nodeMeta('trigger').label).toBe('Trigger')
  expect(nodeMeta('sendMessage').icon).toBeDefined()
  expect(nodeMeta('unknown').label).toBe('Node')
  expect(truncate('short', 10)).toBe('short')
  expect(truncate('abcdefghij', 5)).toBe('abcd…')
  expect(truncate(null)).toBe('')
})
it('opens editable nodes with Enter or Space and keeps branch nodes out of the tab order', async () => {
  const open = vi.fn()
  const wrapper = mount(WorkflowNode, { props: { id: 'message', type: 'sendMessage', data: { title: 'Message', description: 'Description', onOpen: open } }, global: { stubs: { Handle: true } } })
  const card = wrapper.get('.workflow-node')
  expect(card.attributes('tabindex')).toBe('0')
  await card.trigger('keydown', { key: 'Enter' })
  await card.trigger('keydown', { key: ' ' })
  expect(open).toHaveBeenCalledTimes(2)
  const branch = mount(WorkflowNode, { props: { id: 'success', type: 'success', data: { title: 'Success', description: 'Done', onOpen: open } }, global: { stubs: { Handle: true } } })
  expect(branch.get('.workflow-node').attributes('tabindex')).toBeUndefined()
  await branch.get('.workflow-node').trigger('keydown', { key: 'Enter' })
  expect(open).toHaveBeenCalledTimes(2)
})
it('shows an accessible add control on every node', async () => {
  const add = vi.fn()
  const wrapper = mount(WorkflowNode, {
    props: { id: 'message', type: 'sendMessage', data: { title: 'Message', description: 'Description', onAdd: add } },
    global: { stubs: { Handle: { template: '<div><slot /></div>' } } },
  })
  const button = wrapper.get('button[aria-label="Add node after Message"]')
  await button.trigger('click')
  expect(add).toHaveBeenCalledWith('message')
})
it('marks an end-of-series add control as terminal for ash styling', () => {
  const wrapper = mount(WorkflowNode, {
    props: { id: 'last', type: 'sendMessage', data: { title: 'Last step', description: 'Description', terminal: true } },
    global: { stubs: { Handle: { template: '<div><slot /></div>' } } },
  })
  expect(wrapper.get('.node-add-control').classes()).toContain('is-terminal')
})
