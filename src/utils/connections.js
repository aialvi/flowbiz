import { isEditableType } from './validation'

// Iterative traversal supports arbitrarily deep chains without recursive stack growth.
function hasPath(source, target, outgoing) {
  const visited = new Set()
  const pending = [source]
  while (pending.length) {
    const id = pending.pop()
    if (id === target) return true
    if (visited.has(id)) continue
    visited.add(id)
    pending.push(...(outgoing.get(id) || []))
  }
  return false
}

// Reject both loops and shortcuts across existing ancestry. Branches remain display-only.
export function connectionError({ source, target, sourceHandle, targetHandle }, nodes, edges) {
  const from = nodes.find(node => node.id === source)
  const to = nodes.find(node => node.id === target)
  if (!from || !to) return 'Both connection nodes must exist.'
  if (source === target) return 'A node cannot connect to itself.'
  if (!isEditableType(from.type) || !isEditableType(to.type) || to.type === 'trigger') return 'These nodes cannot be connected.'
  if (sourceHandle !== 'plus' || targetHandle !== 'head') return 'Connect from a circular + to another node’s top dot.'
  if (edges.some(edge => edge.source === source && edge.target === target)) return 'These nodes are already connected.'

  const outgoing = new Map()
  for (const edge of edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
    outgoing.get(edge.source).push(edge.target)
  }
  if (hasPath(target, source, outgoing)) return 'This connection would create a loop.'
  if (hasPath(source, target, outgoing)) return 'This node is already a descendant of the source.'
  return ''
}
