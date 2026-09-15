import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryOptions } from './api/payload'
import App from './App.vue'
import { createAppRouter } from './router'
import './style.css'

createApp(App).use(createPinia()).use(VueQueryPlugin, queryOptions).use(createAppRouter()).mount('#app')
