<script setup>
import { reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { DESCRIPTION_LIMIT, validateNode } from '@/utils/validation'

const props = defineProps({ node: { type: Object, required: true } })
const fields = reactive({ title: props.node.data.title, description: props.node.data.description })
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
    <div class="field-group">
      <Label for="details-title">Title</Label>
      <Input id="details-title" v-model="fields.title" name="node-title" aria-describedby="details-title-error" :aria-invalid="!!errors.title" />
      <p v-if="errors.title" id="details-title-error" class="field-error">{{ errors.title }}</p>
    </div>
    <div class="field-group">
      <div class="field-label-row"><Label for="details-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div>
      <Textarea id="details-description" v-model="fields.description" name="node-description" :maxlength="DESCRIPTION_LIMIT + 1" aria-describedby="details-description-error" :aria-invalid="!!errors.description" />
      <p v-if="errors.description" id="details-description-error" class="field-error">{{ errors.description }}</p>
    </div>
    <Button data-testid="save-node" type="submit" :disabled="mutation.isPending.value">Save changes</Button>
  </form>
</template>
