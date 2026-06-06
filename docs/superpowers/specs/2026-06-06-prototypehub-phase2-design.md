# PrototypeHub Phase 2 设计文档

> 本文档是 Phase 2 的开发蓝图，包含 AI 对话生成原型、AI 微调、用户系统、体验优化四个方向的设计。每个方向拆分为独立的子项目，可分批实现。

---

## 一、总体路线

```
第一批（核心）：AI 对话生成原型 → AI 微调已有原型
第二批（穿插）：体验打磨（标注拖拽移动、暗色模式等）
第三批（独立）：用户系统（登录注册、权限）
```

### 依赖关系

```
AI 生成 ──→ AI 微调（基于已有原型做增量修改）
                ↑
用户系统 ────→ 权限控制（谁可以用 AI、谁可以标注）
                ↓
           体验优化（独立，不依赖其他模块）
```

---

## 二、方向 A：AI 对话生成原型

### 2.1 概述

在平台内集成 AI 对话面板，用户通过自然语言对话直接生成 HTML 原型，生成的页面自动创建为版本。

### 2.2 架构

```
┌─────────────────────────────────────────────┐
│              前端 AI 对话面板                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐│
│  │ 消息列表   │  │ 输入框    │  │ 生成预览    ││
│  │ (历史消息) │  │ + 发送   │  │ (流式展示)  ││
│  └──────────┘  └──────────┘  └─────────────┘│
└────────────────────┬────────────────────────┘
                     │ POST /api/ai/generate (SSE)
┌────────────────────┴────────────────────────┐
│            AI 网关层                          │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐│
│  │ API 路由  │  │ LLM 适配  │  │ prompt 模板 ││
│  │          │  │ (Claude) │  │ 工程        ││
│  └──────────┘  └──────────┘  └─────────────┘│
└─────────────────────────────────────────────┘
```

### 2.3 API 设计

```
POST /api/ai/generate
  Body: { prompt: string, projectId: string }
  Response: SSE (text/event-stream)
    event: token  → 流式返回生成的 HTML 片段
    event: done   → 生成完成，返回 versionId
    event: error  → 生成失败

POST /api/ai/modify
  Body: { versionId: string, prompt: string }
  Response: SSE (同上)
  说明：基于已有版本生成新版本
```

### 2.4 LLM 适配层

```js
// server/src/ai/llm.js
// 适配不同 LLM 提供商

class LLMAdapter {
  constructor(provider = 'claude') {
    // 从 .env 读取 API_KEY
  }

  async generateStream(prompt, systemPrompt, onToken) {
    // 调用 Claude API (stream: true)
    // 逐 token 回调 onToken
    // 返回完整内容
  }
}
```

支持的提供商：Claude (Anthropic SDK)、OpenAI（后续）

### 2.5 Prompt 工程

**系统 Prompt：**
```
你是一个 HTML 原型生成助手。根据用户的需求生成可直接运行的 HTML 页面。
要求：
1. 使用内联 CSS（不依赖外部资源）
2. 响应式设计
3. 美观、现代化 UI 风格
4. 仅返回 HTML 代码（不包含 markdown 代码块标记）
5. 不要包含 ```html 或 ``` 标记
```

### 2.6 前端 AI 对话面板

```
┌─────────────────────────────────────────┐
│  AI 生成原型           [关闭] [收起]    │
├─────────────────────────────────────────┤
│                                         │
│  用户: 帮我生成一个登录页面              │
│  ─────────────────────────────────────  │
│  AI: 正在生成...                        │
│  <h1>Login</h1>...                     │
│                                         │
│  [应用到原型]  [重新生成]               │
│                                         │
├─────────────────────────────────────────┤
│  [输入框...                    ] [发送] │
└─────────────────────────────────────────┘
```

**文件：**
- `client/src/components/AiPanel.vue` — AI 对话面板组件
- `client/src/stores/aiStore.js` — AI 对话状态管理

**交互流程：**
1. 点击工具栏 AI 按钮 → 右侧弹出面板
2. 输入需求 → 发送 → SSE 流式展示生成的 HTML
3. 点击"应用到原型" → 创建新版本 / 替换当前版本
4. 可折叠，不影响原型查看

### 2.7 后端文件

- `server/src/routes/ai.js` — AI 生成和微调路由
- `server/src/ai/llm.js` — LLM 适配层
- `server/src/ai/prompts.js` — Prompt 模板管理

### 2.8 配置

```env
# .env 新增
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-xxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
```

---

## 三、方向 B：AI 微调已有原型

### 3.1 概述

选中已有版本，输入修改需求，AI 读取当前版本 HTML 后生成新版本。

### 3.2 流程

```
选中版本 → 点击"AI 微调"
  → 后端读取当前版本的 HTML 内容
  → 构造 prompt（当前 HTML + 用户需求）
  → 调用 LLM 生成新 HTML
  → 创建新版本（version_number + 1）
  → 自动切换到新版本展示
```

### 3.3 实现要点

- 微调路由 `POST /api/ai/modify` 需要读取 `version.html_file_path` 的原始 HTML
- Prompt 中附带当前 HTML 源码作为上下文
- 生成的 HTML 保存为新文件，创建新的 PrototypeVersion

### 3.4 前端交互

- 在版本详情区域或工具栏添加"AI 微调"按钮
- 点击后弹出输入框："描述你想修改的内容..."
- 发送后显示 loading，完成后自动展示新版本

---

## 四、方向 C：用户系统

### 4.1 概述

添加用户注册/登录功能，JWT 鉴权，权限控制。

### 4.2 数据模型

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 为 API 添加用户 ID 关联
-- annotations.author → annotations.user_id (后续迁移)
-- comments.author → comments.user_id (后续迁移)
```

### 4.3 API 设计

```
POST /api/auth/register — 注册（username, password）
POST /api/auth/login    — 登录，返回 JWT token
GET  /api/auth/me       — 获取当前用户信息（需 token）
```

### 4.4 前端

- 登录/注册页面
- JWT token 存储在 localStorage
- API 请求自动附带 Authorization header
- 作者名改为从登录用户自动获取

### 4.5 实现顺序

Phase 3 实现，不在当前 Phase 2 范围内。

---

## 五、方向 D：体验打磨

### 5.1 标注拖拽移动位置

**现状：** 标注创建后位置固定，无法调整。
**实现：** 在手型模式下，长按或拖拽标注标记移动位置。与现有的"拖拽创建"区分开。

**改动点：**
- `AnnotationLayer.vue` — 标注点增加 `draggable` 支持（已实现）
- 拖拽释放时调用 `updateAnnotation` 更新 x/y 坐标

### 5.2 暗色模式

**设计：**
- 使用 Tailwind 的 `dark:` 前缀
- 通过 CSS 变量或 Tailwind class 切换
- 存储在 localStorage，全局生效

**文件：**
- `client/src/stores/uiStore.js` — 增加 `darkMode` 状态
- `client/src/App.vue` — 添加 `dark` class 控制
- 各组件增加 `dark:` 样式

### 5.3 其他优化

- 标注列表空状态优化（显示示例引导）
- 上传拖拽区域（拖拽文件到页面直接上传）
- 自动保存草稿标注内容

---

## 六、文件清单（Phase 2 新增/修改）

```
server/
├── src/
│   ├── ai/
│   │   ├── llm.js            # LLM 适配层
│   │   └── prompts.js        # Prompt 模板
│   ├── routes/
│   │   └── ai.js             # AI 生成/微调路由
│   └── middleware/
│       └── auth.js           # JWT 鉴权中间件（Phase 3）

client/
├── src/
│   ├── components/
│   │   └── AiPanel.vue       # AI 对话面板
│   ├── stores/
│   │   ├── aiStore.js        # AI 对话状态
│   │   └── authStore.js      # 登录状态（Phase 3）
│   ├── pages/
│   │   ├── Login.vue         # 登录页（Phase 3）
│   │   └── Register.vue      # 注册页（Phase 3）
│   └── utils/
│       └── auth.js           # JWT 管理（Phase 3）
```

---

## 七、实现顺序建议

```
Step 1: AI LLM 适配层 + 配置
  → 创建 server/src/ai/llm.js, prompts.js
  → 配置 .env（API_KEY 等）
  → 命令行测试 LLM 调用

Step 2: AI 生成 API + 前端对话面板
  → SSE 流式响应
  → 前端 AiPanel.vue 组件
  → 应用到原型按钮

Step 3: AI 微调 API
  → 读取已有 HTML
  → 增量修改 prompt
  → 创建新版本

Step 4: 体验优化
  → 标注拖拽移动
  → 暗色模式（可选）
```

---

## 八、技术选型说明

### SSE vs WebSocket

选择 SSE（Server-Sent Events）而非 WebSocket：
- 单向通信（服务器→客户端），SSE 天然合适
- 实现简单，无需额外库
- Express 原生支持
- 前端使用 `EventSource` API

### LLM 版本

默认使用 Claude Sonnet 4，可通过 `.env` 配置模型：
- Sonnet 4：速度快，适合原型生成
- Opus 4：质量高，适合复杂修改

### 安全性

- API Key 存储在服务端 `.env`，不暴露给前端
- 每次 AI 调用走后端代理，前端不直接调 LLM API
- 生成的 HTML 走原有 sandbox iframe 安全渲染
