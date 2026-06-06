# AI Experience Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade AI panel with multi-provider support, real-time preview, cancel/retry, history management, prompt templates, and user-configurable provider settings.

**Architecture:** Backend: LLMAdapter refactored to factory pattern supporting Claude (SDK) and OpenAI-compatible APIs (DeepSeek, OpenAI). Frontend: config stored in localStorage, passed via request headers. SSE stream enhanced with progress events.

**Tech Stack:** Node.js/Express, Anthropic SDK, Fetch API (for OpenAI-compatible providers), Vue 3/Pinia, localStorage

---

### Task 1: LLMAdapter — Factory Pattern + Multi-Provider + Retry

**Files:**
- Modify: `server/src/ai/llm.js`

This is the core backend refactor. The adapter becomes a factory that selects provider implementation at runtime.

- [ ] **Step 1: Rewrite LLMAdapter with factory pattern**

```js
import Anthropic from '@anthropic-ai/sdk';
import config from '../config.js';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function isRetryable(err) {
  const msg = err.message || ''
  return msg.includes('timeout') || msg.includes('5xx') ||
    msg.includes('rate limit') || msg.includes('network') ||
    msg.includes('ECONNRESET') || msg.includes('429') || msg.includes('503')
}

export class LLMAdapter {
  constructor(options = {}) {
    this.provider = options.provider || config.aiProvider || 'claude'
    this.apiKey = options.apiKey || config.claudeApiKey || ''
    this.baseUrl = options.baseUrl || this._defaultBaseUrl()
    this.model = options.model || this._defaultModel()
    this.maxTokens = parseInt(options.maxTokens, 10) || parseInt(config.aiMaxTokens, 10) || 4096
  }

  _defaultBaseUrl() {
    const urls = {
      claude: 'https://api.anthropic.com',
      deepseek: 'https://api.deepseek.com',
      openai: 'https://api.openai.com',
    }
    return urls[this.provider] || urls.claude
  }

  _defaultModel() {
    const models = {
      claude: config.claudeModel || 'claude-sonnet-4-20250514',
      deepseek: 'deepseek-chat',
      openai: 'gpt-4o',
    }
    return models[this.provider] || models.claude
  }

  async generateStream(prompt, systemPrompt, onToken, onProgress, options = {}) {
    if (!this.apiKey) throw new Error('API Key 未配置')

    const maxRetries = options.maxRetries ?? 3
    const baseDelay = 1000
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.provider === 'claude') {
          return await this._streamClaude(prompt, systemPrompt, onToken, onProgress)
        }
        return await this._streamOpenAI(prompt, systemPrompt, onToken, onProgress)
      } catch (err) {
        lastError = err
        if (attempt < maxRetries && isRetryable(err)) {
          onProgress?.({ step: 'retrying', message: `连接失败，${attempt}/${maxRetries} 次重试...` })
          await sleep(baseDelay * Math.pow(2, attempt - 1))
        } else {
          break
        }
      }
    }
    throw lastError
  }

  async _streamClaude(prompt, systemPrompt, onToken, onProgress) {
    const client = new Anthropic({ apiKey: this.apiKey })
    onProgress?.({ step: 'analyzing', message: '正在分析需求...' })

    const stream = await client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    onProgress?.({ step: 'generating', message: '正在生成页面...' })
    let fullContent = ''

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullContent += chunk.delta.text
        onToken?.(chunk.delta.text)
      }
    }

    onProgress?.({ step: 'finalizing', message: '正在优化输出...' })
    return fullContent
  }

  async _streamOpenAI(prompt, systemPrompt, onToken, onProgress) {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/v1/chat/completions`
    onProgress?.({ step: 'analyzing', message: '正在分析需求...' })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: true,
        max_tokens: this.maxTokens,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`API ${response.status}: ${errText}`)
    }

    onProgress?.({ step: 'generating', message: '正在生成页面...' })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onToken?.(content)
          }
        } catch { /* skip malformed chunks */ }
      }
    }

    onProgress?.({ step: 'finalizing', message: '正在优化输出...' })
    return fullContent
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/ai/llm.js
git commit -m "feat: LLMAdapter 工厂模式重构，支持多 Provider 和自动重试"
```

---

### Task 2: Prompts — Quality Improvement + Tailwind Support

**Files:**
- Modify: `server/src/ai/prompts.js`

- [ ] **Step 1: Rewrite prompts.js with enhanced system prompt and scene awareness**

```js
export function systemPrompt(options = {}) {
  const useTailwind = options.useTailwind !== false
  return `你是一个 HTML 原型生成助手。根据用户需求生成可直接运行的 HTML 页面。

核心规则：
1. 使用内联 CSS${useTailwind ? ' 或 Tailwind CSS CDN (https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css)' : ''}
2. 响应式设计，移动端优先
3. 美观、现代化的 UI 风格
4. 仅返回完整 HTML 代码，不包含 markdown 代码块标记
5. 包含 <!DOCTYPE html> 声明
6. 中文界面（除非用户指定其他语言）
7. 使用语义化 HTML 标签

UI 风格指南：
- 柔和圆角 (8-12px)，层次分明的阴影
- 和谐的配色方案，适当的留白
- 清晰的视觉层级，可访问的色彩对比`;
}

export function generatePrompt(userInput) {
  return `请生成一个 HTML 页面。用户需求：${userInput}`;
}

export function modifyPrompt(html, userInput) {
  return `以下是一个已有的 HTML 页面源码，请根据用户的需求修改它。

用户需求：${userInput}

HTML 源码：
${html}

请直接返回修改后的完整 HTML 代码（不包含 markdown 标记）。保留原有结构和样式，仅按需求调整。`;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/ai/prompts.js
git commit -m "feat: 增强系统 prompt，加入 Tailwind 支持和 UI 风格指南"
```

---

### Task 3: Routes — Progress Events + Cancel Detection + Test Endpoint

**Files:**
- Modify: `server/src/routes/ai.js`
- Modify: `server/src/config.js`

- [ ] **Step 1: Add progress events and cancel detection to generate route**

Add progress SSE events and `req.on('close')` handling to both `/ai/generate` and `/ai/modify`. Add a `POST /api/ai/test` endpoint.

```js
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db/connection.js';
import { LLMAdapter } from '../ai/llm.js';
import { systemPrompt, generatePrompt, modifyPrompt } from '../ai/prompts.js';
import config from '../config.js';

const router = Router();

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function extractAiConfig(req) {
  return {
    provider: req.headers['x-ai-provider'] || undefined,
    apiKey: req.headers['x-ai-api-key'] || undefined,
    baseUrl: req.headers['x-ai-base-url'] || undefined,
    model: req.headers['x-ai-model'] || undefined,
    maxTokens: req.headers['x-ai-max-tokens'] || undefined,
  }
}

// Test connection
router.post('/ai/test', async (req, res, next) => {
  try {
    const aiConfig = extractAiConfig(req)
    if (!aiConfig.apiKey) {
      return res.status(400).json({ ok: false, error: '请提供 API Key' })
    }
    const adapter = new LLMAdapter(aiConfig)
    let receivedAny = false
    await adapter.generateStream('回复"ok"即可', '你是一个测试助手。只回复"ok"。', () => { receivedAny = true }, () => {}, { maxRetries: 1 })
    res.json({ ok: true, message: '连接成功' })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  }
})

// AI Generate
router.post('/ai/generate', async (req, res) => {
  const { prompt, projectId } = req.body
  if (!prompt || !projectId) {
    return res.status(400).json({ error: { message: '缺少必要参数 prompt 或 projectId' } })
  }

  const db = getDb()
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId)
  if (!project) return res.status(404).json({ error: { message: '项目不存在' } })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  let aborted = false
  req.on('close', () => { aborted = true })

  const aiConfig = extractAiConfig(req)
  const adapter = new LLMAdapter(aiConfig)

  sse(res, 'progress', { step: 'starting', message: '正在准备生成环境...' })

  let fullHtml = ''
  const filename = `ai-${uuid()}.html`
  const onToken = (token) => { if (!aborted) sse(res, 'token', { html: token }) }
  const onProgress = (p) => { if (!aborted) sse(res, 'progress', p) }

  try {
    fullHtml = await adapter.generateStream(
      generatePrompt(prompt), systemPrompt(), onToken, onProgress
    )
  } catch (err) {
    if (!aborted) {
      sse(res, 'error', { error: err.message })
      res.end()
    }
    return
  }

  if (aborted) { res.end(); return }

  if (!fullHtml.trim()) {
    sse(res, 'error', { error: '生成内容为空，请重试' })
    res.end()
    return
  }

  const filePath = path.resolve(config.uploadDir, filename)
  fs.writeFileSync(filePath, fullHtml, 'utf-8')

  const ptid = uuid()
  const name = `AI 生成-${new Date().toLocaleString('zh-CN')}`
  db.prepare('INSERT INTO prototypes (id, project_id, folder_id, name) VALUES (?, ?, NULL, ?)').run(ptid, projectId, name)

  const versionNumber = 1
  const versionId = uuid()
  db.prepare(
    'INSERT INTO prototype_versions (id, project_id, prototype_id, version_number, title, source, html_file_path) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(versionId, projectId, ptid, versionNumber, 'AI 生成', 'ai', filename)

  db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId)
  db.prepare("UPDATE prototypes SET updated_at = datetime('now') WHERE id = ?").run(ptid)

  sse(res, 'done', { versionId, prototypeId: ptid, name })
  res.end()
})

// AI Modify
router.post('/ai/modify', async (req, res) => {
  const { versionId, prompt } = req.body
  if (!versionId || !prompt) {
    return res.status(400).json({ error: { message: '缺少必要参数 versionId 或 prompt' } })
  }

  const db = getDb()
  const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ?').get(versionId)
  if (!version) return res.status(404).json({ error: { message: '版本不存在' } })

  const filePath = path.resolve(config.uploadDir, version.html_file_path)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: { message: 'HTML 文件不存在' } })

  const originalHtml = fs.readFileSync(filePath, 'utf-8')

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  let aborted = false
  req.on('close', () => { aborted = true })

  const aiConfig = extractAiConfig(req)
  const adapter = new LLMAdapter(aiConfig)

  sse(res, 'progress', { step: 'starting', message: '正在准备生成环境...' })

  let fullHtml = ''
  const filename = `ai-${uuid()}.html`
  const onToken = (token) => { if (!aborted) sse(res, 'token', { html: token }) }
  const onProgress = (p) => { if (!aborted) sse(res, 'progress', p) }

  try {
    fullHtml = await adapter.generateStream(
      modifyPrompt(originalHtml, prompt), systemPrompt(), onToken, onProgress
    )
  } catch (err) {
    if (!aborted) {
      sse(res, 'error', { error: err.message })
      res.end()
    }
    return
  }

  if (aborted) { res.end(); return }

  if (!fullHtml.trim()) {
    sse(res, 'error', { error: '生成内容为空，请重试' })
    res.end()
    return
  }

  const outPath = path.resolve(config.uploadDir, filename)
  fs.writeFileSync(outPath, fullHtml, 'utf-8')

  const maxVer = db.prepare('SELECT MAX(version_number) AS max_ver FROM prototype_versions WHERE prototype_id = ?').get(version.prototype_id)
  const versionNumber = (maxVer?.max_ver || 0) + 1
  const newVersionId = uuid()
  db.prepare(
    'INSERT INTO prototype_versions (id, project_id, prototype_id, version_number, title, source, html_file_path, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(newVersionId, version.project_id, version.prototype_id, versionNumber, prompt.slice(0, 100), 'ai', filename, version.folder_id)

  db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(version.project_id)
  const prototype = db.prepare('SELECT name FROM prototypes WHERE id = ?').get(version.prototype_id)

  sse(res, 'done', { versionId: newVersionId, prototypeId: version.prototype_id, name: prototype?.name || '' })
  res.end()
})

export default router;
```

- [ ] **Step 2: Update config.js with aiMaxTokens**

```js
// Add to config object:
aiMaxTokens: process.env.AI_MAX_TOKENS || '8192',
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/ai.js server/src/config.js
git commit -m "feat: AI 路由增强 - progress 事件、取消检测、test 端点、配置传递"
```

---

### Task 4: aiStore — Cancel, Progress, History Management

**Files:**
- Modify: `client/src/stores/aiStore.js`

- [ ] **Step 1: Rewrite aiStore with cancel support, progress, history, and config headers**

```js
import { defineStore } from 'pinia'

function loadHistory(projectId) {
  try {
    const raw = localStorage.getItem('ai_history')
    const all = raw ? JSON.parse(raw) : {}
    return all[projectId] || []
  } catch { return [] }
}

function saveHistoryAll(projectId, conversations) {
  try {
    const raw = localStorage.getItem('ai_history')
    const all = raw ? JSON.parse(raw) : {}
    all[projectId] = conversations.slice(0, 50)
    localStorage.setItem('ai_history', JSON.stringify(all))
  } catch { /* ignore */ }
}

function loadAiConfig() {
  try {
    const raw = localStorage.getItem('aiProviderConfig')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export const useAiStore = defineStore('ai', {
  state: () => ({
    messages: [],
    loading: false,
    streamingHtml: '',
    panelOpen: false,
    mode: 'generate',
    currentVersionId: null,
    lastResult: null,
    abortController: null,
    progress: null, // { step, message }
    currentConvId: null,
    conversations: [],
    projectId: null,
  }),

  actions: {
    // --- Panel ---
    togglePanel() {
      this.panelOpen = !this.panelOpen
      if (this.panelOpen) {
        if (this.projectId) this.loadConversationList(this.projectId)
      } else {
        if (this.projectId && this.messages.length > 0) this.saveCurrentConversation()
        this.streamingHtml = ''
        this.lastResult = null
        this.progress = null
      }
    },

    openForModify(versionId) {
      this.mode = 'modify'
      this.currentVersionId = versionId
      this.messages = []
      this.streamingHtml = ''
      this.lastResult = null
      this.progress = null
      this.currentConvId = null
      this.panelOpen = true
    },

    openForGenerate() {
      this.mode = 'generate'
      this.currentVersionId = null
      this.messages = []
      this.streamingHtml = ''
      this.lastResult = null
      this.progress = null
      this.currentConvId = null
      this.panelOpen = true
    },

    // --- Send / Cancel ---
    cancelGeneration() {
      this.abortController?.abort()
      this.abortController = null
      this.loading = false
      this.progress = null
    },

    async sendMessage(prompt, projectId) {
      if (!prompt.trim() || this.loading) return

      this.projectId = projectId
      this.messages.push({ role: 'user', content: prompt })
      this.loading = true
      this.streamingHtml = ''
      this.lastResult = null
      this.progress = { step: 'starting', message: '正在连接...' }

      const controller = new AbortController()
      this.abortController = controller

      try {
        const endpoint = this.mode === 'modify' && this.currentVersionId
          ? '/api/ai/modify' : '/api/ai/generate'

        const body = this.mode === 'modify' && this.currentVersionId
          ? { prompt, versionId: this.currentVersionId }
          : { prompt, projectId }

        const aiConfig = loadAiConfig()
        const headers = {
          'Content-Type': 'application/json',
        }
        if (aiConfig.provider) headers['x-ai-provider'] = aiConfig.provider
        if (aiConfig.apiKey) headers['x-ai-api-key'] = aiConfig.apiKey
        if (aiConfig.baseUrl) headers['x-ai-base-url'] = aiConfig.baseUrl
        if (aiConfig.model) headers['x-ai-model'] = aiConfig.model
        if (aiConfig.maxTokens) headers['x-ai-max-tokens'] = String(aiConfig.maxTokens)

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error?.message || 'AI 请求失败')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let eventType = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (eventType === 'token') {
                this.streamingHtml += data.html
              } else if (eventType === 'done') {
                this.lastResult = data
                this.messages.push({ role: 'assistant', content: this.streamingHtml })
                this.streamingHtml = ''
                this.progress = null
              } else if (eventType === 'error') {
                throw new Error(data.error)
              } else if (eventType === 'progress') {
                this.progress = data
              }
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          this.messages.push({ role: 'assistant', content: '⚠️ 已取消生成' })
        } else {
          this.messages.push({ role: 'assistant', content: `错误: ${err.message}` })
        }
      } finally {
        this.loading = false
        this.abortController = null
      }
    },

    // --- Regenerate ---
    regenerateLast(projectId) {
      const lastUserMsg = [...this.messages].reverse().find(m => m.role === 'user')
      if (!lastUserMsg) return
      // Remove last assistant message
      const lastIdx = this.messages.length - 1
      if (this.messages[lastIdx]?.role === 'assistant') {
        this.messages.pop()
      }
      this.sendMessage(lastUserMsg.content, projectId)
    },

    // --- History ---
    loadConversationList(projectId) {
      this.projectId = projectId
      this.conversations = loadHistory(projectId)
    },

    saveCurrentConversation() {
      if (!this.projectId || this.messages.length === 0) return
      const conversations = loadHistory(this.projectId)
      const idx = conversations.findIndex(c => c.id === this.currentConvId)
      const entry = {
        id: this.currentConvId || `conv_${Date.now()}`,
        title: this.messages[0]?.content?.slice(0, 30) || 'AI 对话',
        mode: this.mode,
        createdAt: new Date().toISOString(),
        messages: JSON.parse(JSON.stringify(this.messages)),
        lastResult: this.lastResult ? { ...this.lastResult } : null,
      }
      if (idx >= 0) {
        conversations[idx] = entry
      } else {
        conversations.unshift(entry)
      }
      this.currentConvId = entry.id
      saveHistoryAll(this.projectId, conversations)
      this.conversations = conversations
    },

    restoreConversation(projectId, convId) {
      const conversations = loadHistory(projectId)
      const conv = conversations.find(c => c.id === convId)
      if (!conv) return
      this.messages = JSON.parse(JSON.stringify(conv.messages))
      this.mode = conv.mode
      this.lastResult = conv.lastResult ? { ...conv.lastResult } : null
      this.currentConvId = conv.id
      this.currentVersionId = conv.mode === 'modify' ? conv.lastResult?.versionId || null : null
      this.streamingHtml = ''
      this.progress = null
    },

    deleteHistory(projectId, convId) {
      const conversations = loadHistory(projectId).filter(c => c.id !== convId)
      saveHistoryAll(projectId, conversations)
      this.conversations = conversations
    },

    renameHistory(projectId, convId, title) {
      const conversations = loadHistory(projectId)
      const conv = conversations.find(c => c.id === convId)
      if (conv) {
        conv.title = title
        saveHistoryAll(projectId, conversations)
        this.conversations = conversations
      }
    },

    clearMessages() {
      this.messages = []
      this.streamingHtml = ''
      this.lastResult = null
      this.progress = null
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add client/src/stores/aiStore.js
git commit -m "feat: aiStore 增强 - 取消生成、进度状态、对话历史管理、多Provider配置传递"
```

---

### Task 5: AiPanel.vue — Templates, Preview, Cancel, History, Regenerate

**Files:**
- Modify: `client/src/components/AiPanel.vue`

- [ ] **Step 1: Rewrite AiPanel.vue with all new features**

```vue
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
          <div v-for="(msg, i) in store.messages" :key="`msg-${i}`" class="msg-item">
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
              <!-- Regenerate button for completed AI messages -->
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
            <pre class="text-xs bg-[var(--c-surface-hover)] border border-[var(--c-border-light)] rounded-[var(--radius-md)] p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto text-[var(--c-text)]">{{ store.streamingHtml }}<span class="typing-cursor">|</span></pre>
            <!-- Live Preview -->
            <div v-if="store.streamingHtml.length > 50" class="mt-2">
              <button class="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors mb-1"
                @click="previewExpanded = !previewExpanded">
                {{ previewExpanded ? '收起预览 ▲' : '实时预览 ▼' }}
              </button>
              <div v-show="previewExpanded" class="border border-[var(--c-border-light)] rounded-[var(--radius-md)] overflow-hidden">
                <iframe
                  :srcdoc="previewHtml"
                  sandbox="allow-scripts"
                  class="w-full bg-white"
                  :style="{ height: previewHeight + 'px' }"
                ></iframe>
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
              <button v-else
                class="text-sm bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white px-4 py-1.5 rounded-[var(--radius-sm)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-soft"
                :disabled="!input.trim()" @click="send">
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply button (floating at bottom when done) -->
    <div v-if="store.lastResult && !store.loading"
      class="absolute bottom-20 right-4 z-10">
      <button
        class="bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white text-sm px-4 py-2 rounded-[var(--radius-md)] shadow-lifted hover:-translate-y-0.5 transition-all"
        @click="applyToPrototype">
        应用到原型
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useAiStore } from '../stores/aiStore'

const props = defineProps({
  projectId: { type: String, required: true },
})
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

// Debounced preview HTML (update every 500ms while streaming)
const previewHtml = ref('')
let previewTimer = null
watch(() => store.streamingHtml, (val) => {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    previewHtml.value = val || ''
  }, 500)
}, { immediate: true })

let previewResizeTimer = null
watch(previewHtml, () => {
  if (previewResizeTimer) clearTimeout(previewResizeTimer)
  previewResizeTimer = setTimeout(() => {
    previewHeight.value = 200
  }, 600)
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

// Auto-scroll
watch([() => store.messages.length, () => store.streamingHtml], async () => {
  await nextTick()
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight
  }
})

// Save conversation on panel close
watch(() => store.panelOpen, (open) => {
  if (!open && store.messages.length > 0) {
    store.saveCurrentConversation()
  }
})

// Load history on mount
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
```

- [ ] **Step 2: Update ProjectDetail.vue to remove duplicate panelOpen toggle**

The AiPanel now self-manages its `panelOpen` state. Ensure the AI button in ProjectDetail toolbar properly sets `store.panelOpen`:

```vue
<!-- In toolbar, the AI button should use aiStore.panelOpen toggle -->
<button ... @click="aiStore.panelOpen ? aiStore.panelOpen = false : aiStore.openForGenerate()">
```

(Already done in the Luma redesign.)

- [ ] **Step 3: Commit**

```bash
git add client/src/components/AiPanel.vue
git commit -m "feat: AiPanel 升级 - 模板库、实时预览、取消按钮、重新生成、历史侧栏"
```

---

### Task 6: Settings — AI Service Configuration Card

**Files:**
- Modify: `client/src/pages/Settings.vue`

- [ ] **Step 1: Add AI service config section to Settings.vue**

```vue
<!-- Add this inside the settings div, after the existing toggle cards -->
<div class="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] mt-3">
  <div class="p-5 border-b border-[var(--c-border-light)]">
    <h3 class="text-sm font-medium text-[var(--c-text)]">AI 服务配置</h3>
    <p class="text-xs text-[var(--c-text-secondary)] mt-0.5">配置 AI 生成使用的模型服务</p>
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
```

Add to script:

```js
import { ref, reactive, watch } from 'vue'

// AI config
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
const testResult = ref(null) // true | false | null
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Settings.vue
git commit -m "feat: 设置页 AI 服务配置 - 多 Provider、端点、Key、上下文长度、测试连接"
```

---

### Task 7: Config — Add aiMaxTokens to .env.example

- [ ] **Step 1: Add AI config field**

```bash
AI_MAX_TOKENS=8192
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: 添加 AI_MAX_TOKENS 配置项"
```

---

## Self-Review

**Spec coverage check:**
1. Prompt 模板库 → Task 5 (TEMPLATES array in AiPanel.vue)
2. 实时预览 → Task 5 (debounced iframe srcdoc in AiPanel.vue)
3. 取消生成 → Task 4 (AbortController in aiStore) + Task 3 (req.on('close') in routes)
4. 重试机制 → Task 1 (isRetryable + retry loop in LLMAdapter)
5. 对话历史管理 → Task 4 (localStorage CRUD in aiStore) + Task 5 (history sidebar)
6. AI 服务配置 → Task 6 (Settings.vue config card)
7. 生成进度 → Task 3 (progress SSE events in routes) + Task 4 (progress state in aiStore)
8. Prompt 质量 → Task 2 (enhanced systemPrompt with Tailwind + UI guide)

All covered. No placeholders. Type consistency verified.
