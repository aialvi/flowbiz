<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCanvasStore } from '@/stores/canvas'
import { isEditableType } from '@/utils/validation'
import { nodeMeta } from '@/utils/nodes'
import { useGraphMutation } from '@/composables/useGraphMutation'
import SendMessageEditor from './SendMessageEditor.vue'
import CommentEditor from './CommentEditor.vue'
import BusinessHoursEditor from './BusinessHoursEditor.vue'
import NodeDetailsEditor from './NodeDetailsEditor.vue'

const route = useRoute()
const router = useRouter()
const store = useCanvasStore()
const node = computed(() => store.nodeById(route.params.nodeId))
const isOpen = computed(() => route.name === 'node' && !!node.value && isEditableType(node.value.type))
const meta = computed(() => nodeMeta(node.value?.type))
const confirmDelete = ref(false)
const mutation = useGraphMutation()
function close() { if (route.name === 'node') router.push('/') }
function changeOpen(value) { if (!value) close() }
async function removeNode() {
  await mutation.mutateAsync({ action: 'delete', id: node.value.id })
  confirmDelete.value = false
  close()
}
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
        <SendMessageEditor v-if="node.type === 'sendMessage'" :node="node" />
        <CommentEditor v-else-if="node.type === 'addComment'" :node="node" />
        <BusinessHoursEditor v-else-if="node.type === 'businessHours'" :node="node" />
        <NodeDetailsEditor v-else-if="node.type === 'trigger'" :node="node" />
        <div class="delete-zone">
          <template v-if="!confirmDelete">
            <div><strong>Delete node</strong><p>This removes the node and every connected edge.</p></div>
            <Button data-testid="delete-node" variant="destructive" @click="confirmDelete = true">Delete node</Button>
          </template>
          <template v-else>
            <div><strong>Delete this node?</strong><p>This action can be undone with the keyboard shortcut.</p></div>
            <div class="confirm-actions"><Button variant="ghost" @click="confirmDelete = false">Cancel</Button><Button data-testid="confirm-delete" variant="destructive" @click="removeNode">Confirm delete</Button></div>
          </template>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
