<template>
  <div class="flex items-center gap-1 bg-white rounded border text-xs">
    <button
      v-for="r in resolutions" :key="r.key"
      class="px-2 py-1 rounded transition-colors"
      :class="ui.resolution === r.key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'"
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
