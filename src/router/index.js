import { createRouter, createWebHistory } from 'vue-router'
import CanvasPage from '@/pages/CanvasPage.vue'

export function createAppRouter(history = createWebHistory()) {
  return createRouter({ history, routes: [{ path: '/', component: CanvasPage }] })
}
