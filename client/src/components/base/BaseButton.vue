<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-200 focus:outline-none active:scale-[0.97]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      sizeClasses[size],
      variantClasses[variant],
      (loading) ? 'relative !text-transparent' : ''
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center !text-current">
      <svg class="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </span>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<style scoped>
.size-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: var(--radius-sm); }
.size-md { padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: var(--radius-md); }
.size-lg { padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: var(--radius-md); }
</style>
