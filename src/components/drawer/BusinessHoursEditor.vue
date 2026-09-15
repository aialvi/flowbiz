<script setup>
import { reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { DESCRIPTION_LIMIT, validateNode } from '@/utils/validation'
import { weekSchedule } from '@/utils/time'

const props = defineProps({ node: { type: Object, required: true } })
const fields = reactive({
  title: props.node.data.title,
  description: props.node.data.description,
  timezone: props.node.data.timezone || 'UTC',
  schedule: weekSchedule(props.node.data.times),
})
const errors = ref({})
const mutation = useGraphMutation()
async function save() {
  errors.value = validateNode({ ...fields, type: props.node.type })
  if (Object.keys(errors.value).length) return
  const times = fields.schedule.filter(day => day.enabled).map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))
  await mutation.mutateAsync({ action: 'update', id: props.node.id, patch: { title: fields.title, description: fields.description, timezone: fields.timezone, times } })
}
</script>

<template>
  <form class="drawer-form" @submit.prevent="save">
    <div class="field-group"><Label for="hours-title">Title</Label><Input id="hours-title" v-model="fields.title" name="node-title" /><p v-if="errors.title" class="field-error">{{ errors.title }}</p></div>
    <div class="field-group"><div class="field-label-row"><Label for="hours-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div><Textarea id="hours-description" v-model="fields.description" name="node-description" :maxlength="DESCRIPTION_LIMIT + 1" /><p v-if="errors.description" class="field-error">{{ errors.description }}</p></div>
    <div class="field-group"><Label for="timezone">Timezone</Label><select id="timezone" v-model="fields.timezone" name="timezone" class="select-input">
      <option value="UTC">UTC</option><option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option><option value="Asia/Singapore">Asia/Singapore (UTC+8)</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option>
    </select></div>
    <fieldset class="hours-list"><legend>Weekly hours</legend>
      <div v-for="day in fields.schedule" :key="day.day" data-testid="day-row" class="hours-row">
        <label class="day-toggle"><input v-model="day.enabled" type="checkbox" :aria-label="`${day.label} enabled`" /><span>{{ day.label }}</span></label>
        <template v-if="day.enabled"><input v-model="day.startTime" type="time" class="time-input" :aria-label="`${day.label} start time`" /><span>to</span><input v-model="day.endTime" type="time" class="time-input" :aria-label="`${day.label} end time`" /></template>
        <span v-else class="closed-label">Closed</span>
      </div>
    </fieldset>
    <Button data-testid="save-node" type="submit" :disabled="mutation.isPending.value">Save changes</Button>
  </form>
</template>
