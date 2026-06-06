# PrototypeHub — AI 驱动原型协作平台设计文档

## 1. 项目概述

### 1.1 定位
AI 驱动的开源原型协作平台。面向**没有产品经理的小型技术团队**，提供从 AI 原型生成、版本管理到团队标注协作的全流程工具，改变传统依赖 Figma/墨刀等专业设计工具的协作模式。

### 1.2 核心价值
- **AI 原生**：通过对话直接生成 HTML 原型，降低原型设计门槛
- **轻量部署**：一行命令启动，无需额外基础设施
- **协作优先**：原型基础上直接标注、评论，需求沟通闭环

### 1.3 目标用户
- 5-20 人的小型技术团队
- 没有专职产品经理
- 希望用 AI 加速原型 - 开发 - 测试流程

---

## 2. 技术栈

| 层级 | 技术 | 选择理由 |
|------|------|----------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS | 上手快、生态成熟、标注 Overlay 交互自然 |
| 后端 | Node.js + Express | 与前端统一语言，部署简单，社区活跃 |
| 数据库 | SQLite + better-sqlite3 | 零配置，单文件，适合小团队场景 |
| 部署 | Docker + docker-compose | 一键启动，团队成员统一环境 |
| AI 网关 | 自定义 LLM 适配层 | 对接 Claude / GPT API |

---

## 3. 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (Vue 3 SPA)                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │  项目面板   │  │  原型渲染器  │  │  标注协作层       │   │
│  │ (项目管理)  │  │ (iframe +  │  │ (便签/评论/回复)  │   │
│  │            │  │  Overlay)  │  │                  │   │
│  └────────────┘  └────────────┘  └──────────────────┘   │
│  ┌──────────────────────────────────────────────────┐    │
│  │            AI 对话面板 (Phase 2)                   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────┴───────────────────────────────┐
│                    后端 (Node.js + Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ 项目管理  │  │ 版本管理  │  │ 注释/评论 │  │ AI 网关 │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │              HTML 文件服务 + 安全沙箱                 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                    数据层                                 │
│  ┌────────────────────┐  ┌───────────────────────────┐  │
│  │  SQLite (结构化数据) │  │  文件系统 (HTML/静态资源)    │  │
│  └────────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.1 安全设计
- 上传的 HTML 原型通过 `sandbox` iframe 隔离渲染，禁止恶意脚本访问父页面数据
- sandbox 属性配置：`sandbox="allow-scripts"`（不加 `allow-same-origin`，防止 iframe 访问父页面 cookie/localStorage）
- iframe 高度自适应通过 `postMessage` 通信：父页面监听 `message` 事件，验证 `event.source === iframeElement.contentWindow` 确保消息来自受控 iframe，iframe 内部加载完成后通过 `postMessage({ type: 'resize', height: document.body.scrollHeight })` 发送高度
- 独立的 `/api/raw/:versionId` 端点服务 HTML 文件，Content-Type 强制为 `text/html; charset=utf-8`
- `/api/raw/:versionId` 返回 HTML 时自动注入 postMessage 脚本（`</body>` 前插入 `<script>parent.postMessage({type:'resize',height:document.body.scrollHeight},'*')</script>`），实现 iframe 高度自适应
- 所有用户输入做 XSS 转义

---

## 4. 数据模型

```
Project (项目)
├── id: string (UUID)
├── name: string
├── description: string
├── createdAt: datetime
├── updatedAt: datetime
│
└── PrototypeVersion (原型版本)
    ├── id: string (UUID)
    ├── projectId: string (FK → Project)
    ├── versionNumber: number (自增 1, 2, 3...)
    ├── title: string (可选描述，如"初版"、"修改登录样式")
    ├── source: enum('upload', 'ai')  // 来源
    ├── htmlFilePath: string (文件系统路径)
    ├── thumbnailPath: string? (缩略图路径)
    ├── createdAt: datetime
    │
    ├── Annotation (标注/便签)
    │   ├── id: string (UUID)
    │   ├── versionId: string (FK → PrototypeVersion)
    │   ├── x: number (% 相对位置)
    │   ├── y: number (% 相对位置)
    │   ├── color: string (便签颜色)
    │   ├── content: string (批注正文)
    │   ├── author: string (创建人)
    │   ├── createdAt: datetime
    │   │
    │   └── Comment (评论)
    │       ├── id: string (UUID)
    │       ├── annotationId: string (FK → Annotation)
    │       ├── author: string
    │       ├── content: string
    │       ├── createdAt: datetime
    │       └── parentId: string? (FK → Comment，支持回复)
```
*（Settings 是 Project 的一对一扩展，非嵌套在 PrototypeVersion 下）*

### Settings (项目设置)
- id: string (UUID)
- projectId: string (FK → Project, 1:1)
- allowComment: boolean (默认 true, 是否允许成员评论)
- allowAnnotate: boolean (默认 false, 是否允许成员创建标注)

---

## 5. API 设计

### 项目管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/:id` | 项目详情 |
| PUT | `/api/projects/:id` | 编辑项目 |
| DELETE | `/api/projects/:id` | 删除项目 |

### 版本管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/versions` | 版本列表 |
| POST | `/api/projects/:pid/versions` | 上传 HTML 文件（multipart/form-data） |
| GET | `/api/projects/:pid/versions/:vid` | 获取版本详情 |
| PUT | `/api/projects/:pid/versions/:vid` | 编辑版本描述 |
| DELETE | `/api/projects/:pid/versions/:vid` | 删除版本 |
| GET | `/api/raw/:vid` | 获取 HTML 原始内容（非 REST，供 iframe 直接引用） |

### 标注与评论
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/versions/:vid/annotations` | 获取版本的所有标注 |
| POST | `/api/versions/:vid/annotations` | 创建标注 |
| PUT | `/api/versions/:vid/annotations/:aid` | 编辑标注 |
| DELETE | `/api/versions/:vid/annotations/:aid` | 删除标注 |
| GET | `/api/annotations/:aid/comments` | 获取评论列表 |
| POST | `/api/annotations/:aid/comments` | 添加评论 |

### 设置
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/settings` | 获取项目设置 |
| PUT | `/api/projects/:pid/settings` | 更新项目设置 |

### AI (Phase 2)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/generate` | 根据需求生成原型 |
| POST | `/api/ai/modify` | 修改已有原型 |

---

## 6. 页面设计

### 6.1 项目列表页 `/`
- 卡片式布局展示所有项目
- 每张卡片：项目名、最新版本号、最近更新时间、标注数量
- "新建项目"按钮 → 弹出对话框，输入项目名称 + 描述
- 新建后自动进入项目详情页

### 6.2 原型详情页 `/project/:id`（核心页面）

三栏布局：

```
┌──────────┬──────────────────────────┬──────────┐
│  左栏     │       中间区域            │  右栏    │
│          │                          │          │
│ 项目信息   │  HTML 原型 (iframe 渲染)  │ 批注详情 │
│ ← 返回列表│                          │          │
│          │                          │          │
│ 版本列表   │  标注便签 ● 叠加其上       │ 评论串   │
│ v1  ←当前 │                          │          │
│ v2        │  工具栏:                  │ 输入框   │
│ v3        │  [手型/标注/删除] 模式切换  │          │
│ [+上传]   │                          │          │
└──────────┴──────────────────────────┴──────────┘
```

**交互流程：**
1. 进入页面默认展示最新版本
2. 点击版本列表切换版本
3. 工具栏：手型模式（浏览）/ 标注模式（点击添加便签）/ 删除模式（删除便签）
4. 标注模式：点击原型任意位置 → 弹出便签输入框 → 选择便签颜色 → 填写内容 → 创建成功（连续标注，无需每次切换模式）
5. 点击已有便签标记 → 右栏显示详情 + 评论列表；再次点击便签内容可进入编辑
6. 删除模式：点击已有便签标记 → 弹出确认"删除此标注？" → 确认后删除（标注及其所有评论一并删除）

**上传交互：**
- 点击左栏 "+" 按钮 → 选择 HTML 文件 → 输入版本描述（如"修改了登录按钮样式"）→ 上传
- 上传成功后自动切换到新版本

**删除确认：**
- 删除项目时弹出确认对话框，提示"将同时删除所有版本和标注"，输入项目名称确认
- 删除版本时弹出确认对话框，提示"将同时删除该版本的所有标注"，确认后删除

### 6.3 设置页 `/project/:id/settings`（下版本实现）
- **允许成员评论**（开关，默认开）：成员可对标注添加评论和回复
- **允许成员标注**（开关，默认关）：成员可自行创建标注
- 所有设置立即生效，无需保存按钮

---

## 7. Phase 划分

### Phase 1（当前范围）
#### 核心功能（本轮实现）
- **项目管理**：创建、查看、编辑、删除（使用浏览器原生 confirm）
- **作者身份**：进入首页弹窗输入作者名，localStorage 持久化；右上角显示当前作者名，支持切换
- **HTML 上传 + 版本管理**：上传 HTML 文件，版本号自动递增；上传按钮显示 loading 反馈
- **HTML 安全渲染**：同源 `/api/raw` 端点服务，sandbox iframe 隔离，`postMessage` 高度自适应
- **标注系统**：点击原型位置创建标注（不做拖拽），支持颜色选择（6 色）、编辑、删除；标注标记为带数字的彩色圆点
- **评论系统**：在标注下添加评论和回复，按时间排列
- **标注列表**：右栏默认为标注列表，点击标注切换为详情+评论，关闭回到列表
- **Docker 部署**：Docker + docker-compose，数据目录 volume 持久化

#### 设计决策说明
- 标注系统去掉了拖拽创建方式，第一版仅实现点击创建，降低交互复杂度
- 删除确认直接使用浏览器原生 `confirm()`，暂不做自定义弹窗
- 右栏采用简单二态切换（列表 / 详情），不做复杂路由

#### 下个版本优化
- 原型分辨率切换（Desktop / Tablet / Mobile）
- 项目设置页（允许评论/标注开关）
- 拖拽创建标注
- 标注在不同分辨率下的错位问题
- 标注标记重叠处理
- TypeScript 迁移
- 通用 UI 组件抽象

### Phase 2（后续）— AI 能力集成
- **AI 对话生成原型**：在工具内直接对话生成 HTML 原型，无需外部工具
- **AI 微调已有原型**：选中任意版本 → 输入修改需求 → AI 生成新版本，保留历史版本可回溯
- **组件库管理系统**：
  - 管理常用 UI 组件（组件 HTML/CSS、分类、预览）
  - AI 生成时携带组件库上下文，生成的页面使用已有组件，保持风格一致
  - 支持从已有原型中提取组件入库
- **AI 自动生成注释**：分析 HTML 页面结构，按需求在对应位置自动创建标注（如"在登录按钮处添加注释说明校验规则"）
- **版本自动快照**：AI 每次生成自动创建新版本

### Phase 3（后续）— 协作增强
- 用户系统：登录、身份识别
- 通知系统：有新标注/评论时提醒
- WebSocket 实时同步

---

## 8. 部署方案

### 开发环境
```bash
git clone <repo>
cd prototypehub
npm install
npm run dev       # 使用 concurrently 同时启动前端(Vite:5173)和后端(Node:3001)
# 访问 http://localhost:5173，Vite 自动代理 /api → localhost:3001
```

### 生产环境 (Docker)
```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # SQLite + HTML 文件持久化
```

访问地址：`http://<host-ip>:3000`

---

## 9. 项目结构

```
prototypehub/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .gitignore               # 忽略 data/ node_modules/
├── data/                    # SQLite + HTML 文件（自动创建，gitignored）
├── server/                  # 后端
│   ├── index.js
│   ├── routes/
│   │   ├── projects.js
│   │   ├── versions.js
│   │   ├── annotations.js
│   │   └── comments.js
│   ├── db/
│   │   ├── init.js
│   │   └── migrations.js
│   └── storage/
│       └── html/          # HTML 文件存储
├── client/                 # 前端
│   ├── src/
│   │   ├── App.vue
│   │   ├── router/
│   │   ├── stores/
│   │   ├── pages/
│   │   │   ├── ProjectList.vue
│   │   │   └── ProjectDetail.vue
│   │   ├── components/
│   │   │   ├── VersionList.vue
│   │   │   ├── PrototypeViewer.vue
│   │   │   ├── AnnotationLayer.vue
│   │   │   ├── AnnotationCard.vue
│   │   │   └── CommentThread.vue
│   │   └── utils/
│   ├── index.html
│   └── vite.config.js
└── README.md
```

---

## 10. 技术注意点

1. **标注位置存储**：使用百分比而非像素，确保不同分辨率下标注位置一致
2. **HTML 安全**：上传的 HTML 配置 `sandbox="allow-scripts"`（**不加** `allow-same-origin`）渲染，防止恶意脚本访问父页面数据。高度自适应通过 postMessage 通信。服务端对上传内容大小做限制（建议单文件 < 5MB），并限制 HTML 中引用的外部资源域名白名单
3. **API 无状态**：Phase 1 不做用户认证，使用 localStorage 存储作者名，简单可追溯
4. **响应式（下版本）**：原型渲染区域支持 3 种分辨率切换（1440px / 768px / 375px）
5. **批量标注模式**：标注模式下点击原型任意位置连续添加，无需每次切换模式
6. **Vite 开发代理**：`vite.config.js` 中配置 proxy 将 `/api` 请求转发到后端端口（如后端 `3001`，前端 `5173`），避免开发时跨域问题
7. **数据持久化**：SQLite 数据库文件 + 上传的 HTML 文件统一存放在 `data/` 目录，docker-compose 映射为外部 volume

## 11. 关键设计决策

### 11.1 iframe 标注定位方案（标注跟随内容滚动）

**问题**：HTML 原型通过 iframe 渲染，但当原型内容超出视口需要滚动时，叠加在 iframe 上方的标注 overlay 会与内容错位。

**方案**：外层容器滚动，iframe 高度自适应不滚动
- HTML 通过同源端点 `/api/raw/:versionId` 服务，返回时自动在 `</body>` 前注入 postMessage 脚本
- iframe 配置 `sandbox="allow-scripts"`（不加 `allow-same-origin`，保证安全隔离）
- iframe 内部脚本加载完成后，通过 `postMessage({ type: 'resize', height: document.body.scrollHeight })` 将内容高度发送给父页面
- 父页面监听 `message` 事件，验证来源后设置 iframe 高度为内容实际高度，iframe 禁止内部滚动（CSS `overflow: hidden`）
- 标注 overlay 和 iframe 处于同一个外层容器中，随容器一起滚动，标注始终与内容对齐
- 分辨率切换时改变外层容器宽度，iframe 宽度自适应，触发重新 postMessage 更新高度（下版本实现）

### 11.2 Phase 1 权限控制策略

**问题**：Phase 1 不做用户登录系统，但设置页包含了"仅自己可标注"等权限开关，缺乏用户身份识别。

**方案**：软控制 + 作者名追溯
- 首次进入页面时弹窗输入作者名，持久化到 localStorage
- 右上角始终显示当前作者名，支持切换
- 标注/评论自动附带作者名，列表显示"张三 创建了标注"
- 设置面板（allowComment / allowAnnotate 开关）下版本实现，届时前端 UI 按设置隐藏入口，后端不做强制拦截
- Phase 3 加入用户系统后，切换为真正的 JWT/Cookie 鉴权

### 11.3 版本与标注的绑定关系

标注严格绑定到版本。切换版本时只显示当前版本的标注，避免一个版本的标注错位到另一个版本。版本被删除时，其所有标注/评论级联删除。
