<script setup>
import { reactive, ref } from 'vue'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { DESCRIPTION_LIMIT, validateNode } from '@/utils/validation'

const open = ref(false)
const fields = reactive({ title: '', description: '', type: 'sendMessage' })
const errors = ref({})
const mutation = useGraphMutation()

function reset() {
  Object.assign(fields, { title: '', description: '', type: 'sendMessage' })
  errors.value = {}
}
async function submit() {
  errors.value = validateNode(fields)
  if (Object.keys(errors.value).length) return
  await mutation.mutateAsync({ action: 'create', fields: { ...fields } })
  open.value = false
  reset()
}
</script>

<template>
  <Button class="primary-button" @click="open = true"><Plus :size="16" /> Create New Node</Button>
  <Dialog v-model:open="open" @update:open="value => { if (!value) reset() }">
    <DialogContent class="create-dialog">
      <form data-testid="create-form" @submit.prevent="submit">
        <DialogHeader>
          <DialogTitle>Create a new node</DialogTitle>
          <DialogDescription>Add the next step in this conversation.</DialogDescription>
        </DialogHeader>
        <div class="form-stack">
          <div class="field-group">
            <Label for="create-title">Title</Label>
            <Input id="create-title" v-model="fields.title" name="title" aria-describedby="create-title-error" />
            <p v-if="errors.title" id="create-title-error" class="field-error">{{ errors.title }}</p>
          </div>
          <div class="field-group">
            <div class="field-label-row"><Label for="create-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div>
            <Textarea id="create-description" v-model="fields.description" name="description" :maxlength="DESCRIPTION_LIMIT + 1" aria-describedby="create-description-error" />
            <p v-if="errors.description" id="create-description-error" class="field-error">{{ errors.description }}</p>
          </div>
          <div class="field-group">
            <Label for="create-type">Type</Label>
            <select id="create-type" v-model="fields.type" name="type" class="select-input">
              <option value="sendMessage">Send Message</option>
              <option value="addComment">Add Comments</option>
              <option value="businessHours">Business Hours</option>
            </select>
            <p v-if="errors.type" class="field-error">{{ errors.type }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="mutation.isPending.value">Create node</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
