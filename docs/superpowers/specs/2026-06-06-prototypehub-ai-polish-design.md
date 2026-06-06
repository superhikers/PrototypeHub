# PrototypeHub AI 体验打磨设计文档

> 基于 Phase 2 设计文档的 AI 部分深化，聚焦 AI 面板的体验升级和 Provider 灵活性。

## 目标

将 AI 生成/微调功能从"可用"打磨到"好用"：提供多 Provider 支持、实时预览、历史管理、Prompt 模板库，以及完善的错误处理和重试机制。

## 模块设计

### 1. Prompt 模板库

**位置：** `AiPanel.vue` 输入框上方

6 个场景模板按钮，点击自动填充输入框：

```js
const TEMPLATES = [
  { icon: '🔐', label: '登录页', prompt: '生成一个美观的登录/注册页面，包含邮箱和密码输入框、登录按钮、注册链接，支持暗色模式' },
  { icon: '📊', label: '仪表盘', prompt: '生成一个数据仪表盘页面，包含统计卡片（4个）、折线图区域、最近活动列表和顶部导航栏' },
  { icon: '📝', label: '表单', prompt: '生成一个表单页面，包含文本输入、下拉选择、单选/复选框、日期选择器和提交按钮，带验证样式' },
  { icon: '📄', label: 'Landing', prompt: '生成一个产品 landing page，包含英雄区（大标题+副标题+CTA按钮）、功能特色网格、用户评价轮播和页脚' },
  { icon: '📑', label: '表格', prompt: '生成一个数据表格页面，包含搜索框、筛选标签、分页和数据统计行' },
  { icon: '🛑', label: '错误页', prompt: '生成一个 404 错误页面，包含大号状态码、友好提示文字和返回首页按钮' },
]
```

**交互：** 点击模板按钮 → 清空并填入 prompt 到输入框 → 自动聚焦

### 2. 实时预览

**位置：** `AiPanel.vue`，折叠在流式 HTML 代码下方

- 当 `streamingHtml` 非空时，显示一个 mini iframe
- 使用 `debounce(500)` 将 `streamingHtml` 写入 iframe 的 `srcdoc`
- iframe 属性：`sandbox="allow-scripts"`，尺寸自适应面板宽度
- 高度：默认 200px，可点击展开到 400px
- 内容为空时隐藏

```
┌──────────────────────────┐
│  <pre>流式 HTML 代码</pre> │
│                          │
│  ┌───── 预览 ─────┐      │
│  │  iframe srcdoc  │ ▲   │
│  │                 │ │   │
│  └─────────────────┘ ▼   │
│         [展开/收起]       │
└──────────────────────────┘
```

### 3. 取消生成

**前端：** 使用 `AbortController`

```js
// aiStore.js 新增
state: { abortController: null }

// sendMessage 中
const controller = new AbortController()
this.abortController = controller
const response = await fetch(endpoint, { signal: controller.signal })

// 新增 action
cancelGeneration() {
  this.abortController?.abort()
  this.loading = false
  this.abortController = null
}
```

**后端：** Express 检测 `req.on('close')` 停止 LLM 调用

```js
req.on('close', () => {
  // 停止 LLM stream
})
```

**UI：** 生成中发送按钮变为红色"取消"按钮

### 4. 重试机制

**后端自动重试（`llm.js`）：**

```js
async generateStream(prompt, systemPrompt, onToken, onProgress, options = {}) {
  const maxRetries = options.maxRetries ?? 3
  const baseDelay = 1000
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this._doStream(prompt, systemPrompt, onToken, onProgress)
    } catch (err) {
      lastError = err
      if (attempt < maxRetries && isRetryable(err)) {
        await sleep(baseDelay * Math.pow(2, attempt - 1))
        onProgress?.({ step: 'retrying', message: `重试第 ${attempt} 次...` })
      }
    }
  }
  throw lastError
}

function isRetryable(err) {
  // 网络错误、5xx、限流可重试；4xx 不可重试
}
```

**前端重新生成：** 
- 生成完成后，在 AI 回复下方显示"重新生成"按钮
- 点击后使用相同 prompt 重新调用

### 5. 对话历史管理

**存储：** `localStorage`，key 为 `ai_history`

```js
// 数据结构
{
  [projectId]: [
    {
      id: 'conv_xxx',
      title: string,          // 自动从首条消息截取
      mode: 'generate' | 'modify',
      createdAt: ISO string,
      messages: Array,        // 完整消息列表
      lastResult: object|null // 上次生成结果
    }
  ]
}
```

**交互：**
- AI 面板顶部新增历史按钮（时钟图标）
- 点击展开历史侧栏（覆盖在面板上层）
- 显示对话列表（标题 + 日期 + 模式标签）
- 点击恢复对话
- 每条可重命名（双击标题）和删除
- 自动保存：关闭面板时保存当前对话
- 上限 50 条，超出自动淘汰最旧

**aiStore 新增 action：**
- `saveHistory(projectId)` — 保存当前对话
- `loadHistory(projectId)` — 加载项目对话列表
- `restoreConversation(projectId, convId)` — 恢复指定对话
- `deleteHistory(projectId, convId)` — 删除
- `renameHistory(projectId, convId, title)` — 重命名

### 6. AI 服务配置

**设置页新增 "AI 服务" 配置卡片：**

```
┌────────────────────────────────┐
│  AI 服务配置                     │
│                                │
│  提供商    [Claude ▼]           │
│  API 地址  [https://api.xxx]   │
│  API Key  [••••••••••••••]    │
│  模型      [deepseek-chat]     │
│  最大上下文 [████████░░░] 8192  │
│                                │
│  [测试连接]                      │
└────────────────────────────────┘
```

**存储：** localStorage key `aiProviderConfig`

```json
{
  "provider": "deepseek",
  "baseUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxx",
  "model": "deepseek-chat",
  "maxTokens": 8192
}
```

**请求传递：** 每次 AI 请求通过请求头发送配置：

```
X-Ai-Provider: deepseek
X-Ai-Base-Url: https://api.deepseek.com
X-Ai-Api-Key: sk-xxx
X-Ai-Model: deepseek-chat
X-Ai-Max-Tokens: 8192
```

**后端 `llm.js` 重构为工厂模式：**

```js
class LLMAdapter {
  constructor(options = {}) {
    // options 来自请求头，优先于 .env
    this.provider = options.provider || config.aiProvider
    this.apiKey = options.apiKey || config.claudeApiKey
    this.baseUrl = options.baseUrl || this._defaultBaseUrl()
    this.model = options.model || this._defaultModel()
    this.maxTokens = options.maxTokens || config.aiMaxTokens || 4096
  }

  _defaultBaseUrl() {
    const urls = { claude: 'https://api.anthropic.com', deepseek: 'https://api.deepseek.com', openai: 'https://api.openai.com' }
    return urls[this.provider] || urls.claude
  }

  async generateStream(prompt, systemPrompt, onToken, onProgress) {
    if (this.provider === 'claude') return this._streamClaude(prompt, systemPrompt, onToken, onProgress)
    // DeepSeek 和 OpenAI 使用兼容的 chat completions API
    return this._streamOpenAICompatible(prompt, systemPrompt, onToken, onProgress)
  }

  async _streamClaude(prompt, systemPrompt, onToken) {
    // Anthropic SDK (现有逻辑，增加 onProgress 和 max_tokens 可配置)
  }

  async _streamOpenAICompatible(prompt, systemPrompt, onToken, onProgress) {
    // 兼容 DeepSeek / OpenAI / 任何 OpenAI-compatible API
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true,
        max_tokens: this.maxTokens,
      })
    })
    // 解析 SSE 流 (与 Anthropic 格式不同)
  }
}
```

**测试连接：** 后端增加临时测试端点 `POST /api/ai/test`，接收配置参数，发送简单测试请求验证连通性。

### 7. 生成进度指示

**后端 SSE 新增 `progress` 事件：**

```js
// routes/ai.js 中调用点
sse(res, 'progress', { step: 'starting', message: '正在准备生成环境...' })
// LLM 调用开始前
onProgress?.({ step: 'analyzing', message: '正在分析需求...' })
// Token 开始到达时
onProgress?.({ step: 'generating', message: '正在生成页面...' })
// 生成接近完成
onProgress?.({ step: 'finalizing', message: '正在优化输出...' })
```

**前端：** 
- `aiStore` 新增 `progress` state `{ step, message }`
- 流式输出区域上方显示进度条或状态文字
- 进度状态：`starting` → `analyzing` → `generating` → `finalizing` → 完成

### 8. Prompt 质量改进

**系统 Prompt 增强（`prompts.js`）：**

```js
export function systemPrompt(options = {}) {
  const useTailwind = options.useTailwind ?? true
  return `你是一个 HTML 原型生成助手。

核心规则：
1. 使用内联 CSS${useTailwind ? ' 或 Tailwind CSS CDN (https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css)' : ''}
2. 响应式设计，移动端优先
3. 美观、现代化的 UI 风格
4. 仅返回完整 HTML 代码，不包含 markdown 代码块标记
5. 包含 <!DOCTYPE html> 声明
6. 中文界面（除非用户指定其他语言）
7. 可访问性：使用语义化 HTML 标签和 ARIA 属性

UI 风格指南：
- 使用柔和圆角 (8-12px)
- 层次分明的阴影
- 和谐的配色方案
- 适当的留白和间距
- 清晰的视觉层级`
}
```

`generatePrompt` 和 `modifyPrompt` 保持简洁，新增场景上下文注入。

## 文件变更清单

```
修改:
  server/src/ai/llm.js              # 工厂模式重构, 多 Provider, 重试, 进度
  server/src/ai/prompts.js          # Prompt 质量改进
  server/src/routes/ai.js           # progress 事件, 取消检测, test 端点
  server/src/config.js              # aiMaxTokens 等配置项 (可选)
  client/src/stores/aiStore.js      # 取消, 历史管理, progress 状态
  client/src/components/AiPanel.vue # 模板库, 预览, 取消, 历史, 重新生成
  client/src/pages/Settings.vue     # AI 服务配置卡片

新增:
  client/src/stores/aiHistoryStore.js # 对话历史管理 store (或合入 aiStore)
```

## 实现顺序

```
第一批（后端重构）:
  LLMAdapter 工厂模式 + 多 Provider + 重试
  → routes/ai.js progress 事件 + 取消检测 + test 端点
  → prompts.js 质量改进

第二批（前端核心）:
  aiStore 改造 (取消, progress, 多 Provider 请求头)
  → AiPanel 改造 (模板库, 预览, 取消按钮, 重新生成)

第三批（配置 + 历史）:
  Settings.vue AI 服务配置
  → 对话历史管理
```

## 排除范围

- 对话树/分支功能
- 对话跨设备同步（仅 localStorage）
- 服务端用户系统
