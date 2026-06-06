<template>
  <div
    :class="[
      'bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] transition-all duration-200',
      hoverable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : 'shadow-soft'
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  hoverable: { type: Boolean, default: false },
})
</script>
