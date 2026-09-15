import { onMounted, onUnmounted } from 'vue'

export function useHistoryShortcuts(run) {
  function onKeydown(event) {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
    const target = event.target
    if (target?.matches?.('input, textarea, select, [contenteditable="true"]')) return
    event.preventDefault()
    run(event.shiftKey ? 'redo' : 'undo')
  }
  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
  return { onKeydown }
}
