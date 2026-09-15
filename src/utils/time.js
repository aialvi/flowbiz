const days = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
]
export function formatTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '')
  if (!match) return value || ''
  const hour = Number(match[1])
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`
}
export function formatTimeRange(range) { return `${formatTime(range.startTime)} – ${formatTime(range.endTime)}` }
export function weekSchedule(times = []) {
  return days.map(([day, label]) => {
    const range = times.find(item => item.day === day)
    return { day, label, enabled: !!range, startTime: range?.startTime || '09:00', endTime: range?.endTime || '17:00' }
  })
}
