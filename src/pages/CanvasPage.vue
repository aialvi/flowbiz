<script setup>
import { computed, watch, markRaw, ref, nextTick } from 'vue'
import { VueFlow, ConnectionMode } from '@vue-flow/core'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useCanvasStore } from '@/stores/canvas'
import { usePayload, normalizePayload } from '@/api/payload'
import { useGraphMutation } from '@/composables/useGraphMutation'
import WorkflowNode from '@/components/nodes/WorkflowNode.vue'
import CreateNode from '@/components/CreateNode.vue'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import { useRoute, useRouter } from 'vue-router'
import { isEditableType } from '@/utils/validation'
import { connectionError } from '@/utils/connections'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const store = useCanvasStore()
const query = usePayload()
const mutation = useGraphMutation()
const route = useRoute()
const router = useRouter()
const createNode = ref()
const flow = ref()
const connectingSource = ref(null)
function onConnectStart({ nodeId, handleId }) {
  connectingSource.value = handleId === 'plus' ? nodeId : null
}
// Validate gestures on the source Handle, not Vue Flow's global edge-import hook.
// The latter also checks persisted edges and would reject them as duplicates.
const isValidConnection = connection => !connectionError(connection, store.nodes, store.edges)
function onConnect(connection) {
  mutation.mutate({ action: 'connect', connection })
}
async function onCreated(_id, sourceId) {
  if (sourceId != null) return
  await nextTick()
  flow.value?.fitView({ padding: 0.25, maxZoom: 1, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 })
}
watch(query.data, data => { if (data) store.hydrate(normalizePayload(data)) }, { immediate: true })
// Vue Flow owns transient drag/selection state, separately from Pinia's saved graph.
const nodeTypes = Object.fromEntries(['trigger', 'sendMessage', 'addComment', 'businessHours', 'success', 'failure'].map(type => [type, markRaw(WorkflowNode)]))
const nodeCache = new WeakMap()
const sourcesWithOutgoingEdges = computed(() => new Set(store.edges.map(edge => edge.source)))
function openNode(id, type) {
  if (!isEditableType(type)) return
  router.push(route.params.nodeId === id ? '/' : `/node/${id}`)
}
function addAfterNode(id) {
  createNode.value?.openAfter(id)
}
const flowNodes = computed(() => store.nodes.map(node => {
  const terminal = !sourcesWithOutgoingEdges.value.has(node.id)
  const connectionBlocked = connectingSource.value != null && !isValidConnection({
    source: connectingSource.value, target: node.id, sourceHandle: 'plus', targetHandle: 'head',
  })
  const cached = nodeCache.get(node)
  if (!cached || cached.terminal !== terminal || cached.connectionBlocked !== connectionBlocked) {
    nodeCache.set(node, {
      terminal, connectionBlocked,
      flowNode: { ...node, position: { ...node.position }, data: { ...node.data, onOpen: openNode, onAdd: addAfterNode, isValidConnection, terminal, connectionBlocked }, label: node.data.title },
    })
  }
  return nodeCache.get(node).flowNode
}))
const flowEdges = computed(() => store.edges.map(edge => ({ ...edge })))
function onDragStop({ node }) {
  mutation.mutate({ action: 'move', id: node.id, position: { ...node.position } })
}
function onNodeClick({ node }) {
  openNode(node.id, node.type)
}
</script>

<template>
  <section class="workspace" aria-label="Workflow canvas">
    <div v-if="query.isPending.value" class="canvas-message" role="status" aria-live="polite">Loading your workflow…</div>
    <div v-else-if="query.isError.value && !store.hydrated" class="canvas-message" role="alert" aria-live="assertive">
      <h2>We couldn’t load your workflow</h2><p>{{ query.error.value.message }}</p>
      <button class="primary-button" @click="query.refetch()">Try again</button>
    </div>
    <VueFlow v-else ref="flow" :nodes="flowNodes" :edges="flowEdges" :node-types="nodeTypes" :min-zoom="0.2" :max-zoom="2"
      :fit-view-on-init="true" :fit-view-params="{ padding: 0.25, maxZoom: 1 }" :nodes-connectable="true"
      :connection-mode="ConnectionMode.Strict" :connect-on-click="false" @connect="onConnect"
      @connect-start="onConnectStart" @connect-end="connectingSource = null"
      :nodes-focusable="false" :delete-key-code="null" :edges-updatable="false" @node-drag-stop="onDragStop" @node-click="onNodeClick">
      <Background :gap="20" :size="1" pattern-color="#d8dde7" />
      <Controls :show-interactive="false" />
      <MiniMap :pannable="true" :zoomable="true" node-color="#c4bcf4" />
    </VueFlow>
    <Button v-if="store.hydrated" class="canvas-create-button" @click="addAfterNode(null)"><Plus :size="16" />Create New Node</Button>
    <footer class="canvas-footer"><span>{{ store.nodes.length }} nodes · {{ store.edges.length }} connections</span>
      <span role="status" aria-live="polite">{{ mutation.isError.value ? mutation.error.value.message : mutation.isSuccess.value ? 'Changes saved for this session' : 'All changes stay in this session' }}</span>
    </footer>
    <NodeDrawer />
    <CreateNode ref="createNode" @created="onCreated" />
  </section>
</template>
