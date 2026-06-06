<template>
  <div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
    <!-- PrototypeViewer — 将在 Task 10 实现 -->
    {{ version ? `v${version.version_number}` : '请选择一个版本' }}
  </div>
</template>

<script setup>
defineProps({ version: { type: Object, default: null }, annotations: { type: Array, default: () => [] }, mode: { type: String, default: 'hand' } })
defineEmits(['annotate', 'select', 'delete'])
</script>
