import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { Select } from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { createTimeValue, formatTime, formatTimeRange, formatTimezoneOffset, parseTimeParts, timezoneOptions, weekSchedule } from '@/utils/time'
import { render } from '../helpers'

it('formats valid times and expands missing weekdays as closed', () => {
  expect(formatTime('09:30')).toBe('9:30 AM')
  expect(formatTime('17:00')).toBe('5:00 PM')
  expect(formatTime('bad')).toBe('bad')
  expect(formatTimeRange({ startTime: '09:00', endTime: '17:00' })).toBe('9:00 AM – 5:00 PM')
  expect(parseTimeParts('10:07')).toEqual({ hour: 10, minute: 7 })
  expect(createTimeValue(10, 7)).toBe('10:07')
  const schedule = weekSchedule([{ day: 'mon', startTime: '09:00', endTime: '17:00' }])
  expect(schedule).toHaveLength(7)
  expect(schedule[0].label).toBe('Monday')
  expect(schedule[6]).toMatchObject({ day: 'sun', enabled: false })
})

it('provides 24 curated whole-hour timezones without duplicate offsets', () => {
  const options = timezoneOptions()
  expect(options[0]).toEqual({ value: 'UTC', label: '(GMT+0:00) UTC' })
  expect(options).toHaveLength(24)
  expect(new Set(options.map(option => option.label.match(/^\(GMT[^)]+/)[0])).size).toBe(24)
  expect(options.find(option => option.value === 'Asia/Dhaka')?.label).toBe('(GMT+6:00) Asia/Dhaka')
  expect(formatTimezoneOffset('America/New_York', new Date('2026-01-15T00:00:00Z'))).toBe('GMT-5:00')
})

it('renders all weekdays, saves range and timezone changes, and closes on success', async () => {
  const { wrapper, store, router } = await render(NodeDrawer, { route: '/node/d09c08' })
  expect(document.querySelectorAll('[data-testid="day-row"]')).toHaveLength(7)
  wrapper.findAllComponents(TimePicker)[0].vm.$emit('update:modelValue', '10:07')
  wrapper.findComponent(Select).vm.$emit('update:modelValue', 'Asia/Dhaka')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('d09c08').data.times[0].startTime).toBe('10:07')
  expect(store.nodeById('d09c08').data.timezone).toBe('Asia/Dhaka')
  expect(router.currentRoute.value.path).toBe('/')
})

it('rejects equal business-hour times with an accessible schedule error', async () => {
  const { wrapper, store, router } = await render(NodeDrawer, { route: '/node/d09c08' })
  wrapper.findAllComponents(TimePicker)[0].vm.$emit('update:modelValue', '17:00')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(document.body.textContent).toContain('Monday needs two different valid times')
  expect(document.querySelector('[aria-label="Monday start time"]').getAttribute('aria-invalid')).toBe('true')
  expect(store.nodeById('d09c08').data.times[0].startTime).toBe('09:00')
  expect(router.currentRoute.value.path).toBe('/node/d09c08')
})
