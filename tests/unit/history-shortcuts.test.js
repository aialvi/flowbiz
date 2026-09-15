import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useHistoryShortcuts } from '@/composables/useHistoryShortcuts'

it('maps platform undo and redo while preserving native input undo', async () => {
  const run = vi.fn()
  const Probe = defineComponent({ setup() { useHistoryShortcuts(run); return () => h('input') } })
  const wrapper = mount(Probe, { attachTo: document.body })
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Z', metaKey: true, shiftKey: true }))
  wrapper.get('input').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
  expect(run.mock.calls).toEqual([['undo'], ['redo']])
})
