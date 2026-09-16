<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { createTimeValue, parseTimeParts, padTimePart, TIME_HOURS, TIME_MINUTES } from '@/utils/time'

const props = defineProps({
  modelValue: { type: String, required: true },
  ariaLabel: { type: String, required: true },
  ariaInvalid: { type: Boolean, default: false },
  ariaDescribedby: String,
})
const emit = defineEmits(['update:modelValue'])
const initial = parseTimeParts(props.modelValue)
const hour = ref(initial.hour)
const minute = ref(initial.minute)
const open = ref(false)
const hourList = ref()
const minuteList = ref()
const displayValue = computed(() => createTimeValue(hour.value, minute.value))

watch(() => props.modelValue, (value) => {
  const next = parseTimeParts(value)
  hour.value = next.hour
  minute.value = next.minute
})
watch(open, async (value) => {
  if (!value) return
  const next = parseTimeParts(props.modelValue)
  hour.value = next.hour
  minute.value = next.minute
  await nextTick()
  hourList.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
  minuteList.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
})

function update(nextHour, nextMinute) {
  hour.value = nextHour
  minute.value = nextMinute
  emit('update:modelValue', createTimeValue(nextHour, nextMinute))
}
function selectHour(value) { update(value, minute.value) }
function selectMinute(value) {
  update(hour.value, value)
  open.value = false
}
function move(kind, current, direction, event) {
  const values = kind === 'hour' ? TIME_HOURS : TIME_MINUTES
  const nextIndex = direction === 'first' ? 0 : direction === 'last' ? values.length - 1 : (values.indexOf(current) + direction + values.length) % values.length
  const value = values[nextIndex]
  const list = event.currentTarget.parentElement
  if (kind === 'hour') selectHour(value)
  else update(hour.value, value)
  nextTick(() => list?.querySelector(`[data-value="${value}"]`)?.focus())
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="time-picker-trigger"
        :aria-label="ariaLabel"
        :aria-invalid="ariaInvalid || undefined"
        :aria-describedby="ariaDescribedby"
      >
        <span>{{ displayValue }}</span><ChevronDown :size="13" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="time-picker-dropdown" align="start" :side-offset="6">
        <div ref="hourList" class="time-picker-col" role="listbox" aria-label="Hours">
          <button
            v-for="value in TIME_HOURS"
            :key="value"
            type="button"
            role="option"
            class="time-picker-item"
            :class="{ active: value === hour }"
            :data-value="value"
            :aria-selected="value === hour"
            :tabindex="value === hour ? 0 : -1"
            @click="selectHour(value)"
            @keydown.arrow-down.prevent="move('hour', value, 1, $event)"
            @keydown.arrow-up.prevent="move('hour', value, -1, $event)"
            @keydown.home.prevent="move('hour', value, 'first', $event)"
            @keydown.end.prevent="move('hour', value, 'last', $event)"
          >{{ padTimePart(value) }}</button>
        </div>
        <div ref="minuteList" class="time-picker-col" role="listbox" aria-label="Minutes">
          <button
            v-for="value in TIME_MINUTES"
            :key="value"
            type="button"
            role="option"
            class="time-picker-item"
            :class="{ active: value === minute }"
            :data-value="value"
            :aria-selected="value === minute"
            :tabindex="value === minute ? 0 : -1"
            @click="selectMinute(value)"
            @keydown.arrow-down.prevent="move('minute', value, 1, $event)"
            @keydown.arrow-up.prevent="move('minute', value, -1, $event)"
            @keydown.home.prevent="move('minute', value, 'first', $event)"
            @keydown.end.prevent="move('minute', value, 'last', $event)"
          >{{ padTimePart(value) }}</button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
