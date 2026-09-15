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

export function formatTimezoneOffset(timezone, date = new Date()) {
  try {
    const offset = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(date).find(part => part.type === 'timeZoneName')?.value || 'GMT'
    if (offset === 'GMT') return 'GMT+0:00'
    const match = /^GMT([+-])(\d{1,2}):(\d{2})$/.exec(offset)
    return match ? `GMT${match[1]}${Number(match[2])}:${match[3]}` : offset
  } catch {
    return 'GMT+0:00'
  }
}

const representativeTimezones = [
  [0, 'UTC'],
  [-12, 'Etc/GMT+12'],
  [-11, 'Pacific/Pago_Pago'],
  [-10, 'Pacific/Honolulu'],
  [-9, 'America/Anchorage'],
  [-8, 'America/Los_Angeles'],
  [-7, 'America/Denver'],
  [-6, 'America/Chicago'],
  [-5, 'America/New_York'],
  [-4, 'America/Halifax'],
  [-3, 'America/Sao_Paulo'],
  [-2, 'America/Noronha'],
  [-1, 'Atlantic/Azores'],
  [1, 'Europe/Paris'],
  [2, 'Europe/Athens'],
  [3, 'Europe/Moscow'],
  [4, 'Asia/Dubai'],
  [5, 'Asia/Karachi'],
  [6, 'Asia/Dhaka'],
  [7, 'Asia/Bangkok'],
  [8, 'Asia/Singapore'],
  [9, 'Asia/Tokyo'],
  [10, 'Australia/Sydney'],
  [11, 'Pacific/Noumea'],
]

export function timezoneOptions() {
  return representativeTimezones.map(([offset, value]) => ({
    value,
    label: `(GMT${offset >= 0 ? '+' : ''}${offset}:00) ${value}`,
  }))
}
