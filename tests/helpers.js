import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { queryOptions, normalizePayload } from '@/api/payload'
import { useCanvasStore } from '@/stores/canvas'
import fixture from './fixtures/payload.json'

export async function render(component, { route = '/', props = {}, stubs = {}, hydrate = true } = {}) {
  const pinia = createPinia()
  const store = useCanvasStore(pinia)
  if (hydrate) store.hydrate(normalizePayload(fixture))
  const client = new QueryClient(queryOptions.queryClientConfig)
  client.setQueryData(['workflow-payload'], fixture)
  const router = createAppRouter(createMemoryHistory())
  await router.push(route)
  const wrapper = mount(component, { attachTo: document.body, props, global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]], stubs } })
  await flushPromises()
  return { wrapper, store, router, client }
}
