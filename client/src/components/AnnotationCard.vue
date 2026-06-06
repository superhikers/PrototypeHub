<template>
  <div class="border rounded p-3 mb-2 cursor-pointer hover:bg-gray-50 text-sm" @click="$emit('click')">
    <div class="flex items-center gap-2 mb-1">
      <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: annotation.color }"></span>
      <span class="text-xs text-gray-500">{{ annotation.author }}</span>
    </div>
    <p class="text-xs text-gray-700 line-clamp-2">{{ annotation.content }}</p>
  </div>
</template>

<script setup>
defineProps({ annotation: { type: Object, required: true } })
defineEmits(['click'])
</script>
