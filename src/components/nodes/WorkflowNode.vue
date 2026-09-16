<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Plus } from '@lucide/vue'
import { nodeMeta, truncate } from '@/utils/nodes'
import { isEditableType } from '@/utils/validation'
const props = defineProps({ id: String, type: String, data: Object, selected: Boolean })
const meta = computed(() => nodeMeta(props.type))
const branch = computed(() => ['success', 'failure'].includes(props.type))
const editable = computed(() => isEditableType(props.type))
function open() { if (editable.value) props.data.onOpen?.(props.id, props.type) }
let gestureStart
let dragged = false
function trackGesture(event) {
  if (gestureStart && Math.hypot(event.clientX - gestureStart.x, event.clientY - gestureStart.y) > 5) dragged = true
}
function endGesture(event) {
  if (event) trackGesture(event)
  gestureStart = null
  window.removeEventListener('pointermove', trackGesture)
  window.removeEventListener('pointerup', endGesture)
  window.removeEventListener('pointercancel', endGesture)
}
function startGesture(event) {
  endGesture()
  dragged = false
  gestureStart = { x: event.clientX, y: event.clientY }
  window.addEventListener('pointermove', trackGesture)
  window.addEventListener('pointerup', endGesture)
  window.addEventListener('pointercancel', endGesture)
}
function add(event) {
  if (!dragged || event.detail === 0) props.data.onAdd?.(props.id)
}
onBeforeUnmount(endGesture)
</script>

<template>
  <div v-memo="[data, selected]" class="workflow-node-shell" :style="{ '--node-color': meta.color }">
    <Handle v-if="type !== 'trigger'" id="head" type="target" :position="Position.Top"
      :connectable="!branch" :connectable-start="false" class="node-head-handle"
      :class="{ 'is-connection-blocked': data.connectionBlocked }" @click.stop />
    <article class="workflow-node" :class="[{ 'branch-node': branch, 'is-selected': selected }, `node-${type}`]"
      :tabindex="editable ? 0 : undefined" :role="editable ? 'button' : 'group'" :aria-label="editable ? `Open ${data.title}` : data.title"
      @keydown.enter.stop.prevent="open" @keydown.space.stop.prevent="open">
      <div class="node-heading">
        <span class="node-icon" :data-node-icon="type"><component :is="meta.icon" :size="17" :stroke-width="1.8" aria-hidden="true" /></span>
        <div class="node-heading-text"><span v-if="!branch" class="node-type">{{ meta.label }}</span><h2>{{ data.title }}</h2></div>
        <span v-if="!branch" class="node-dots" aria-hidden="true">···</span>
      </div>
      <p class="node-description" :title="data.description">{{ truncate(data.description) }}</p>
    </article>
    <Handle type="source" :position="Position.Bottom" :connectable="false" class="edge-source-handle" />
    <Handle v-if="!branch" id="plus" type="source" :position="Position.Bottom" :connectable="true"
      :connectable-end="false" :is-valid-connection="data.isValidConnection"
      class="node-add-control" :class="{ 'is-terminal': data.terminal }" @pointerdown.capture="startGesture">
      <button type="button" class="node-add-button nodrag nopan" :aria-label="`Add node after ${data.title}`"
        title="Click to add a node; drag to another node’s top dot to connect" @click.stop="add">
        <Plus :size="14" :stroke-width="2.2" aria-hidden="true" />
      </button>
    </Handle>
  </div>
</template>
