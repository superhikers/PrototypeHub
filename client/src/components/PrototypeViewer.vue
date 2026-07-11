<template>
  <div class="flex-1 overflow-auto relative" ref="container">
    <div v-if="!version" class="flex items-center justify-center h-full text-[var(--c-text-muted)] text-sm">
      暂无版本，请上传 HTML 文件
    </div>
    <div v-else class="relative" :style="{ width: containerWidth + 'px' }">
      <iframe
        :src="`/api/raw/${version.id}`"
        sandbox="allow-scripts"
        class="w-full border-0"
        ref="iframeEl"
        @load="onIframeLoad"
        style="overflow: hidden;"
      ></iframe>
      <AnnotationLayer
        :annotations="annotations"
        :mode="mode"
        :container-width="containerWidth"
        :selected-ids="selectedIds"
        @select="$emit('select', $event)"
        @delete="$emit('delete', $event)"
        @click-on-prototype="handleClick"
        @drop="onAnnotationLayerDrop"
        @move="onAnnotationMove"
        @toggle-select="$emit('toggle-select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useUiStore } from '../stores/uiStore'
import AnnotationLayer from './AnnotationLayer.vue'

const props = defineProps({
  version: Object,
  annotations: Array,
  mode: { type: String, default: 'hand' },
  selectedIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['annotate', 'select', 'delete', 'update-annotation', 'toggle-select'])

const container = ref(null)
const iframeEl = ref(null)
const iframeHeight = ref(600)
const ui = useUiStore()
const naturalWidth = ref(1200)
const containerWidth = computed(() => {
  return ui.resolutionWidth || naturalWidth.value
})

function onIframeLoad() {
  setContainerWidth()
}

function setContainerWidth() {
  naturalWidth.value = container.value?.clientWidth || 1200
}

function handleMessage(e) {
  if (e.data?.type === 'resize' && e.data?.height && e.source === iframeEl.value?.contentWindow) {
    iframeHeight.value = e.data.height
    if (iframeEl.value) {
      iframeEl.value.style.height = iframeHeight.value + 'px'
    }
  }
}

function handleClick(pos) {
  if (props.mode === 'annotate') {
    emit('annotate', pos)
  }
}

function onAnnotationLayerDrop(pos) {
  emit('annotate', pos)
}

function onAnnotationMove({ id, x, y }) {
  emit('update-annotation', { id, x, y })
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  setContainerWidth()
  window.addEventListener('resize', setContainerWidth)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('resize', setContainerWidth)
})

watch(() => props.version?.id, () => {
  iframeHeight.value = 600
  setContainerWidth()
})
</script>
