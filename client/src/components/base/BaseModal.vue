<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div
          class="relative bg-[var(--c-surface)] rounded-[var(--radius-xl)] shadow-modal border border-[var(--c-border)] w-full max-w-md"
        >
          <div v-if="title || $slots.header" class="flex items-center justify-between px-6 pt-6 pb-0">
            <slot name="header">
              <h2 class="text-lg font-display text-[var(--c-text)]">{{ title }}</h2>
            </slot>
            <button
              class="text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors p-1 rounded-full hover:bg-[var(--c-surface-hover)]"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-6"><slot /></div>
          <div v-if="$slots.footer" class="flex justify-end gap-3 px-6 pb-6 pt-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
