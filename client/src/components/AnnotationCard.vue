<template>
  <div class="border rounded p-3 mb-2 cursor-pointer hover:border-blue-300 transition-colors" @click="$emit('click')">
    <div class="flex items-center gap-2 mb-1">
      <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: annotation.color }"></span>
      <span class="text-xs font-bold text-gray-600">#{{ number }}</span>
      <span class="text-xs font-medium">{{ annotation.author }}</span>
      <span class="text-xs text-gray-400">{{ new Date(annotation.created_at).toLocaleString() }}</span>
    </div>
    <p class="text-sm text-gray-700 truncate">{{ annotation.content || '（无内容）' }}</p>
  </div>
</template>

<script setup>
defineProps({
  annotation: { type: Object, required: true },
  number: { type: Number, default: 0 },
})
</script>
