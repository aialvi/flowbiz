import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { Select } from '@/components/ui/select'
import { formatTime, formatTimeRange, formatTimezoneOffset, timezoneOptions, weekSchedule } from '@/utils/time'
import { render } from '../helpers'

it('formats valid times and expands missing weekdays as closed', () => {
  expect(formatTime('09:30')).toBe('9:30 AM')
  expect(formatTime('17:00')).toBe('5:00 PM')
  expect(formatTime('bad')).toBe('bad')
  expect(formatTimeRange({ startTime: '09:00', endTime: '17:00' })).toBe('9:00 AM – 5:00 PM')
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

it('renders all weekdays with themed time controls and saves range and timezone changes', async () => {
  const { wrapper, store } = await render(NodeDrawer, { route: '/node/d09c08' })
  expect(document.querySelectorAll('[data-testid="day-row"]')).toHaveLength(7)
  const start = document.querySelector('[aria-label="Monday start time"]')
  start.value = '10:15'
  start.dispatchEvent(new Event('input', { bubbles: true }))
  wrapper.findComponent(Select).vm.$emit('update:modelValue', 'Asia/Dhaka')
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('d09c08').data.times[0].startTime).toBe('10:15')
  expect(store.nodeById('d09c08').data.timezone).toBe('Asia/Dhaka')
})
