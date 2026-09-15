<script setup>
import { computed, watch, markRaw } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useCanvasStore } from '@/stores/canvas'
import { usePayload, normalizePayload } from '@/api/payload'
import { useGraphMutation } from '@/composables/useGraphMutation'
import WorkflowNode from '@/components/nodes/WorkflowNode.vue'
import CreateNode from '@/components/CreateNode.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const store = useCanvasStore()
const query = usePayload()
const mutation = useGraphMutation()
watch(query.data, data => { if (data) store.hydrate(normalizePayload(data)) }, { immediate: true })
// Vue Flow owns transient drag/selection state, separately from Pinia's saved graph.
const nodeTypes = Object.fromEntries(['trigger', 'sendMessage', 'addComment', 'businessHours', 'success', 'failure'].map(type => [type, markRaw(WorkflowNode)]))
const nodeCache = new WeakMap()
const flowNodes = computed(() => store.nodes.map(node => {
  if (!nodeCache.has(node)) nodeCache.set(node, { ...node, position: { ...node.position }, data: { ...node.data }, label: node.data.title })
  return nodeCache.get(node)
}))
const flowEdges = computed(() => store.edges.map(edge => ({ ...edge })))
function onDragStop({ node }) {
  mutation.mutate({ action: 'move', id: node.id, position: { ...node.position } })
}
</script>

<template>
  <section class="workspace" aria-label="Workflow canvas">
    <div class="workspace-toolbar">
      <div><h1>Conversation workflow</h1><p>A warm welcome. Even when you’re away.</p></div>
      <div class="toolbar-actions"><div class="workflow-state"><span class="status-dot" /> Draft workflow</div><CreateNode /></div>
    </div>
    <div v-if="query.isPending.value" class="canvas-message" role="status">Loading your workflow…</div>
    <div v-else-if="query.isError.value && !store.hydrated" class="canvas-message" role="alert">
      <h2>We couldn’t load your workflow</h2><p>{{ query.error.value.message }}</p>
      <button class="primary-button" @click="query.refetch()">Try again</button>
    </div>
    <VueFlow v-else :nodes="flowNodes" :edges="flowEdges" :node-types="nodeTypes" :min-zoom="0.2" :max-zoom="2"
      :fit-view-on-init="true" :fit-view-params="{ padding: 0.25, maxZoom: 1 }" :nodes-connectable="false"
      :delete-key-code="null" :edges-updatable="false" @node-drag-stop="onDragStop">
      <Background :gap="20" :size="1" pattern-color="#d8dde7" />
      <Controls :show-interactive="false" />
      <MiniMap :pannable="true" :zoomable="true" node-color="#c4bcf4" />
    </VueFlow>
    <footer class="canvas-footer"><span>{{ store.nodes.length }} nodes · {{ store.edges.length }} connections</span>
      <span role="status">{{ mutation.isError.value ? mutation.error.value.message : mutation.isSuccess.value ? 'Changes saved for this session' : 'All changes stay in this session' }}</span>
    </footer>
  </section>
</template>
