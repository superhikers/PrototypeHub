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
