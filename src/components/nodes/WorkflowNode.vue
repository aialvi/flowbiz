<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { nodeMeta, truncate } from '@/utils/nodes'
import { isEditableType } from '@/utils/validation'
const props = defineProps({ id: String, type: String, data: Object, selected: Boolean })
const meta = computed(() => nodeMeta(props.type))
const branch = computed(() => ['success', 'failure'].includes(props.type))
const editable = computed(() => isEditableType(props.type))
function open() { if (editable.value) props.data.onOpen?.(props.id, props.type) }
</script>

<template>
  <article v-memo="[data, selected]" class="workflow-node" :class="[{ 'branch-node': branch, 'is-selected': selected }, `node-${type}`]" :style="{ '--node-color': meta.color }"
    :tabindex="editable ? 0 : undefined" :role="editable ? 'button' : 'group'" :aria-label="editable ? `Open ${data.title}` : data.title"
    @keydown.enter.stop.prevent="open" @keydown.space.stop.prevent="open">
    <Handle v-if="type !== 'trigger'" type="target" :position="Position.Top" :connectable="false" />
    <div class="node-heading">
      <span class="node-icon" :data-node-icon="type"><component :is="meta.icon" :size="17" :stroke-width="1.8" aria-hidden="true" /></span>
      <div class="node-heading-text"><span v-if="!branch" class="node-type">{{ meta.label }}</span><h2>{{ data.title }}</h2></div>
      <span v-if="!branch" class="node-dots" aria-hidden="true">···</span>
    </div>
    <p class="node-description" :title="data.description">{{ truncate(data.description) }}</p>
    <Handle type="source" :position="Position.Bottom" :connectable="false" />
  </article>
</template>
