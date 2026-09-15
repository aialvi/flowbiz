<script setup>
import { reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { DESCRIPTION_LIMIT, validateNode } from '@/utils/validation'

const props = defineProps({ node: { type: Object, required: true } })
const fields = reactive({ title: props.node.data.title, description: props.node.data.description, comment: props.node.data.comment || '' })
const errors = ref({})
const mutation = useGraphMutation()
async function save() {
  errors.value = validateNode({ ...fields, type: props.node.type })
  if (Object.keys(errors.value).length) return
  await mutation.mutateAsync({ action: 'update', id: props.node.id, patch: { ...fields } })
}
</script>

<template>
  <form class="drawer-form" @submit.prevent="save">
    <div class="field-group"><Label for="comment-title">Title</Label><Input id="comment-title" v-model="fields.title" name="node-title" /><p v-if="errors.title" class="field-error">{{ errors.title }}</p></div>
    <div class="field-group">
      <div class="field-label-row"><Label for="comment-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div>
      <Textarea id="comment-description" v-model="fields.description" name="node-description" :maxlength="DESCRIPTION_LIMIT + 1" /><p v-if="errors.description" class="field-error">{{ errors.description }}</p>
    </div>
    <div class="field-group">
      <div class="field-label-row"><Label for="comment-text">Comment</Label><Button data-testid="clear-comment" type="button" variant="ghost" size="sm" @click="fields.comment = ''">Remove comment</Button></div>
      <Textarea id="comment-text" v-model="fields.comment" name="comment" rows="6" placeholder="Leave a note for your team…" />
    </div>
    <Button data-testid="save-node" type="submit" :disabled="mutation.isPending.value">Save changes</Button>
  </form>
</template>
