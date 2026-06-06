<template>
  <div class="absolute inset-0" @click="onLayerClick" :style="{ pointerEvents: mode === 'annotate' ? 'auto' : 'none' }">
    <div
      v-for="(a, idx) in annotations" :key="a.id"
      :id="'annotation-' + a.id"
      class="absolute cursor-pointer group"
      :style="{ left: a.x + '%', top: a.y + '%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }"
      @click.stop="onAnnotationClick(a)"
    >
      <div v-if="mode !== 'delete'" class="relative" :style="{ width: '28px', height: '28px' }">
        <div class="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
          :style="{ backgroundColor: a.color }">
          {{ idx + 1 }}
        </div>
        <div v-if="mode === 'hand'" class="absolute -top-2 -right-2 hidden group-hover:block">
          <button class="w-5 h-5 bg-white rounded-full shadow text-xs border hover:bg-gray-100" @click.stop="$emit('edit', a)">✎</button>
        </div>
      </div>
      <div v-else class="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:bg-red-600"
        @click.stop="onDelete(a)">
        ✕
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  annotations: Array,
  mode: { type: String, default: 'hand' },
  containerWidth: Number,
})
const emit = defineEmits(['select', 'delete', 'edit', 'click-on-prototype'])

function onLayerClick(e) {
  if (props.mode !== 'annotate') return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  emit('click-on-prototype', { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
}

function onAnnotationClick(a) {
  if (props.mode === 'delete') return
  emit('select', a)
}

function onDelete(a) {
  emit('delete', a)
}
</script>
