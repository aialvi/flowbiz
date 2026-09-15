<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCanvasStore } from '@/stores/canvas'
import { isEditableType } from '@/utils/validation'
import { nodeMeta } from '@/utils/nodes'

const route = useRoute()
const router = useRouter()
const store = useCanvasStore()
const node = computed(() => store.nodeById(route.params.nodeId))
const isOpen = computed(() => route.name === 'node' && !!node.value && isEditableType(node.value.type))
const meta = computed(() => nodeMeta(node.value?.type))
function close() { if (route.name === 'node') router.push('/') }
function changeOpen(value) { if (!value) close() }
</script>

<template>
  <Sheet :open="isOpen" @update:open="changeOpen">
    <SheetContent :show-close-button="false" class="node-drawer">
      <SheetHeader class="drawer-header">
        <div v-if="node" class="drawer-title-row">
          <span class="node-icon" :style="{ '--node-color': meta.color }"><component :is="meta.icon" :size="18" /></span>
          <div><span class="node-type">{{ meta.label }}</span><SheetTitle>{{ node.data.title }}</SheetTitle></div>
          <Button data-testid="drawer-close" aria-label="Close node details" variant="ghost" size="icon-sm" @click="close"><X /></Button>
        </div>
        <SheetDescription v-if="node">{{ node.data.description }}</SheetDescription>
      </SheetHeader>
      <div v-if="node" class="drawer-body">
        <p class="drawer-placeholder">Edit this {{ meta.label.toLowerCase() }} step.</p>
      </div>
    </SheetContent>
  </Sheet>
</template>
