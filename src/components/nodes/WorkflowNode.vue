<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Plus } from '@lucide/vue'
import { nodeMeta, truncate } from '@/utils/nodes'
import { isEditableType } from '@/utils/validation'
const props = defineProps({ id: String, type: String, data: Object, selected: Boolean })
const meta = computed(() => nodeMeta(props.type))
const branch = computed(() => ['success', 'failure'].includes(props.type))
const editable = computed(() => isEditableType(props.type))
function open() { if (editable.value) props.data.onOpen?.(props.id, props.type) }
function add() { props.data.onAdd?.(props.id) }
</script>

<template>
  <div v-memo="[data, selected]" class="workflow-node-shell" :style="{ '--node-color': meta.color }">
    <Handle v-if="type !== 'trigger'" type="target" :position="Position.Top" :connectable="false" />
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
    <div class="node-add-control" :class="{ 'is-terminal': data.terminal }">
      <button type="button" class="node-add-button nodrag nopan" :aria-label="`Add node after ${data.title}`"
        @mousedown.stop @pointerdown.stop @click.stop="add">
        <Plus :size="14" :stroke-width="2.2" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
