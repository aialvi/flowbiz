import { connectionError } from '@/utils/connections'

const node = id => ({ id, type: 'addComment' })
const edge = (source, target) => ({ source, target })
const check = (source, target, nodes, edges) => connectionError({ source, target, sourceHandle: 'plus', targetHandle: 'head' }, nodes, edges)

it('rejects ancestry shortcuts even across 100 generations and blocks the reverse direction', () => {
  const nodes = Array.from({ length: 101 }, (_, index) => node(String(index)))
  const edges = nodes.slice(1).map((item, index) => edge(String(index), item.id))
  expect(check('0', '100', nodes, edges)).toContain('descendant')
  expect(check('100', '0', nodes, edges)).toContain('loop')
  expect(check('30', '80', nodes, edges)).toContain('descendant')
})

it('allows unrelated nodes, including siblings without a directed path between them', () => {
  const nodes = ['root', 'left', 'right', 'new'].map(node)
  const edges = [edge('root', 'left'), edge('root', 'right')]
  expect(check('left', 'right', nodes, edges)).toBe('')
  expect(check('left', 'new', nodes, edges)).toBe('')
  expect(check('new', 'right', nodes, edges)).toBe('')
})

it('checks every branch and uses current edges after removal or undo', () => {
  const nodes = ['a', 'b', 'c', 'd'].map(node)
  const edges = [edge('a', 'b'), edge('a', 'c'), edge('c', 'd')]
  expect(check('a', 'd', nodes, edges)).toContain('descendant')
  expect(check('a', 'd', nodes, edges.slice(0, 2))).toBe('')
  expect(check('a', 'd', nodes, edges)).toContain('descendant')
})

it('terminates safely even if imported edges already contain a cycle', () => {
  const nodes = ['a', 'b', 'c'].map(node)
  expect(check('a', 'c', nodes, [edge('a', 'b'), edge('b', 'a')])).toBe('')
})
