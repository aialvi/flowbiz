<script setup>
import { computed, reactive, ref } from 'vue'
import { X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { useCanvasStore } from '@/stores/canvas'
import { DESCRIPTION_LIMIT, validateNode } from '@/utils/validation'

const open = ref(false)
const afterNodeId = ref(null)
const fields = reactive({ title: '', description: '', type: 'sendMessage' })
const errors = ref({})
const mutation = useGraphMutation()
const store = useCanvasStore()
const sourceNode = computed(() => afterNodeId.value ? store.nodeById(afterNodeId.value) : null)

function reset() {
  Object.assign(fields, { title: '', description: '', type: 'sendMessage' })
  errors.value = {}
  afterNodeId.value = null
}
function openAfter(id) {
  afterNodeId.value = id
  open.value = true
}
async function submit() {
  errors.value = validateNode(fields)
  if (Object.keys(errors.value).length) return
  await mutation.mutateAsync({ action: 'create', fields: { ...fields }, afterNodeId: afterNodeId.value })
  open.value = false
  reset()
}
defineExpose({ openAfter })
</script>

<template>
  <Sheet v-model:open="open" @update:open="value => { if (!value) reset() }">
    <SheetContent :show-close-button="false" class="create-node-drawer">
      <form data-testid="create-form" @submit.prevent="submit">
        <SheetHeader class="drawer-header">
          <div class="create-drawer-title-row">
            <div>
              <span class="node-type">New workflow step</span>
              <SheetTitle>{{ sourceNode ? `Add after ${sourceNode.data.title}` : 'Create a new node' }}</SheetTitle>
            </div>
            <Button type="button" aria-label="Close create node drawer" variant="ghost" size="icon-sm" @click="open = false"><X /></Button>
          </div>
          <SheetDescription>{{ sourceNode ? 'This step will be connected immediately after the selected node.' : 'Add a new step to this conversation.' }}</SheetDescription>
        </SheetHeader>
        <div class="create-drawer-body form-stack">
          <div class="field-group">
            <Label for="create-title">Title</Label>
            <Input id="create-title" v-model="fields.title" name="title" aria-describedby="create-title-error" :aria-invalid="!!errors.title" />
            <p v-if="errors.title" id="create-title-error" class="field-error">{{ errors.title }}</p>
          </div>
          <div class="field-group">
            <div class="field-label-row"><Label for="create-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div>
            <Textarea id="create-description" v-model="fields.description" name="description" :maxlength="DESCRIPTION_LIMIT + 1" aria-describedby="create-description-error" :aria-invalid="!!errors.description" />
            <p v-if="errors.description" id="create-description-error" class="field-error">{{ errors.description }}</p>
          </div>
          <div class="field-group">
            <Label for="create-type">Type</Label>
            <select id="create-type" v-model="fields.type" name="type" class="select-input" aria-describedby="create-type-error" :aria-invalid="!!errors.type">
              <option value="sendMessage">Send Message</option>
              <option value="addComment">Add Comments</option>
              <option value="businessHours">Business Hours</option>
            </select>
            <p v-if="errors.type" id="create-type-error" class="field-error">{{ errors.type }}</p>
          </div>
        </div>
        <SheetFooter class="create-drawer-footer">
          <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="mutation.isPending.value">Create node</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
