import { flushPromises, mount } from '@vue/test-utils'
import { SelectRoot } from 'reka-ui'
import { Select } from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'

it('renders a labeled Select value, hidden form value, and forwards updates', () => {
  const wrapper = mount(Select, { props: {
    modelValue: 'two',
    options: [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }],
    name: 'choice',
    ariaLabel: 'Choice',
  } })
  expect(wrapper.get('.select-trigger').text()).toContain('Two')
  expect(wrapper.get('input[type="hidden"]').attributes()).toMatchObject({ name: 'choice', value: 'two' })
  wrapper.findComponent(SelectRoot).vm.$emit('update:modelValue', 'one')
  expect(wrapper.emitted('update:modelValue')).toEqual([['one']])
})

it('renders a two-column TimePicker and emits arbitrary hour and minute values', async () => {
  const passthrough = { template: '<div><slot /></div>' }
  const wrapper = mount(TimePicker, {
    props: { modelValue: '09:00', ariaLabel: 'Monday start time' },
    global: { stubs: { PopoverRoot: passthrough, PopoverTrigger: passthrough, PopoverPortal: passthrough, PopoverContent: passthrough } },
  })
  expect(wrapper.get('.time-picker-trigger').text()).toContain('09:00')
  const hours = wrapper.get('[role="listbox"][aria-label="Hours"]')
  const minutes = wrapper.get('[role="listbox"][aria-label="Minutes"]')
  expect(hours.findAll('[role="option"]')).toHaveLength(24)
  expect(minutes.findAll('[role="option"]')).toHaveLength(60)
  await hours.get('[data-value="10"]').trigger('click')
  await minutes.get('[data-value="7"]').trigger('click')
  await flushPromises()
  expect(wrapper.emitted('update:modelValue')).toEqual([['10:00'], ['10:07']])
  expect(wrapper.get('.time-picker-trigger').text()).toContain('10:07')
  await minutes.get('[data-value="7"]').trigger('keydown', { key: 'ArrowDown' })
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['10:08'])
})
