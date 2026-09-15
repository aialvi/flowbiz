import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { createMemoryHistory } from 'vue-router'
import { cn } from '@/lib/utils'

it('boots the application shell with a routed workspace', async () => {
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })
  expect(wrapper.text()).toContain('Flowbiz')
  expect(wrapper.find('main').exists()).toBe(true)
})

it('uses the real cn package to merge conflicting Tailwind utilities', () => {
  expect(cn('p-2', false, ['p-4'], { flex: true })).toBe('p-4 flex')
})
