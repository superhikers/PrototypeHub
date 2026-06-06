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
    progress: null,
    currentConvId: null,
    conversations: [],
    projectId: null,
  }),

  actions: {
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
        const headers = { 'Content-Type': 'application/json' }
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

    regenerateLast(projectId) {
      const lastUserMsg = [...this.messages].reverse().find(m => m.role === 'user')
      if (!lastUserMsg) return
      const lastIdx = this.messages.length - 1
      if (this.messages[lastIdx]?.role === 'assistant') {
        this.messages.pop()
      }
      this.sendMessage(lastUserMsg.content, projectId)
    },

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
