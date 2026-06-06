<template>
  <div class="flex bg-[var(--c-surface-hover)] rounded-[var(--radius-sm)] p-0.5 gap-0.5">
    <button
      v-for="r in resolutions" :key="r.key"
      class="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-all duration-150"
      :class="ui.resolution === r.key
        ? 'bg-[var(--c-surface)] text-[var(--c-text)] shadow-soft'
        : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)]'"
      @click="ui.setResolution(r.key)"
    >
      {{ r.label }}
    </button>
  </div>
</template>

<script setup>
import { useUiStore } from '../stores/uiStore'

const ui = useUiStore()

const resolutions = [
  { key: 'full', label: '自适应' },
  { key: 'desktop', label: '桌面' },
  { key: 'tablet', label: '平板' },
  { key: 'mobile', label: '手机' },
]
</script>
