import { defineStore } from 'pinia'
import { isCreatableType, isEditableType, validateNode, validateNodeData } from '@/utils/validation'
import { nodeVerticalStep } from '@/utils/nodes'

function copyGraph(nodes, edges) {
  return {
    nodes: nodes.map(node => ({ ...node, position: { ...node.position }, data: { ...node.data,
      attachments: node.data.attachments?.map(item => ({ ...item })),
      messages: node.data.messages?.map(item => ({ ...item })),
      times: node.data.times?.map(item => ({ ...item })),
    } })),
    edges: edges.map(edge => ({ ...edge })),
  }
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({ nodes: [], edges: [], hydrated: false, past: [], future: [] }),
  getters: {
    nodeById: state => id => state.nodes.find(node => node.id === String(id)),
    editableCount: state => state.nodes.filter(node => isEditableType(node.type)).length,
    canUndo: state => state.past.length > 0,
    canRedo: state => state.future.length > 0,
  },
  actions: {
    hydrate(graph) {
      if (this.hydrated) return
      this.nodes = graph.nodes
      this.edges = graph.edges
      this.hydrated = true
      this.past = []
      this.future = []
    },
    record() {
      this.past.push(copyGraph(this.nodes, this.edges))
      if (this.past.length > 100) this.past.shift()
      this.future = []
    },
    undo() {
      const snapshot = this.past.pop()
      if (!snapshot) return false
      this.future.push(copyGraph(this.nodes, this.edges))
      this.nodes = snapshot.nodes
      this.edges = snapshot.edges
      return true
    },
    redo() {
      const snapshot = this.future.pop()
      if (!snapshot) return false
      this.past.push(copyGraph(this.nodes, this.edges))
      this.nodes = snapshot.nodes
      this.edges = snapshot.edges
      return true
    },
    addNode(fields, afterNodeId = null) {
      if (!isCreatableType(fields.type) || Object.keys(validateNode(fields)).length) throw new Error('Invalid node fields')
      const source = afterNodeId == null ? null : this.nodeById(afterNodeId)
      if (afterNodeId != null && !source) throw new Error('Source node not found')
      this.record()
      const id = crypto.randomUUID()
      const type = fields.type
      const data = { title: fields.title.trim(), description: fields.description.trim(), parentId: source?.id ?? '-1' }
      if (type === 'sendMessage') Object.assign(data, { message: '', messages: [], attachments: [] })
      if (type === 'addComment') data.comment = ''
      if (type === 'businessHours') Object.assign(data, { timezone: 'UTC', times: ['mon', 'tue', 'wed', 'thu', 'fri'].map(day => ({ day, startTime: '09:00', endTime: '17:00' })) })
      const maxX = Math.max(0, ...this.nodes.map(node => node.position.x))
      const position = source ? { x: source.position.x, y: source.position.y + nodeVerticalStep(source.type) } : { x: maxX + 360, y: 160 }
      if (source) {
        const outgoing = this.edges.filter(edge => edge.source === source.id)
        const descendants = new Set()
        const queue = outgoing.map(edge => edge.target)
        while (queue.length) {
          const descendantId = queue.shift()
          if (descendants.has(descendantId)) continue
          descendants.add(descendantId)
          this.edges.filter(edge => edge.source === descendantId).forEach(edge => queue.push(edge.target))
        }
        const directChildren = new Set(outgoing.map(edge => edge.target))
        this.nodes = [...this.nodes.map(node => ({
          ...node,
          data: directChildren.has(node.id) ? { ...node.data, parentId: id } : node.data,
          position: descendants.has(node.id) ? { ...node.position, y: node.position.y + nodeVerticalStep(type) } : node.position,
        })), { id, type, data, position }]
        this.edges = [...this.edges.map(edge => edge.source === source.id ? {
          ...edge,
          id: `edge-${id}-${edge.target}`,
          source: id,
        } : edge), {
          id: `edge-${source.id}-${id}`,
          source: source.id,
          target: id,
          type: 'smoothstep',
          selectable: false,
          focusable: false,
        }]
      } else {
        this.nodes = [...this.nodes, { id, type, data, position }]
      }
      return id
    },
    updateNode(id, patch) {
      const node = this.nodeById(id)
      if (!node || !isEditableType(node.type)) throw new Error('This node cannot be edited')
      const data = { ...node.data, ...patch }
      if (Object.keys(validateNodeData({ ...data, type: node.type })).length) throw new Error('Invalid node fields')
      this.record()
      this.nodes = this.nodes.map(item => item.id === id ? { ...item, data } : item)
    },
    moveNode(id, position) {
      if (!this.nodeById(id)) throw new Error('Node not found')
      if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error('Invalid position')
      this.record()
      this.nodes = this.nodes.map(item => item.id === id ? { ...item, position: { ...position } } : item)
    },
    deleteNode(id) {
      const node = this.nodeById(id)
      if (!node || !isEditableType(node.type)) throw new Error('This node cannot be deleted')
      this.record()
      const removed = new Set([id])
      if (node.type === 'businessHours') {
        this.nodes.filter(item => item.data.parentId === id && ['success', 'failure'].includes(item.type)).forEach(item => removed.add(item.id))
      }
      this.nodes = this.nodes.filter(item => !removed.has(item.id))
      this.edges = this.edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target))
    },
  },
})
