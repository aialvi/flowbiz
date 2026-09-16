<script setup>
import { computed, reactive, ref } from 'vue'
import { Clock3 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { Textarea } from '@/components/ui/textarea'
import { useGraphMutation } from '@/composables/useGraphMutation'
import { DESCRIPTION_LIMIT, validateNodeData } from '@/utils/validation'
import { timezoneOptions, weekSchedule } from '@/utils/time'

const props = defineProps({ node: { type: Object, required: true } })
const fields = reactive({
  title: props.node.data.title,
  description: props.node.data.description,
  timezone: props.node.data.timezone || 'UTC',
  schedule: weekSchedule(props.node.data.times),
})
const errors = ref({})
const mutation = useGraphMutation()
const timezones = computed(() => timezoneOptions())
async function save() {
  errors.value = validateNodeData({ ...fields, type: props.node.type })
  if (Object.keys(errors.value).length) return
  const times = fields.schedule.filter(day => day.enabled).map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))
  await mutation.mutateAsync({ action: 'update', id: props.node.id, patch: { title: fields.title, description: fields.description, timezone: fields.timezone, times } })
}
</script>

<template>
  <form class="drawer-form" @submit.prevent="save">
    <div class="field-group"><Label for="hours-title">Title</Label><Input id="hours-title" v-model="fields.title" name="node-title" aria-describedby="hours-title-error" :aria-invalid="!!errors.title" /><p v-if="errors.title" id="hours-title-error" class="field-error">{{ errors.title }}</p></div>
    <div class="field-group"><div class="field-label-row"><Label for="hours-description">Description</Label><span>{{ fields.description.length }} / {{ DESCRIPTION_LIMIT }}</span></div><Textarea id="hours-description" v-model="fields.description" name="node-description" :maxlength="DESCRIPTION_LIMIT + 1" aria-describedby="hours-description-error" :aria-invalid="!!errors.description" /><p v-if="errors.description" id="hours-description-error" class="field-error">{{ errors.description }}</p></div>
    <div class="field-group"><Label for="timezone">Timezone</Label><Select id="timezone" v-model="fields.timezone" name="timezone" aria-label="Timezone" :options="timezones" aria-describedby="timezone-error" :aria-invalid="!!errors.timezone" /><p v-if="errors.timezone" id="timezone-error" class="field-error">{{ errors.timezone }}</p></div>
    <fieldset class="hours-list" aria-describedby="business-hours-error"><legend>Weekly hours</legend>
      <div v-for="day in fields.schedule" :key="day.day" data-testid="day-row" class="hours-row">
        <label class="day-toggle"><input v-model="day.enabled" type="checkbox" :aria-label="`${day.label} enabled`" /><span>{{ day.label }}</span></label>
        <template v-if="day.enabled"><div class="time-control"><Clock3 :size="14" aria-hidden="true" /><TimePicker v-model="day.startTime" :aria-label="`${day.label} start time`" aria-describedby="business-hours-error" :aria-invalid="!!errors.schedule" /></div><span>to</span><div class="time-control"><Clock3 :size="14" aria-hidden="true" /><TimePicker v-model="day.endTime" :aria-label="`${day.label} end time`" aria-describedby="business-hours-error" :aria-invalid="!!errors.schedule" /></div></template>
        <span v-else class="closed-label">Closed</span>
      </div>
    </fieldset>
    <p v-if="errors.schedule" id="business-hours-error" class="field-error">{{ errors.schedule }}</p>
    <Button data-testid="save-node" type="submit" :disabled="mutation.isPending.value">Save changes</Button>
  </form>
</template>
