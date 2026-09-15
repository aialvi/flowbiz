import { setActivePinia, createPinia } from 'pinia'
import fixture from '../fixtures/payload.json'
import { normalizePayload } from '@/api/payload'
import { useCanvasStore } from '@/stores/canvas'

let store
beforeEach(() => { setActivePinia(createPinia()); store = useCanvasStore(); store.hydrate(normalizePayload(fixture)) })

it('hydrates once and protects local edits from query remounts', () => {
  store.updateNode('b0653a', { title: 'Local title' })
  store.hydrate(normalizePayload(fixture))
  expect(store.nodeById('b0653a').data.title).toBe('Local title')
  expect(store.editableCount).toBe(4)
})
it('adds unique editable nodes with independent defaults and sensible placement', () => {
  const id = store.addNode({ type: 'sendMessage', title: 'Hello', description: 'Say hello' })
  expect(store.nodeById(id)).toMatchObject({ type: 'sendMessage', data: { message: '', attachments: [], title: 'Hello' } })
  const next = store.addNode({ type: 'businessHours', title: 'Schedule', description: 'A schedule' })
  expect(next).not.toBe(id)
  expect(store.nodeById(next).position).not.toEqual(store.nodeById(id).position)
  expect(store.nodeById(next).data.timezone).toBe('UTC')
})
it('updates data without losing unrelated fields, and moves without changing other nodes', () => {
  const untouched = store.nodeById('d09c08')
  store.updateNode('b0653a', { message: '' })
  store.moveNode('b0653a', { x: 41, y: 53 })
  expect(store.nodeById('b0653a').data.attachments).toHaveLength(1)
  expect(store.nodeById('b0653a').position).toEqual({ x: 41, y: 53 })
  expect(store.nodeById('d09c08')).toBe(untouched)
})
it('removes a node and every connected edge', () => {
  store.deleteNode('b6a0c1')
  expect(store.nodeById('b6a0c1')).toBeUndefined()
  expect(store.edges.some(e => e.source === 'b6a0c1' || e.target === 'b6a0c1')).toBe(false)
  expect(store.nodeById('e879e4')).toBeDefined()
})
it('deleting business hours also removes its owned branches and their edges', () => {
  store.deleteNode('d09c08')
  expect(store.nodes.map(n => n.id)).not.toContain('161f52')
  expect(store.nodes.map(n => n.id)).not.toContain('28c4b9')
  expect(store.nodeById('b0653a')).toBeDefined()
  const ids = new Set(store.nodes.map(n => n.id))
  expect(store.edges.every(e => ids.has(e.source) && ids.has(e.target))).toBe(true)
})
it('guards read-only types, invalid fields, unknown IDs and invalid positions', () => {
  expect(() => store.addNode({ type: 'trigger', title: 'Test', description: 'Test' })).toThrow()
  expect(() => store.addNode({ type: 'sendMessage', title: '', description: 'Test' })).toThrow()
  expect(() => store.updateNode('161f52', { title: 'Change' })).toThrow()
  expect(() => store.deleteNode('1')).toThrow()
  expect(() => store.updateNode('missing', {})).toThrow()
  expect(() => store.moveNode('1', { x: NaN, y: 0 })).toThrow()
  store.moveNode('1', { x: 10, y: 20 })
  expect(store.nodeById('1').position.x).toBe(10)
})
