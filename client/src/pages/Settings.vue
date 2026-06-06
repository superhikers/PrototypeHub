<template>
  <div class="min-h-screen bg-[var(--c-bg)]">
    <header class="border-b border-[var(--c-border)] bg-[var(--c-surface)]/80 backdrop-blur-sm">
      <div class="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
        <router-link :to="`/project/${projectId}`" class="text-sm text-[var(--c-text-secondary)] hover:text-[var(--c-text)] transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          返回
        </router-link>
        <h1 class="text-base font-display text-[var(--c-text)]">项目设置</h1>
      </div>
    </header>

    <div class="max-w-2xl mx-auto px-6 py-8">
      <div v-if="loading" class="space-y-4">
        <div v-for="n in 2" :key="n" class="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] p-4">
          <BaseSkeleton height="18px" width="40%" class="mb-2" />
          <BaseSkeleton height="14px" width="60%" />
        </div>
      </div>

      <div v-else class="space-y-3">
        <div class="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--c-border-light)]">
          <div class="p-5 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-[var(--c-text)]">允许成员评论</h3>
              <p class="text-xs text-[var(--c-text-secondary)] mt-0.5">成员可对标注添加评论和回复</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" v-model="allowComment" @change="updateSettings" />
              <!-- Track -->
              <div class="w-10 h-6 rounded-full border transition-all duration-200
                peer-checked:border-transparent
                peer-checked:bg-gradient-to-r peer-checked:from-[var(--c-primary)] peer-checked:to-[var(--c-primary-stop)]
                bg-[var(--c-surface-hover)] border-[var(--c-border)]
                after:content-[''] after:absolute after:top-0.5 after:left-[3px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-soft
                after:transition-all after:duration-200
                peer-checked:after:translate-x-4
                peer-checked:after:shadow-md"></div>
            </label>
          </div>

          <div class="p-5 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-[var(--c-text)]">允许成员标注</h3>
              <p class="text-xs text-[var(--c-text-secondary)] mt-0.5">成员可自行创建标注</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" v-model="allowAnnotate" @change="updateSettings" />
              <!-- Track -->
              <div class="w-10 h-6 rounded-full border transition-all duration-200
                peer-checked:border-transparent
                peer-checked:bg-gradient-to-r peer-checked:from-[var(--c-primary)] peer-checked:to-[var(--c-primary-stop)]
                bg-[var(--c-surface-hover)] border-[var(--c-border)]
                after:content-[''] after:absolute after:top-0.5 after:left-[3px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-soft
                after:transition-all after:duration-200
                peer-checked:after:translate-x-4
                peer-checked:after:shadow-md"></div>
            </label>
          </div>
        </div>

        <!-- AI 服务配置 -->
        <div class="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] mt-3">
          <div class="p-5 border-b border-[var(--c-border-light)]">
            <h3 class="text-sm font-medium text-[var(--c-text)]">AI 服务配置</h3>
            <p class="text-xs text-[var(--c-text-secondary)] mt-0.5">配置 AI 生成使用的模型服务，支持 Claude / DeepSeek / OpenAI</p>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-[var(--c-text-secondary)]">提供商</label>
                <select v-model="aiConfig.provider"
                  class="px-3 py-2 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all">
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-[var(--c-text-secondary)]">模型</label>
                <input v-model="aiConfig.model" placeholder="deepseek-chat"
                  class="px-3 py-2 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-sm text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-[var(--c-text-secondary)]">API 地址</label>
              <input v-model="aiConfig.baseUrl" placeholder="https://api.deepseek.com"
                class="px-3 py-2 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-sm text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-[var(--c-text-secondary)]">API Key</label>
              <input v-model="aiConfig.apiKey" type="password" placeholder="sk-..."
                class="px-3 py-2 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-sm text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all font-mono" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-[var(--c-text-secondary)]">
                最大上下文长度: {{ aiConfig.maxTokens || 8192 }}
              </label>
              <input v-model.number="aiConfig.maxTokens" type="range" min="2048" max="65536" step="1024"
                class="w-full accent-[var(--c-primary)]" />
              <div class="flex justify-between text-[10px] text-[var(--c-text-muted)]">
                <span>2K</span><span>8K</span><span>16K</span><span>32K</span><span>64K</span>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-1">
              <button
                class="text-sm px-4 py-1.5 rounded-[var(--radius-sm)] border border-[var(--c-border)] text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)] transition-all disabled:opacity-50"
                :disabled="testing" @click="testConnection">
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
              <span v-if="testResult !== null" class="text-xs" :class="testResult ? 'text-[var(--c-success)]' : 'text-[var(--c-danger)]'">
                {{ testResult ? '连接成功 ✓' : testError }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import BaseSkeleton from '../components/base/BaseSkeleton.vue'

const route = useRoute()
const projectId = route.params.id

const loading = ref(true)
const allowComment = ref(true)
const allowAnnotate = ref(false)

function loadAiConfig() {
  try {
    const raw = localStorage.getItem('aiProviderConfig')
    return raw ? JSON.parse(raw) : {
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      model: 'deepseek-chat',
      maxTokens: 8192,
    }
  } catch {
    return { provider: 'deepseek', baseUrl: '', apiKey: '', model: '', maxTokens: 8192 }
  }
}

const aiConfig = reactive(loadAiConfig())
const testing = ref(false)
const testResult = ref(null)
const testError = ref('')

watch(aiConfig, () => {
  localStorage.setItem('aiProviderConfig', JSON.stringify({ ...aiConfig }))
}, { deep: true })

async function testConnection() {
  testing.value = true
  testResult.value = null
  testError.value = ''
  try {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ai-provider': aiConfig.provider,
        'x-ai-api-key': aiConfig.apiKey,
        'x-ai-base-url': aiConfig.baseUrl,
        'x-ai-model': aiConfig.model,
        'x-ai-max-tokens': String(aiConfig.maxTokens),
      },
    })
    const data = await res.json()
    testResult.value = data.ok
    if (!data.ok) testError.value = data.error
  } catch (err) {
    testResult.value = false
    testError.value = err.message
  }
  testing.value = false
}

onMounted(async () => {
  try {
    const r = await api.getSettings(projectId)
    allowComment.value = r.data.allow_comment !== 0
    allowAnnotate.value = r.data.allow_annotate !== 0
  } catch (e) {
    console.error('获取设置失败', e)
  }
  loading.value = false
})

async function updateSettings() {
  await api.updateSettings(projectId, {
    allow_comment: allowComment.value,
    allow_annotate: allowAnnotate.value,
  })
}
</script>
