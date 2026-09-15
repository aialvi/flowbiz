import { useQuery } from '@tanstack/vue-query'
import fallbackPayload from './payload-fallback.json'
import { nodeVerticalStep } from '@/utils/nodes'

export const PAYLOAD_URL = 'https://respond-io-fe-bucket.s3.ap-southeast-1.amazonaws.com/candidate-assessments/payload.json'
export const queryOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        networkMode: 'always',
        staleTime: Infinity,
        gcTime: 60 * 60 * 1000,
      },
    },
  },
}

export async function fetchPayload({ signal, fetcher = globalThis.fetch } = {}) {
  const response = await fetcher(PAYLOAD_URL, { signal })
  if (!response.ok) throw new Error(`Unable to load workflow (${response.status}). Please try again.`)
  const payload = await response.json()
  normalizePayload(payload) // Fail the query for malformed data, before it reaches the canvas.
  return payload
}

export function usePayload() {
  return useQuery({ queryKey: ['workflow-payload'], queryFn: ({ signal }) => loadPayload({ signal }) })
}

export async function loadPayload({ timeoutMs = 3000, ...options } = {}) {
  let timeout
  try {
    return await Promise.race([
      fetchPayload(options),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new TypeError('Payload request timed out')), timeoutMs) }),
    ])
  } catch (error) {
    if (error instanceof TypeError || error?.name === 'AbortError') return fallbackPayload
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const defaults = {
  trigger: ['Conversation Opened', 'Start when a contact opens a conversation'],
  sendMessage: ['Send Message', 'Send a message to your contact'],
  addComment: ['Add Comment', 'Leave a note for your team'],
  businessHours: ['Business Hours', 'Check if the conversation is within business hours'],
  success: ['Success', 'Within business hours'],
  failure: ['Failure', 'Outside business hours'],
}

/** Converts the wire records documented in schema.md to an editable Vue Flow graph. */
export function normalizePayload(payload) {
  if (!Array.isArray(payload)) throw new Error('Expected an array of workflow nodes')
  const ids = new Set()
  const nodes = payload.map((record) => {
    if (record.id == null) throw new Error('Every node needs an id')
    const id = String(record.id)
    if (ids.has(id)) throw new Error(`Duplicate node id: ${id}`)
    ids.add(id)
    const source = record.data || {}
    const type = record.type === 'dateTime' ? 'businessHours'
      : record.type === 'dateTimeConnector' ? source.connectorType : record.type
    if (!defaults[type]) throw new Error(`Unsupported node type: ${record.type}`)
    const data = { title: record.name || defaults[type][0], description: record.description || defaults[type][1], parentId: String(record.parentId ?? '-1') }
    if (type === 'sendMessage') {
      data.messages = (source.payload || []).filter(item => item.type === 'text').map((item, index) => ({ id: `${id}-text-${index}`, text: item.text || '' }))
      data.message = data.messages.map(item => item.text).join('\n')
      data.attachments = (source.payload || []).filter(item => item.type === 'attachment').map((item, index) => ({
        id: `${id}-attachment-${index}`, url: item.attachment,
        name: decodeURIComponent(item.attachment.split('/').pop().split('?')[0]) || 'Attachment',
        mime: /\.(png|jpe?g|gif|webp)(\?|$)/i.test(item.attachment) ? 'image/*' : 'application/octet-stream',
      }))
    }
    if (type === 'addComment') data.comment = source.comment || ''
    if (type === 'businessHours') {
      data.times = (source.times || []).map(time => ({ ...time }))
      data.timezone = source.timezone || 'UTC'
    }
    return { id, type, data, position: { x: 0, y: 0 } }
  })
  const byId = new Map(nodes.map(node => [node.id, node]))
  const children = new Map()
  for (const node of nodes) {
    const siblings = children.get(node.data.parentId) || []
    siblings.push(node)
    children.set(node.data.parentId, siblings)
  }
  let column = 0
  const visited = new Set()
  function place(node, y) {
    if (visited.has(node.id)) return node.position.x
    visited.add(node.id)
    const descendants = (children.get(node.id) || []).filter(child => !visited.has(child.id))
    const xs = descendants.map(child => place(child, y + nodeVerticalStep(node.type)))
    const x = xs.length ? (xs[0] + xs.at(-1)) / 2 : column++ * 360
    node.position = { x, y }
    return x
  }
  nodes.filter(node => !byId.has(node.data.parentId)).forEach(node => place(node, 0))
  nodes.filter(node => !visited.has(node.id)).forEach(node => place(node, 0))
  const edges = nodes.filter(node => byId.has(node.data.parentId) && node.id !== node.data.parentId).map(node => ({
    id: `edge-${node.data.parentId}-${node.id}`, source: node.data.parentId, target: node.id,
    type: 'smoothstep', selectable: false, focusable: false,
  }))
  return { nodes, edges }
}
