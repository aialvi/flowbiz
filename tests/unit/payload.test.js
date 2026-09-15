import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import fixture from '../fixtures/payload.json'
import { queryOptions, fetchPayload, loadPayload, normalizePayload, usePayload, PAYLOAD_URL } from '@/api/payload'

it('uses the exact query client settings required by the assessment', () => {
  expect(queryOptions).toEqual({ queryClientConfig: { defaultOptions: { queries: {
    refetchOnWindowFocus: false, networkMode: 'always', staleTime: Infinity, gcTime: 3600000,
  } } } })
})

it('fetches the real endpoint and reports HTTP and schema errors', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture })
  expect(await fetchPayload({ fetcher })).toEqual(fixture)
  expect(fetcher).toHaveBeenCalledWith(PAYLOAD_URL, { signal: undefined })
  await expect(fetchPayload({ fetcher: vi.fn().mockResolvedValue({ ok: false, status: 503 }) })).rejects.toThrow('503')
  await expect(fetchPayload({ fetcher: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) })).rejects.toThrow('array')
})

it('falls back to the exact inspected payload when the browser cannot reach S3', async () => {
  const payload = await loadPayload({ fetcher: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) })
  expect(payload).toEqual(fixture)
})

it('maps all real records, parent edges, times, messages and attachments without mutating input', () => {
  const original = JSON.stringify(fixture)
  const graph = normalizePayload(fixture)
  expect(graph.nodes).toHaveLength(7)
  expect(graph.edges).toHaveLength(6)
  expect(graph.nodes.find(n => n.id === '1')).toMatchObject({ type: 'trigger', data: { title: 'Conversation Opened' } })
  expect(graph.nodes.find(n => n.id === 'd09c08')).toMatchObject({ type: 'businessHours', data: { timezone: 'UTC', times: fixture[2].data.times } })
  expect(graph.nodes.find(n => n.id === 'b0653a').data).toMatchObject({ title: 'Welcome Message', message: 'Hello there\n\nwelcome to the chat!', attachments: [{ url: fixture[5].data.payload[1].attachment }] })
  expect(graph.nodes.find(n => n.id === 'e879e4').data.comment).toBe('User message during off hours')
  expect(graph.nodes.find(n => n.id === '161f52').type).toBe('success')
  const failure = graph.nodes.find(n => n.id === '28c4b9')
  const away = graph.nodes.find(n => n.id === 'b6a0c1')
  const comment = graph.nodes.find(n => n.id === 'e879e4')
  expect(away.position.y - failure.position.y).toBe(124)
  expect(comment.position.y - away.position.y).toBe(160)
  expect(new Set(graph.nodes.map(n => JSON.stringify(n.position))).size).toBe(7)
  expect(graph.edges).toContainEqual(expect.objectContaining({ source: '1', target: 'd09c08' }))
  expect(JSON.stringify(fixture)).toBe(original)
})

it('handles disconnected nodes, missing optional data, and rejects duplicate IDs or broken required records', () => {
  expect(normalizePayload([{ id: 'a', type: 'sendMessage' }]).nodes[0].data).toMatchObject({ message: '', attachments: [] })
  expect(() => normalizePayload([{ id: 'a', type: 'trigger' }, { id: 'a', type: 'trigger' }])).toThrow('Duplicate')
  expect(() => normalizePayload([{ type: 'trigger' }])).toThrow('id')
  expect(() => normalizePayload([{ id: 'a', type: 'unknown' }])).toThrow('type')
})

it('the query hook caches the remote payload and never refetches on remount', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => fixture })
  const client = new QueryClient(queryOptions.queryClientConfig)
  const Probe = defineComponent({ setup() { return { query: usePayload() } }, template: '<div>{{ query.data.value?.length }}</div>' })
  const options = { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } }
  const wrapper = mount(Probe, options)
  await flushPromises()
  expect(wrapper.text()).toBe('7')
  wrapper.unmount()
  mount(Probe, options)
  await flushPromises()
  expect(fetcher).toHaveBeenCalledTimes(1)
  client.clear()
})
