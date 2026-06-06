<template>
  <div class="w-96 border-l border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col shrink-0 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-[var(--c-border)] flex items-center justify-between shrink-0 gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="text-sm font-semibold text-[var(--c-text)] whitespace-nowrap">
          {{ store.mode === 'modify' ? 'AI 微调' : 'AI 生成' }}
        </h3>
        <span v-if="store.mode === 'modify'" class="text-xs text-[var(--c-text-muted)] truncate">修改版本中</span>
      </div>
      <div class="flex items-center gap-1">
        <button class="p-1.5 rounded-[var(--radius-sm)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)] transition-all"
          title="对话历史" @click="showHistory = !showHistory">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
        <button class="p-1.5 rounded-[var(--radius-sm)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)] transition-all"
          @click="store.panelOpen = false">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- History Sidebar -->
      <Transition name="sidebar-slide">
        <div v-if="showHistory" class="w-full border-r border-[var(--c-border)] bg-[var(--c-surface)] overflow-y-auto shrink-0">
          <div class="p-3 border-b border-[var(--c-border-light)] flex items-center justify-between">
            <span class="text-xs font-semibold text-[var(--c-text-secondary)] uppercase tracking-wider">对话历史</span>
            <button class="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)]" @click="showHistory = false">✕</button>
          </div>
          <div v-if="store.conversations.length === 0" class="p-4 text-xs text-[var(--c-text-muted)] text-center">
            暂无历史记录
          </div>
          <div v-else class="divide-y divide-[var(--c-border-light)]">
            <div v-for="conv in store.conversations" :key="conv.id"
              class="px-3 py-2.5 cursor-pointer hover:bg-[var(--c-surface-hover)] transition-colors group"
              @click="restoreConv(conv)">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-[var(--c-text)] truncate flex-1">{{ conv.title }}</span>
                <span class="text-[10px] text-[var(--c-text-muted)] ml-2 shrink-0">{{ formatDate(conv.createdAt) }}</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] px-1.5 py-0.5 rounded-full"
                  :class="conv.mode === 'modify' ? 'bg-[var(--c-accent-light)] text-[var(--c-accent)]' : 'bg-[var(--c-primary-light)] text-[var(--c-primary)]'">
                  {{ conv.mode === 'modify' ? '微调' : '生成' }}
                </span>
                <button class="text-[var(--c-text-muted)] hover:text-[var(--c-danger)] opacity-0 group-hover:opacity-100 transition-all text-xs ml-auto"
                  @click.stop="store.deleteHistory(store.projectId, conv.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Template Buttons -->
        <div v-if="store.messages.length === 0 && !store.loading" class="px-3 pt-3">
          <div class="flex flex-wrap gap-1.5">
            <button v-for="tpl in TEMPLATES" :key="tpl.label"
              class="text-xs px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--c-border-light)] text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:border-[var(--c-text-muted)] hover:bg-[var(--c-surface-hover)] transition-all"
              @click="input = tpl.prompt; $refs.inputArea?.focus()">
              {{ tpl.icon }} {{ tpl.label }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="msgList" class="flex-1 overflow-y-auto p-3 space-y-3">
          <div v-if="store.messages.length === 0 && !store.loading" class="text-center py-8">
            <div class="text-2xl mb-2 opacity-30">✨</div>
            <p class="text-xs text-[var(--c-text-muted)]">选择一个模板或输入需求开始</p>
          </div>
          <div v-for="(msg, i) in store.messages" :key="i" class="msg-item">
            <div v-if="msg.role === 'user'" class="flex justify-end">
              <div class="bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white text-sm rounded-[var(--radius-md)] px-3 py-2 max-w-xs shadow-soft">
                {{ msg.content }}
              </div>
            </div>
            <div v-else>
              <div class="text-xs text-[var(--c-text-muted)] mb-1 font-medium">AI</div>
              <div v-if="msg.content.startsWith('错误:') || msg.content.startsWith('⚠️')"
                class="text-[var(--c-danger)] text-sm bg-[var(--c-danger-light)] rounded-[var(--radius-md)] px-3 py-2">
                {{ msg.content }}
              </div>
              <pre v-else class="text-xs bg-[var(--c-surface-hover)] border border-[var(--c-border-light)] rounded-[var(--radius-md)] p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto text-[var(--c-text)]">{{ msg.content }}</pre>
              <button v-if="i === store.messages.length - 1 && !store.loading && msg.role === 'assistant' && !msg.content.startsWith('错误:') && !msg.content.startsWith('⚠️')"
                class="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] mt-1 transition-colors"
                @click="store.regenerateLast(store.projectId)">
                重新生成
              </button>
            </div>
          </div>

          <!-- Streaming output -->
          <div v-if="store.loading && store.streamingHtml" class="msg-item">
            <div class="text-xs text-[var(--c-text-muted)] mb-1 font-medium">
              AI 正在生成...
              <span v-if="store.progress" class="ml-2 text-[var(--c-accent)]">· {{ store.progress.message }}</span>
            </div>
            <pre class="text-xs bg-[var(--c-surface-hover)] border border-[var(--c-border-light)] rounded-[var(--radius-md)] p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto text-[var(--c-text)]"><span class="typing-cursor">|</span>{{ store.streamingHtml }}</pre>
            <!-- Live Preview -->
            <div v-if="store.streamingHtml.length > 50" class="mt-2">
              <button class="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors mb-1"
                @click="previewExpanded = !previewExpanded">
                {{ previewExpanded ? '收起预览 ▲' : '实时预览 ▼' }}
              </button>
              <div v-show="previewExpanded" class="border border-[var(--c-border-light)] rounded-[var(--radius-md)] overflow-hidden">
                <iframe :srcdoc="previewHtml" sandbox="allow-scripts" class="w-full bg-white" :style="{ height: previewHeight + 'px' }"></iframe>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress indicator (no stream yet) -->
        <div v-if="store.loading && !store.streamingHtml && store.progress"
          class="px-3 py-2 text-xs text-[var(--c-text-muted)] flex items-center gap-2">
          <span class="animate-pulse w-1.5 h-1.5 rounded-full bg-[var(--c-primary)]"></span>
          {{ store.progress.message }}
        </div>

        <!-- Input -->
        <div class="p-3 border-t border-[var(--c-border)] shrink-0">
          <textarea ref="inputArea" v-model="input"
            class="w-full border border-[var(--c-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm resize-none bg-[var(--c-surface)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all"
            rows="2" placeholder="描述你想生成的原型..."
            @keydown.ctrl.enter="send" :disabled="store.loading">
          </textarea>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-[var(--c-text-muted)]">Ctrl + Enter 发送</span>
            <div class="flex gap-2">
              <button v-if="store.loading"
                class="text-sm bg-[var(--c-danger)] text-white px-3 py-1.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity"
                @click="store.cancelGeneration()">
                取消
              </button>
              <base-button v-else :disabled="!input.trim()" @click="send">
                发送
              </base-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply button (floating at bottom when done) -->
    <div v-if="store.lastResult && !store.loading" class="absolute bottom-20 right-4 z-10">
      <base-button @click="applyToPrototype">
        应用到原型
      </base-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useAiStore } from '../stores/aiStore'
import BaseButton from './base/BaseButton.vue'

const props = defineProps({ projectId: { type: String, required: true } })
const emit = defineEmits(['applied'])

const store = useAiStore()
const input = ref('')
const msgList = ref(null)
const inputArea = ref(null)
const showHistory = ref(false)
const previewExpanded = ref(true)
const previewHeight = ref(200)

const TEMPLATES = [
  { icon: '🔐', label: '登录页', prompt: '生成一个美观的登录/注册页面，包含邮箱和密码输入框、登录按钮、注册链接，支持暗色模式' },
  { icon: '📊', label: '仪表盘', prompt: '生成一个数据仪表盘页面，包含4个统计卡片、图表区域、最近活动列表和顶部导航栏' },
  { icon: '📝', label: '表单', prompt: '生成一个表单页面，包含文本输入、下拉选择、单选/复选框、日期选择器和提交按钮，带验证样式' },
  { icon: '📄', label: 'Landing', prompt: '生成一个产品 landing page，包含英雄区、功能特色网格、用户评价轮播和页脚' },
  { icon: '📑', label: '表格', prompt: '生成一个数据表格页面，包含搜索框、筛选标签、分页和数据统计行' },
  { icon: '🛑', label: '错误页', prompt: '生成一个 404 错误页面，包含大号状态码、友好提示和返回首页按钮' },
]

const previewHtml = ref('')
let previewTimer = null
watch(() => store.streamingHtml, (val) => {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { previewHtml.value = val || '' }, 500)
}, { immediate: true })

let previewResizeTimer = null
watch(previewHtml, () => {
  if (previewResizeTimer) clearTimeout(previewResizeTimer)
  previewResizeTimer = setTimeout(() => { previewHeight.value = 200 }, 600)
})

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch { return '' }
}

function restoreConv(conv) {
  store.restoreConversation(store.projectId, conv.id)
  showHistory.value = false
}

async function send() {
  if (!input.value.trim() || store.loading) return
  const text = input.value
  input.value = ''
  previewHtml.value = ''
  await store.sendMessage(text, props.projectId)
}

function applyToPrototype() {
  emit('applied', store.lastResult)
}

watch([() => store.messages.length, () => store.streamingHtml], async () => {
  await nextTick()
  if (msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight
})

watch(() => store.panelOpen, (open) => {
  if (!open && store.messages.length > 0) store.saveCurrentConversation()
})

if (store.panelOpen && store.projectId !== props.projectId) {
  store.loadConversationList(props.projectId)
}
</script>

<style scoped>
.msg-item { animation: msgIn 0.25s ease-out both; }
@keyframes msgIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.typing-cursor { animation: blink 0.8s step-end infinite; color: var(--c-primary); font-weight: bold; }
@keyframes blink { 50% { opacity: 0; } }
.sidebar-slide-enter-active, .sidebar-slide-leave-active { transition: transform 0.2s ease, opacity 0.15s ease; }
.sidebar-slide-enter-from { transform: translateX(-100%); opacity: 0; }
.sidebar-slide-leave-to { transform: translateX(-100%); opacity: 0; }
</style>
