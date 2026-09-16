<script setup>
import { RouterView } from 'vue-router'
import { Undo2, Redo2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryShortcuts } from '@/composables/useHistoryShortcuts'
import { useGraphMutation } from '@/composables/useGraphMutation'

const store = useCanvasStore()
const mutation = useGraphMutation()
function history(action) {
  mutation.mutate({ action })
}
useHistoryShortcuts(history)
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to workflow</a>
    <header class="app-header">
      <a href="/" class="brand">Flowbiz</a><span>Conversation workflow</span>
      <div class="history-actions" aria-label="History controls">
        <Button variant="outline" size="icon-sm" aria-label="Undo" :disabled="!store.canUndo" @click="history('undo')"><Undo2 /></Button>
        <Button variant="outline" size="icon-sm" aria-label="Redo" :disabled="!store.canRedo" @click="history('redo')"><Redo2 /></Button>
      </div>
    </header>
    <main id="main-content" tabindex="-1"><RouterView /></main>
  </div>
</template>
