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
