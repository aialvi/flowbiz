import { flushPromises } from '@vue/test-utils'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { formatTime, formatTimeRange, weekSchedule } from '@/utils/time'
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

it('renders all weekdays with native time controls and saves range and timezone changes', async () => {
  const { store } = await render(NodeDrawer, { route: '/node/d09c08' })
  expect(document.querySelectorAll('[data-testid="day-row"]')).toHaveLength(7)
  const start = document.querySelector('[aria-label="Monday start time"]')
  start.value = '10:15'
  start.dispatchEvent(new Event('input', { bubbles: true }))
  const timezone = document.querySelector('[name="timezone"]')
  timezone.value = 'Asia/Dhaka'
  timezone.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
  document.querySelector('[data-testid="save-node"]').click()
  await flushPromises()
  expect(store.nodeById('d09c08').data.times[0].startTime).toBe('10:15')
  expect(store.nodeById('d09c08').data.timezone).toBe('Asia/Dhaka')
})
