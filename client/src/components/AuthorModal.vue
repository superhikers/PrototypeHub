<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-80 shadow-xl">
      <h2 class="text-lg font-bold mb-2">欢迎使用 PrototypeHub</h2>
      <p class="text-sm text-gray-500 mb-4">请输入你的名字，用于标注和评论的署名</p>
      <input
        v-model="name"
        class="w-full border rounded px-3 py-2 mb-4"
        placeholder="你的名字"
        @keyup.enter="confirm"
        autofocus
      />
      <button
        class="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
        :disabled="!name.trim()"
        @click="confirm"
      >
        确认
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { setAuthor, getAuthor } from '../utils/author'

const visible = ref(!getAuthor())
const name = ref(getAuthor())
const emit = defineEmits(['confirmed'])

function confirm() {
  if (!name.value.trim()) return
  setAuthor(name.value.trim())
  visible.value = false
  emit('confirmed', name.value.trim())
}
</script>
