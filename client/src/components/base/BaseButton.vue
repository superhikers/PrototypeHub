<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-200 focus:outline-none active:scale-[0.97]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      sizeClasses[size],
      variantClasses[variant],
      loading ? 'relative !text-transparent' : ''
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <svg class="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </span>
    <slot />
  </button>
</template>

<script setup>
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-md)]',
}

const variantClasses = {
  primary:
    'bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white shadow-soft hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft',
  secondary:
    'bg-[var(--c-surface)] text-[var(--c-text)] border border-[var(--c-border)] shadow-soft hover:bg-[var(--c-surface-hover)] hover:border-[var(--c-text-muted)] active:bg-[var(--c-surface)]',
  ghost:
    'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]',
  danger:
    'bg-[var(--c-danger)] text-white shadow-soft hover:shadow-card hover:-translate-y-0.5 active:translate-y-0',
}

defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
