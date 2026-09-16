import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@vue-flow')) return 'vue-flow'
          if (id.includes('reka-ui')) return 'reka-ui'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.test.js'],
    coverage: { provider: 'v8', include: ['src/stores/**', 'src/api/**/*.js', 'src/utils/**', 'src/composables/**'] },
  },
})
