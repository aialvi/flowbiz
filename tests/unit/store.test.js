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
  expect(store.editableCount).toBe(5)
})
it('adds unique editable nodes with independent defaults and sensible placement', () => {
  const id = store.addNode({ type: 'sendMessage', title: 'Hello', description: 'Say hello' })
  expect(store.nodeById(id)).toMatchObject({ type: 'sendMessage', data: { message: '', messages: [], attachments: [], title: 'Hello' } })
  const next = store.addNode({ type: 'businessHours', title: 'Schedule', description: 'A schedule' })
  expect(next).not.toBe(id)
  expect(store.nodeById(next).position).not.toEqual(store.nodeById(id).position)
  expect(store.nodeById(next).data.timezone).toBe('UTC')
})
it('inserts a node directly after any node and moves its existing series down', () => {
  const source = store.nodeById('b6a0c1')
  const previousChild = store.nodeById('e879e4')
  const previousChildY = previousChild.position.y
  const id = store.addNode({ type: 'addComment', title: 'Follow up', description: 'Continue the conversation' }, source.id)
  expect(store.nodeById(id)).toMatchObject({
    type: 'addComment',
    data: { parentId: source.id },
    position: { x: source.position.x, y: source.position.y + 160 },
  })
  expect(store.edges).toContainEqual(expect.objectContaining({ source: source.id, target: id }))
  expect(store.edges).toContainEqual(expect.objectContaining({ source: id, target: previousChild.id }))
  expect(store.edges).not.toContainEqual(expect.objectContaining({ source: source.id, target: previousChild.id }))
  expect(store.nodeById(previousChild.id).data.parentId).toBe(id)
  expect(store.nodeById(previousChild.id).position.y).toBe(previousChildY + 160)
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
  expect(() => store.updateNode('1', { title: 'Conversation Started' })).not.toThrow()
  expect(() => store.updateNode('missing', {})).toThrow()
  expect(() => store.updateNode('b0653a', { messages: [{ id: 'blank', text: '' }] })).toThrow()
  expect(() => store.updateNode('e879e4', { comment: 'x'.repeat(2001) })).toThrow()
  expect(() => store.updateNode('d09c08', { times: [{ day: 'mon', startTime: '09:00', endTime: '09:00' }] })).toThrow()
  expect(() => store.moveNode('1', { x: NaN, y: 0 })).toThrow()
  store.moveNode('1', { x: 10, y: 20 })
  expect(store.nodeById('1').position.x).toBe(10)
  expect(() => store.deleteNode('1')).not.toThrow()
})
it('undoes and redoes moves and field edits in order, clearing redo after a new edit', () => {
  const originalPosition = { ...store.nodeById('b0653a').position }
  const originalTitle = store.nodeById('b0653a').data.title
  store.moveNode('b0653a', { x: 700, y: 800 })
  store.updateNode('b0653a', { title: 'Changed title' })
  expect(store.canUndo).toBe(true)
  store.undo()
  expect(store.nodeById('b0653a').data.title).toBe(originalTitle)
  expect(store.nodeById('b0653a').position).toEqual({ x: 700, y: 800 })
  store.undo()
  expect(store.nodeById('b0653a').position).toEqual(originalPosition)
  store.redo()
  store.redo()
  expect(store.nodeById('b0653a').data.title).toBe('Changed title')
  store.undo()
  store.updateNode('b0653a', { title: 'Different edit' })
  expect(store.canRedo).toBe(false)
})
it('restores created and deleted nodes and their edges without history during hydration', () => {
  const initialEdges = store.edges.length
  store.deleteNode('b6a0c1')
  store.undo()
  expect(store.nodeById('b6a0c1')).toBeDefined()
  expect(store.edges).toHaveLength(initialEdges)
  const id = store.addNode({ type: 'addComment', title: 'New node', description: 'Description' })
  store.undo()
  expect(store.nodeById(id)).toBeUndefined()
})
