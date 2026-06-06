<template>
  <div
    class="group bg-[var(--c-surface)] border rounded-[var(--radius-md)] p-3 mb-2 cursor-pointer transition-all duration-200"
    :class="active ? 'border-[var(--c-primary)] ring-1 ring-[var(--c-primary)]/20' : 'border-[var(--c-border-light)] hover:border-[var(--c-text-muted)] hover:shadow-soft'"
    @click="$emit('click')"
  >
    <div class="flex items-start gap-2.5">
      <span class="mt-0.5 w-3 h-3 rounded-full shrink-0 ring-2 ring-[var(--c-surface)]" :style="{ backgroundColor: annotation.color }"></span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-xs font-semibold text-[var(--c-text)]">#{{ number }}</span>
          <span class="text-xs font-medium text-[var(--c-text-secondary)]">{{ annotation.author }}</span>
          <span class="text-xs text-[var(--c-text-muted)]">{{ new Date(annotation.created_at).toLocaleString() }}</span>
        </div>
        <p class="text-sm text-[var(--c-text-secondary)] truncate">{{ annotation.content || '（无内容）' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  annotation: { type: Object, required: true },
  number: { type: Number, default: 0 },
  active: { type: Boolean, default: false },
})
</script>
