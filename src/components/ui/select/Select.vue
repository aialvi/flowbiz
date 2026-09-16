<script setup>
import { computed, ref } from 'vue'
import { Check, ChevronDown, ChevronUp } from '@lucide/vue'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

const props = defineProps({
  modelValue: String,
  options: { type: Array, default: () => [] },
  id: String,
  name: String,
  ariaLabel: String,
  ariaInvalid: { type: Boolean, default: false },
  ariaDescribedby: String,
  placeholder: { type: String, default: 'Select an option' },
})
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const selectedLabel = computed(() => props.options.find(option => option.value === props.modelValue)?.label || props.placeholder)
</script>

<template>
  <SelectRoot v-model:open="open" :model-value="modelValue" @update:model-value="value => emit('update:modelValue', value)">
    <SelectTrigger :id="id" class="select-trigger" :aria-label="ariaLabel" :aria-invalid="ariaInvalid || undefined" :aria-describedby="ariaDescribedby">
      <SelectValue :placeholder="placeholder">{{ selectedLabel }}</SelectValue>
      <ChevronDown :size="15" aria-hidden="true" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="select-content" position="popper" :side-offset="5">
        <SelectScrollUpButton class="select-scroll-button"><ChevronUp :size="15" /></SelectScrollUpButton>
        <SelectViewport class="select-viewport">
          <SelectItem v-for="option in open ? options : []" :key="option.value" class="select-item" :value="option.value" :text-value="option.value">
            <SelectItemIndicator class="select-item-indicator"><Check :size="14" /></SelectItemIndicator>
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
        <SelectScrollDownButton class="select-scroll-button"><ChevronDown :size="15" /></SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
  <input v-if="name" type="hidden" :name="name" :value="modelValue" />
</template>
