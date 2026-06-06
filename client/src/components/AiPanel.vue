<template>
  <div class="w-96 border-l border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col shrink-0 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-[var(--c-border)] flex items-center justify-between shrink-0">
      <div>
        <h3 class="text-sm font-semibold text-[var(--c-text)]">
          {{ store.mode === 'modify' ? 'AI 微调' : 'AI 生成原型' }}
        </h3>
        <div v-if="store.mode === 'modify'" class="text-xs text-[var(--c-text-muted)] mt-0.5">
          正在修改版本
        </div>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton v-if="store.lastResult" variant="primary" size="sm" @click="applyToPrototype">
          应用到原型
        </BaseButton>
        <button class="text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors p-1" @click="store.panelOpen = false">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div ref="msgList" class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="store.messages.length === 0 && !store.loading" class="text-center py-12">
        <div class="text-3xl mb-3 opacity-30">✨</div>
        <p class="text-sm text-[var(--c-text-secondary)] mb-1">输入需求，AI 将为你生成 HTML 原型</p>
        <p class="text-xs text-[var(--c-text-muted)]">例如：生成一个登录页面、做一个仪表盘...</p>
      </div>
      <TransitionGroup name="msg" tag="div" class="space-y-3">
        <div v-for="(msg, i) in store.messages" :key="`msg-${i}`" class="msg-item" :style="{ '--delay': `${i * 0.03}s` }">
          <!-- User Message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white text-sm rounded-[var(--radius-md)] px-3 py-2 max-w-xs shadow-soft">
              {{ msg.content }}
            </div>
          </div>
          <!-- AI Response -->
          <div v-else>
            <div class="text-xs text-[var(--c-text-muted)] mb-1 font-medium">AI</div>
            <div v-if="msg.content.startsWith('错误:')" class="text-[var(--c-danger)] text-sm">
              {{ msg.content }}
            </div>
            <pre v-else class="text-xs bg-[var(--c-surface-hover)] border border-[var(--c-border-light)] rounded-[var(--radius-md)] p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto text-[var(--c-text)]">{{ msg.content }}</pre>
          </div>
        </div>
      </TransitionGroup>
      <!-- Streaming output -->
      <div v-if="store.streamingHtml" class="msg-item">
        <div class="text-xs text-[var(--c-text-muted)] mb-1 font-medium">AI 正在生成...</div>
        <pre class="text-xs bg-[var(--c-surface-hover)] border border-[var(--c-border-light)] rounded-[var(--radius-md)] p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto text-[var(--c-text)]"><span class="typing-cursor">|</span>{{ store.streamingHtml }}</pre>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-[var(--c-border)] shrink-0">
      <textarea v-model="input"
        class="w-full border border-[var(--c-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm resize-none bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all"
        rows="2"
        placeholder="描述你想生成的原型..."
        @keydown.ctrl.enter="send"
        :disabled="store.loading">
      </textarea>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-[var(--c-text-muted)]">Ctrl + Enter 发送</span>
        <BaseButton :loading="store.loading" :disabled="!input.trim()" @click="send">
          {{ store.loading ? '生成中...' : '发送' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useAiStore } from '../stores/aiStore'
import BaseButton from '../components/base/BaseButton.vue'

const props = defineProps({
  projectId: { type: String, required: true },
})

const emit = defineEmits(['applied'])

const store = useAiStore()
const input = ref('')
const msgList = ref(null)

async function send() {
  if (!input.value.trim() || store.loading) return
  const text = input.value
  input.value = ''
  await store.sendMessage(text, props.projectId)
}

function applyToPrototype() {
  emit('applied', store.lastResult)
}

watch([() => store.messages.length, () => store.streamingHtml], async () => {
  await nextTick()
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight
  }
})
</script>

<style scoped>
.msg-item {
  animation: msgIn 0.3s ease-out both;
  animation-delay: var(--delay, 0s);
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.typing-cursor {
  animation: blink 0.8s step-end infinite;
  color: var(--c-primary);
  font-weight: bold;
}
@keyframes blink {
  50% { opacity: 0; }
}
</style>
