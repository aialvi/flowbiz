<script setup>
import { computed } from 'vue'
import { Select } from '@/components/ui/select'
import { formatTime } from '@/utils/time'

const props = defineProps({
  modelValue: { type: String, required: true },
  ariaLabel: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const options = computed(() => {
  const values = Array.from({ length: 96 }, (_, index) => {
    const minutes = index * 15
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  })
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(props.modelValue) && !values.includes(props.modelValue)) {
    values.push(props.modelValue)
    values.sort()
  }
  return values.map(value => ({ value, label: formatTime(value) }))
})
</script>

<template>
  <Select
    :model-value="modelValue"
    :options="options"
    :aria-label="ariaLabel"
    variant="time"
    @update:model-value="value => emit('update:modelValue', value)"
  />
</template>
