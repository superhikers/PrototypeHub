# PrototypeHub Phase 1 收尾实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Phase 1 剩余功能：分辨率切换、设置页、拖拽创建标注。

**Architecture:** 三个独立功能，可并行实现。分辨率切换和拖拽标注是前端纯改动；设置页涉及前后端（已有 API 定义和数据库表）。

**Tech Stack:** Vue 3 + Pinia + Tailwind CSS + Express + better-sqlite3

---

## 文件结构

```
server/src/
├── routes/
│   └── settings.js              # 新增：设置 CRUD

client/src/
├── router/
│   └── index.js                 # 修改：添加 /project/:id/settings 路由
├── stores/
│   └── uiStore.js               # 新增：UI 状态（分辨率、当前作者等）
├── pages/
│   └── Settings.vue             # 新增：设置页
├── components/
│   └── ResolutionSwitcher.vue   # 新增：分辨率切换按钮组
├── pages/
│   └── ProjectDetail.vue        # 修改：工具栏加分辨率切换 + 拖拽标注入口
├── components/
│   ├── PrototypeViewer.vue      # 修改：接受 containerWidth prop
│   ├── AnnotationLayer.vue      # 修改：拖拽支持
│   └── VersionList.vue          # 不变
```

---

### Task 1: 后端 — 设置 API

**Files:**
- Create: `D:\project\prototype-hub\server\src\routes\settings.js`
- Modify: `D:\project\prototype-hub\server\src\index.js`

- [ ] **Step 1: 创建设置路由**

```js
import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

const updateSchema = z.object({
  allow_comment: z.boolean().optional(),
  allow_annotate: z.boolean().optional(),
});

// 获取项目设置
router.get('/projects/:pid/settings', (req, res, next) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });

    let settings = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.pid);
    if (!settings) {
      const id = uuid();
      db.prepare('INSERT INTO settings (id, project_id) VALUES (?, ?)').run(id, req.params.pid);
      settings = db.prepare('SELECT * FROM settings WHERE id = ?').get(id);
    }
    res.json({ data: settings });
  } catch (err) { next(err); }
});

// 更新项目设置
router.put('/projects/:pid/settings', (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });

    let settings = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.pid);
    if (!settings) {
      const id = uuid();
      db.prepare('INSERT INTO settings (id, project_id) VALUES (?, ?)').run(id, req.params.pid);
    }

    db.prepare(
      'UPDATE settings SET allow_comment = COALESCE(?, allow_comment), allow_annotate = COALESCE(?, allow_annotate) WHERE project_id = ?'
    ).run(data.allow_comment ?? null, data.allow_annotate ?? null, req.params.pid);

    const updated = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.pid);
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

export default router;
```

- [ ] **Step 2: 注册路由到 index.js**

Read `D:\project\prototype-hub\server\src\index.js` first, then add:
```js
import settingsRoutes from './routes/settings.js';
app.use('/api', settingsRoutes);
```

- [ ] **Step 3: 测试**

```bash
cd "D:\project\prototype-hub"
# 创建项目获取 PID
PID=$(curl -s -X POST http://localhost:3001/api/projects -H 'Content-Type: application/json' -d '{"name":"settings-test"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data.id))")
# 获取设置（自动创建默认记录）
curl -s "http://localhost:3001/api/projects/$PID/settings"
# 更新设置
curl -s -X PUT "http://localhost:3001/api/projects/$PID/settings" -H 'Content-Type: application/json' -d '{"allow_annotate":true}'
```

Expected: GET 返回默认设置（allow_comment=true, allow_annotate=false），PUT 后 allow_annotate 变为 true。

- [ ] **Step 4: 提交**

```bash
git add server/src/routes/settings.js server/src/index.js
git commit -m "feat: 设置 API - 获取/更新项目设置"
```

---

### Task 2: 前端 — UI Store

**Files:**
- Create: `D:\project\prototype-hub\client\src\stores\uiStore.js`

- [ ] **Step 1: 创建 uiStore.js**

```js
import { defineStore } from 'pinia'
import { getAuthor } from '../utils/author'

export const useUiStore = defineStore('ui', {
  state: () => ({
    resolution: 'full',  // 'full' | 'desktop' | 'tablet' | 'mobile'
    author: getAuthor(),
  }),
  getters: {
    resolutionWidth: (state) => {
      switch (state.resolution) {
        case 'desktop': return 1440
        case 'tablet': return 768
        case 'mobile': return 375
        default: return null  // full width
      }
    },
    resolutionLabel: (state) => {
      switch (state.resolution) {
        case 'desktop': return '桌面'
        case 'tablet': return '平板'
        case 'mobile': return '手机'
        default: return '自适应'
      }
    },
  },
  actions: {
    setResolution(res) { this.resolution = res },
    setAuthor(name) { this.author = name },
  },
})
```

- [ ] **Step 2: 提交**

```bash
git add client/src/stores/uiStore.js
git commit -m "feat: 添加 UI Store（分辨率、作者名状态）"
```

---

### Task 3: 前端 — 分辨率切换组件

**Files:**
- Create: `D:\project\prototype-hub\client\src\components\ResolutionSwitcher.vue`
- Modify: `D:\project\prototype-hub\client\src\pages\ProjectDetail.vue`（工具栏添加）
- Modify: `D:\project\prototype-hub\client\src\components\PrototypeViewer.vue`（接受 resolutionWidth）

- [ ] **Step 1: 创建 ResolutionSwitcher.vue**

```vue
<template>
  <div class="flex items-center gap-1 bg-white rounded border text-xs">
    <button
      v-for="r in resolutions" :key="r.key"
      class="px-2 py-1 rounded transition-colors"
      :class="ui.resolution === r.key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'"
      @click="ui.setResolution(r.key)"
    >
      {{ r.label }}
    </button>
  </div>
</template>

<script setup>
import { useUiStore } from '../stores/uiStore'

const ui = useUiStore()

const resolutions = [
  { key: 'full', label: '自适应' },
  { key: 'desktop', label: '桌面' },
  { key: 'tablet', label: '平板' },
  { key: 'mobile', label: '手机' },
]
</script>
```

- [ ] **Step 2: 修改 ProjectDetail.vue — 工具栏添加分辨率切换**

Read `D:\project\prototype-hub\client\src\pages\ProjectDetail.vue`. 在工具栏区域（在模式切换按钮旁边）添加分辨率切换组件。

定位 `<div class="bg-white border-t px-4 py-2 flex items-center gap-2 shrink-0">` 这个块，在模式按钮之后添加：

```vue
        <div class="flex-1"></div>
        <ResolutionSwitcher />
```

同时更新 import：
```js
import ResolutionSwitcher from '../components/ResolutionSwitcher.vue'
```

- [ ] **Step 3: 修改 PrototypeViewer.vue — 接受分辨率宽度**

Read `D:\project\prototype-hub\client\src\components\PrototypeViewer.vue`.

修改 `containerWidth` 的计算逻辑。当前是 `container.value?.clientWidth || 1200`。改为使用 uiStore 的 `resolutionWidth`：

修改前：
```js
const containerWidth = ref(1200)
```

修改后：
```js
import { useUiStore } from '../stores/uiStore'
const ui = useUiStore()

const containerWidth = computed(() => {
  return ui.resolutionWidth || container.value?.clientWidth || 1200
})
```

需要 import `computed` from 'vue'。

- [ ] **Step 4: 验证构建**

```bash
cd "D:\project\prototype-hub" && npm run build -w client
```

Expected: 构建成功。

- [ ] **Step 5: 提交**

```bash
git add client/src/components/ResolutionSwitcher.vue client/src/pages/ProjectDetail.vue client/src/components/PrototypeViewer.vue
git commit -m "feat: 分辨率切换 - Desktop/Tablet/Mobile"
```

---

### Task 4: 前端 — 设置页面

**Files:**
- Create: `D:\project\prototype-hub\client\src\pages\Settings.vue`
- Modify: `D:\project\prototype-hub\client\src\router\index.js`
- Modify: `D:\project\prototype-hub\client\src\utils\api.js`

- [ ] **Step 1: 给 api.js 添加设置方法**

Read `D:\project\prototype-hub\client\src\utils\api.js`，在 comments 方法之后添加：
```js
  // Settings
  getSettings: (pid) => request(`/projects/${pid}/settings`),
  updateSettings: (pid, data) => request(`/projects/${pid}/settings`, { method: 'PUT', body: JSON.stringify(data) }),
```

- [ ] **Step 2: 创建 Settings.vue**

```vue
<template>
  <div class="max-w-2xl mx-auto p-6">
    <div class="flex items-center gap-4 mb-6">
      <router-link :to="`/project/${projectId}`" class="text-sm text-blue-600 hover:underline">← 返回原型</router-link>
      <h1 class="text-xl font-bold">项目设置</h1>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-400">加载中...</div>

    <div v-else class="bg-white rounded-lg border divide-y">
      <div class="p-4 flex items-center justify-between">
        <div>
          <h3 class="font-medium">允许成员评论</h3>
          <p class="text-sm text-gray-500">成员可对标注添加评论和回复</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" v-model="allowComment" @change="updateSettings" />
          <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
        </label>
      </div>

      <div class="p-4 flex items-center justify-between">
        <div>
          <h3 class="font-medium">允许成员标注</h3>
          <p class="text-sm text-gray-500">成员可自行创建标注</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" v-model="allowAnnotate" @change="updateSettings" />
          <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'

const route = useRoute()
const projectId = route.params.id

const loading = ref(true)
const allowComment = ref(true)
const allowAnnotate = ref(false)

onMounted(async () => {
  try {
    const r = await api.getSettings(projectId)
    allowComment.value = r.data.allow_comment !== 0  // SQLite returns 0/1
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
```

- [ ] **Step 3: 添加路由**

Read `D:\project\prototype-hub\client\src\router\index.js`，添加：
```js
{ path: '/project/:id/settings', name: 'settings', component: () => import('../pages/Settings.vue') },
```

- [ ] **Step 4: 在 ProjectDetail.vue 添加设置入口**

Read `D:\project\prototype-hub\client\src\pages\ProjectDetail.vue`。在顶部栏的标题区域添加设置链接。在 `<h1 class="font-bold">{{ project.name }}</h1>` 旁边：
```vue
        <router-link :to="`/project/${project.id}/settings`" class="text-xs text-gray-400 hover:text-blue-600 ml-2">
          设置
        </router-link>
```

- [ ] **Step 5: 验证构建**

```bash
cd "D:\project\prototype-hub" && npm run build -w client
```

- [ ] **Step 6: 提交**

```bash
git add client/src/pages/Settings.vue client/src/router/index.js client/src/utils/api.js client/src/pages/ProjectDetail.vue
git commit -m "feat: 项目设置页 - 允许评论/标注开关"
```

---

### Task 5: 前端 — 拖拽创建标注

**Files:**
- Modify: `D:\project\prototype-hub\client\src\components\AnnotationLayer.vue`
- Modify: `D:\project\prototype-hub\client\src\pages\ProjectDetail.vue`
- Modify: `D:\project\prototype-hub\client\src\components\PrototypeViewer.vue`

- [ ] **Step 1: 修改 ProjectDetail.vue — 添加便签盒拖拽源**

Read the file. 在工具栏区域（`<div class="bg-white border-t px-4 py-2 flex items-center gap-2 shrink-0">`），在模式按钮之后添加一个可拖拽的便签盒元素：

```vue
        <!-- 便签盒（拖拽创建标注） -->
        <div class="w-6 h-6 rounded-full bg-yellow-300 border-2 border-yellow-500 cursor-grab active:cursor-grabbing"
          draggable="true"
          @dragstart="onDragStart"
          title="拖拽到原型上创建标注"
        ></div>
```

在 `<script setup>` 中添加：
```js
function onDragStart(e) {
  e.dataTransfer.setData('text/plain', 'new-annotation')
  e.dataTransfer.effectAllowed = 'copy'
}
```

- [ ] **Step 2: 修改 PrototypeViewer.vue — 处理 drop 事件**

Read `D:\project\prototype-hub\client\src\components\PrototypeViewer.vue`。

修改容器 div，添加 drop 事件处理：
```vue
  <div class="flex-1 overflow-auto relative" ref="container"
    @dragover.prevent
    @drop="onDrop">
```

添加方法：
```js
function onDrop(e) {
  if (e.dataTransfer.getData('text/plain') === 'new-annotation') {
    const rect = container.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    emit('annotate', { x, y })
  }
}
```

在 `defineEmits` 中已有 'annotate'，不需要修改。

- [ ] **Step 3: 验证构建**

```bash
cd "D:\project\prototype-hub" && npm run build -w client
```

- [ ] **Step 4: 测试全流程**

```bash
# 启动后手动测试：进入项目详情页
# 1. 工具栏出现黄色圆点（便签盒）
# 2. 拖拽到原型上释放 → 弹出标注创建弹窗
# 3. 选择颜色、输入内容 → 创建成功
```

- [ ] **Step 5: 提交**

```bash
git add client/src/pages/ProjectDetail.vue client/src/components/PrototypeViewer.vue
git commit -m "feat: 拖拽创建标注 - 便签盒 + drop 事件"
```

---

## Plan Self-Review

### Spec coverage
- **分辨率切换** → Task 3 (ResolutionSwitcher + PrototypeViewer) ✓
- **设置页** → Task 1 (backend) + Task 4 (frontend) ✓
- **拖拽创建标注** → Task 5 ✓
- **UI Store** → Task 2 (shared by resolution + settings) ✓

### Placeholder scan
- All code blocks complete, no TBD/TODO ✓
- Every step has concrete implementation code ✓

### Type consistency
- Settings API uses `allow_comment`/`allow_annotate` (snake_case, matches DB schema) ✓
- uiStore.resolution values: 'full'/'desktop'/'tablet'/'mobile' ✓
- uiStore.resolutionWidth returns null for 'full' (meaning use container width) ✓
- PrototypeViewer containerWidth ref → computed with uiStore.resolutionWidth ✓
