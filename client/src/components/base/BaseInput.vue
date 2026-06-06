<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-[var(--c-text-secondary)]">{{ label }}</label>
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :type="type"
      class="w-full px-3 py-2 bg-[var(--c-surface)] border rounded-[var(--radius-sm)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] transition-all duration-150 outline-none"
      :class="error
        ? 'border-[var(--c-danger)] ring-2 ring-[var(--c-danger)]/20'
        : 'border-[var(--c-border)] focus:border-[var(--c-primary)] ring-0 focus:ring-2 focus:ring-[var(--c-primary)]/20'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="text-xs text-[var(--c-danger)]">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  type: { type: String, default: 'text' },
  error: String,
})
defineEmits(['update:modelValue'])
</script>
