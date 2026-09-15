import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { createMemoryHistory } from 'vue-router'
import { cn } from '@/lib/utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import fixture from '../fixtures/payload.json'

it('boots the application shell with a routed workspace', async () => {
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const client = new QueryClient()
  client.setQueryData(['workflow-payload'], fixture)
  const wrapper = mount(App, { global: { plugins: [createPinia(), router, [VueQueryPlugin, { queryClient: client }]], stubs: { VueFlow: true } } })
  expect(wrapper.text()).toContain('Flowbiz')
  expect(wrapper.find('main').exists()).toBe(true)
  expect(wrapper.get('a[href="#main-content"]').text()).toBe('Skip to workflow')
  expect(wrapper.get('main').attributes('id')).toBe('main-content')
})

it('uses the real cn package to merge conflicting Tailwind utilities', () => {
  expect(cn('p-2', false, ['p-4'], { flex: true })).toBe('p-4 flex')
})
