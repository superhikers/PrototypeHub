<template>
  <BaseModal v-model="visible" title="欢迎使用 PrototypeHub">
    <p class="text-sm text-[var(--c-text-secondary)] mb-4">请输入你的名字，用于标注和评论的署名</p>
    <BaseInput
      v-model="name"
      placeholder="你的名字"
      @keyup.enter="confirm"
    />
    <template #footer>
      <BaseButton :disabled="!name.trim()" @click="confirm">确认</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import { setAuthor, getAuthor } from '../utils/author'
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import BaseInput from './base/BaseInput.vue'

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
