import { Zap, Send, MessageSquareText, CalendarDays, Check, X, Circle } from '@lucide/vue'

const metadata = {
  trigger: { label: 'Trigger', icon: Zap, color: '#e2a326' },
  sendMessage: { label: 'Send Message', icon: Send, color: '#5c8ee8' },
  addComment: { label: 'Add Comments', icon: MessageSquareText, color: '#a674df' },
  businessHours: { label: 'Business Hours', icon: CalendarDays, color: '#e59251' },
  success: { label: 'Success', icon: Check, color: '#46a484' },
  failure: { label: 'Failure', icon: X, color: '#de7180' },
}
export function nodeMeta(type) { return metadata[type] || { label: 'Node', icon: Circle, color: '#8993a3' } }
export function truncate(value, limit = 62) {
  const text = String(value ?? '')
  return text.length > limit ? `${text.slice(0, Math.max(0, limit - 1))}…` : text
}
