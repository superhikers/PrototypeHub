<template>
  <div class="absolute inset-0" @click="onLayerClick" @dragover.prevent @drop="onDrop">
    <div
      v-for="(a, idx) in annotations" :key="a.id"
      :id="'annotation-' + a.id"
      class="absolute group"
      :class="{ 'cursor-grab': mode === 'hand', 'cursor-pointer': mode !== 'hand' }"
      :style="{ left: a.x + '%', top: a.y + '%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }"
      :draggable="mode === 'hand'"
      @dragstart="onDotDragStart(a, $event)"
      @click.stop="onAnnotationClick(a)"
    >
      <!-- 删除模式 — 红色 X -->
      <div v-if="mode === 'delete'" class="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:bg-red-600"
        @click.stop="onDelete(a)">
        ✕
      </div>
      <!-- 选择模式 — 点击切换选中状态 -->
      <div v-else-if="mode === 'select'" class="relative" :style="{ width: '28px', height: '28px' }">
        <div class="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
          :style="{ backgroundColor: selectedIds.includes(a.id) ? '#10B981' : a.color, opacity: selectedIds.includes(a.id) ? '1' : '0.6' }">
          {{ idx + 1 }}
        </div>
        <div v-if="selectedIds.includes(a.id)"
          class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow">
          ✓
        </div>
      </div>
      <!-- 手型/标注模式 — 彩色圆点 -->
      <div v-else class="relative annotation-dot" :style="{ width: '28px', height: '28px' }">
        <div class="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
          :style="{ backgroundColor: a.color }">
          {{ idx + 1 }}
        </div>
        <div v-if="mode === 'hand'" class="absolute -top-2 -right-2 hidden group-hover:block">
          <button class="w-5 h-5 bg-[var(--c-surface)] rounded-full shadow-soft text-[10px] border border-[var(--c-border)] hover:bg-[var(--c-surface-hover)] transition-colors" @click.stop="$emit('edit', a)">✎</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  annotations: Array,
  mode: { type: String, default: 'hand' },
  containerWidth: Number,
  selectedIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['select', 'delete', 'edit', 'click-on-prototype', 'drop', 'move', 'toggle-select'])

function onLayerClick(e) {
  if (props.mode !== 'annotate') return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  emit('click-on-prototype', { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
}

function onAnnotationClick(a) {
  if (props.mode === 'delete') return
  if (props.mode === 'select') {
    emit('toggle-select', a.id)
    return
  }
  emit('select', a)
}

function onDelete(a) {
  emit('delete', a)
}

function onDotDragStart(a, e) {
  e.dataTransfer.setData('application/annotation-move', a.id)
  e.dataTransfer.effectAllowed = 'move'
}

function onDrop(e) {
  const moveId = e.dataTransfer.getData('application/annotation-move')
  if (moveId) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10
    emit('move', { id: moveId, x, y })
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10
  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10
  emit('drop', { x, y })
}
</script>

<style scoped>
.annotation-dot {
  animation: dotPulse 2s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(255, 107, 107, 0); }
}
</style>
