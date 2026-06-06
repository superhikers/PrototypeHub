<template>
  <div
    class="skeleton"
    :style="{
      width: width,
      height: height,
      borderRadius: round ? '50%' : undefined,
    }"
  />
</template>

<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '16px' },
  round: { type: Boolean, default: false },
})
</script>
