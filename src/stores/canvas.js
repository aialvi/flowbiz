import { defineStore } from 'pinia'
import { isEditableType, validateNode } from '@/utils/validation'

export const useCanvasStore = defineStore('canvas', {
  state: () => ({ nodes: [], edges: [], hydrated: false }),
  getters: {
    nodeById: state => id => state.nodes.find(node => node.id === String(id)),
    editableCount: state => state.nodes.filter(node => isEditableType(node.type)).length,
  },
  actions: {
    hydrate(graph) {
      if (this.hydrated) return
      this.nodes = graph.nodes
      this.edges = graph.edges
      this.hydrated = true
    },
    addNode(fields) {
      if (Object.keys(validateNode(fields)).length) throw new Error('Invalid node fields')
      const id = crypto.randomUUID()
      const type = fields.type
      const data = { title: fields.title.trim(), description: fields.description.trim() }
      if (type === 'sendMessage') Object.assign(data, { message: '', attachments: [] })
      if (type === 'addComment') data.comment = ''
      if (type === 'businessHours') Object.assign(data, { timezone: 'UTC', times: ['mon', 'tue', 'wed', 'thu', 'fri'].map(day => ({ day, startTime: '09:00', endTime: '17:00' })) })
      const maxX = Math.max(0, ...this.nodes.map(node => node.position.x))
      this.nodes = [...this.nodes, { id, type, data, position: { x: maxX + 360, y: 160 } }]
      return id
    },
    updateNode(id, patch) {
      const node = this.nodeById(id)
      if (!node || !isEditableType(node.type)) throw new Error('This node cannot be edited')
      const data = { ...node.data, ...patch }
      if (Object.keys(validateNode({ ...data, type: node.type })).length) throw new Error('Invalid node fields')
      this.nodes = this.nodes.map(item => item.id === id ? { ...item, data } : item)
    },
    moveNode(id, position) {
      if (!this.nodeById(id)) throw new Error('Node not found')
      if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error('Invalid position')
      this.nodes = this.nodes.map(item => item.id === id ? { ...item, position: { ...position } } : item)
    },
    deleteNode(id) {
      const node = this.nodeById(id)
      if (!node || !isEditableType(node.type)) throw new Error('This node cannot be deleted')
      const removed = new Set([id])
      if (node.type === 'businessHours') {
        this.nodes.filter(item => item.data.parentId === id && ['success', 'failure'].includes(item.type)).forEach(item => removed.add(item.id))
      }
      this.nodes = this.nodes.filter(item => !removed.has(item.id))
      this.edges = this.edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target))
    },
  },
})
