<script setup>
import { reactive, ref } from 'vue'
import { FileText, Image, Paperclip, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { DESCRIPTION_LIMIT, validateNode } from '@/utils/validation'

const props = defineProps({ node: { type: Object, required: true } })
const fields = reactive({
  title: props.node.data.title,
  description: props.node.data.description,
  message: props.node.data.message || '',
})
const errors = ref({})
const mutation = useGraphMutation()

async function save() {
  errors.value = validateNode({ ...fields, type: props.node.type })
  if (Object.keys(errors.value).length) return
  await mutation.mutateAsync({ action: 'update', id: props.node.id, patch: { ...fields } })
}
async function upload(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  const additions = files.map(file => ({
    id: crypto.randomUUID(), name: file.name, mime: file.type || 'application/octet-stream',
    url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '', file,
  }))
  await mutation.mutateAsync({ action: 'update', id: props.node.id, patch: { attachments: [...props.node.data.attachments, ...additions] } })
  event.target.value = ''
}
async function removeAttachment(id) {
  await mutation.mutateAsync({ action: 'update', id: props.node.id, patch: { attachments: props.node.data.attachments.filter(item => item.id !== id) } })
}
</script>

<template>
  <form class="drawer-form" @submit.prevent="save">
    <div class="field-group">
      <Label for="node-title">Title</Label>
      <Input id="node-title" v-model="fields.title" name="node-title" />
      <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
    </div>
    <div class="field-group">
      <div class="field-label-row"><Label for="node-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div>
      <Textarea id="node-description" v-model="fields.description" name="node-description" :maxlength="DESCRIPTION_LIMIT + 1" />
      <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
    </div>
    <div class="field-group">
      <div class="field-label-row"><Label for="node-message">Message</Label><Button data-testid="clear-message" type="button" variant="ghost" size="sm" @click="fields.message = ''">Clear message</Button></div>
      <Textarea id="node-message" v-model="fields.message" name="message" rows="5" placeholder="Write a message…" />
    </div>
    <section class="field-group" aria-labelledby="attachments-label">
      <div class="field-label-row"><Label id="attachments-label">Attachments</Label><span>{{ node.data.attachments.length }} files</span></div>
      <div class="attachment-grid">
        <article v-for="attachment in node.data.attachments" :key="attachment.id" data-testid="attachment-tile" class="attachment-tile">
          <img v-if="attachment.mime?.startsWith('image') && attachment.url" :src="attachment.url" :alt="attachment.name" />
          <span v-else class="file-icon"><FileText /></span>
          <span :title="attachment.name">{{ attachment.name }}</span>
          <Button type="button" variant="ghost" size="icon-sm" :aria-label="`Remove ${attachment.name}`" @click="removeAttachment(attachment.id)"><Trash2 /></Button>
        </article>
        <label class="upload-tile"><Paperclip :size="18" /><span>Add files</span><input type="file" multiple aria-label="Upload attachments" @change="upload" /></label>
      </div>
    </section>
    <Button data-testid="save-node" type="submit" :disabled="mutation.isPending.value">Save changes</Button>
  </form>
</template>
