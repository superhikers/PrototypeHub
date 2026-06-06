# PrototypeHub 前端重构设计 — Luma

## 概览

对 PrototypeHub 前端进行全面升级：建立设计系统、重构组件库、优化交互体验。目标打造一个视觉突出、交互流畅、代码可维护的专业原型审查工具。

## 视觉方向：Luma — 现代明亮

明亮、温暖、精致。暖白底色 + 珊瑚→紫色渐变点缀 + 青绿强调色。柔和圆角、层次阴影、Spring 动效。

## 设计 Tokens

### 色彩

| Token | 亮色 | 暗色 | 用途 |
|-------|------|------|------|
| `--c-bg` | `#FAF8F5` | `#141316` | 页面背景 |
| `--c-surface` | `#FFFFFF` | `#1E1D21` | 卡片/面板 |
| `--c-surface-hover` | `#F5F3F0` | `#28262C` | 悬浮态 |
| `--c-primary` | `#FF6B6B` | `#FF6B6B` | 珊瑚主色 |
| `--c-primary-stop` | `#7C3AED` | `#8B5CF6` | 渐变紫 |
| `--c-accent` | `#2DD4BF` | `#2DD4BF` | 青绿强调 |
| `--c-text` | `#1C1B1F` | `#E8E6E3` | 主文字 |
| `--c-text-secondary` | `#8B8794` | `#9E9AA6` | 次要文字 |
| `--c-text-muted` | `#B0ACB8` | `#6B6872` | 禁用/占位 |
| `--c-border` | `#EDE9E4` | `#2E2C33` | 边框 |
| `--c-danger` | `#EF4444` | `#F87171` | 危险操作 |
| `--c-success` | `#10B981` | `#34D399` | 成功 |

### 字体

- **标题:** `Instrument Serif`, serif (英), 回退 `Noto Serif SC` (中)
- **UI/正文:** `DM Sans`, sans-serif, 回退系统字体
- **代码:** `JetBrains Mono`, monospace

加载方式: Google Fonts CSS @import，仅加载所需字重。

### 圆角

| Token | 值 |
|-------|-----|
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--radius-full` | `9999px` |

### 阴影

亮色阴影带暖色偏转 (`rgba(28, 27, 31, 0.06)` 等)，暗色阴影带光源方向感。

## 组件重构

### 新建基础组件 (`components/base/`)

1. **BaseButton.vue** — 4 变体: `primary` (渐变背景), `secondary` (描边), `ghost`, `danger`。统一 loading 态、disabled 态、尺寸 (sm/md/lg)。
2. **BaseCard.vue** — 统一卡片容器，内置悬浮动效，hover 抬升。
3. **BaseModal.vue** — 居中弹窗 + 遮罩，入场/出场动画，slot header/body/footer。
4. **BaseInput.vue** — 统一输入框，focus ring 样式，error 态，label 关联。
5. **BaseSkeleton.vue** — 骨架屏组件，支持多种形状 (text/card/circle)。
6. **ToastProvider.vue** — 全局 toast 通知系统 (success/error/info)，自动消失。

### 已有组件升级

| 组件 | 改动 |
|------|------|
| `ProjectList.vue` | 卡片入场 stagger 动画、骨架屏 loading、渐变按钮 |
| `ProjectDetail.vue` | 三栏布局间距调整、面板滑入动画、工具栏重排 |
| `AnnotationCard.vue` | 精致化卡片样式，展开/收缩动画 |
| `AnnotationLayer.vue` | 标注点样式更新（渐变圆形 + 微脉冲动画） |
| `CommentThread.vue` | 评论列表入场动画，输入框聚焦样式 |
| `AiPanel.vue` | 面板滑入/滑出动画、消息气泡入场、流式打字效果 |
| `VersionList.vue` | 补全暗色模式、列表项动画 |
| `ResolutionSwitcher.vue` | 按钮组样式更新 |
| `AuthorModal.vue` | 动画弹窗替换原生弹窗 |
| `Settings.vue` | 开关样式更新，页面布局优化 |

### 全局样式

新建 `client/src/styles/design-tokens.css`，包含所有 CSS 变量。
移除或替换为新建的公共组件以减少重复。

## 交互 & 动效

### 页面过渡
- 路由切换：`<Transition>` 包裹 `<router-view>`，`fade-slide` 效果 (300ms)
- 列表页 → 详情页：内容区域淡入

### 列表入场
- ProjectList 卡片：stagger 动画，每项延迟 `index * 60ms`
- 版本列表 / 标注列表：同理

### 微交互
- Button: click scale 0.97 → 回弹 1.0 (150ms)
- Card: hover 抬升 translateY(-2px) + shadow 加深 (200ms)
- Modal: backdrop fadeIn 200ms + content scaleIn 250ms
- Toast: 从右上角滑入, 3s 后滑出

### 加载态
- 所有 "loading..." 文本替换为 BaseSkeleton
- 表格/列表: 3-4 行 skeleton 行
- 卡片网格: skeleton card 网格

## 文件变更清单

```
新建:
  client/src/styles/design-tokens.css
  client/src/components/base/BaseButton.vue
  client/src/components/base/BaseCard.vue
  client/src/components/base/BaseModal.vue
  client/src/components/base/BaseInput.vue
  client/src/components/base/BaseSkeleton.vue
  client/src/components/base/ToastProvider.vue

修改:
  client/index.html              (字体加载)
  client/src/main.js             (全局样式注册, toast 插件)
  client/src/App.vue             (布局过渡动画)
  client/src/style.css           (引入 design tokens)
  client/src/pages/ProjectList.vue
  client/src/pages/ProjectDetail.vue
  client/src/pages/Settings.vue
  client/src/components/AuthorModal.vue
  client/src/components/AnnotationCard.vue
  client/src/components/CommentThread.vue
  client/src/components/AnnotationLayer.vue
  client/src/components/VersionList.vue
  client/src/components/ResolutionSwitcher.vue
  client/src/components/AiPanel.vue
  client/src/components/PrototypeViewer.vue (minimal)
  client/tailwind.config.js      (扩展主题)
```

## 不在此次范围内的

- TypeScript 迁移（范围太大，留待后续）
- 自动化测试添加
- 国际化 (i18n)
- 后端 API 改动
- 功能新增
