# PrototypeHub Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign PrototypeHub frontend with Luma design system (modern bright aesthetic) — design tokens, base component library, animations, and visual polish across all pages.

**Architecture:** Layer approach: ① CSS design tokens foundation → ② Tailwind config + font loading → ③ Base components → ④ Page/component updates with animations. Each layer builds on previous.

**Tech Stack:** Vue 3 (Composition API), Tailwind CSS 3, Pinia, Google Fonts (Instrument Serif, DM Sans, JetBrains Mono)

---

### Task 1: Design Tokens CSS

**Files:**
- Create: `client/src/styles/design-tokens.css`

- [ ] **Create CSS custom properties file**

```css
:root {
  /* === Light Mode === */
  --c-bg: #FAF8F5;
  --c-surface: #FFFFFF;
  --c-surface-hover: #F5F3F0;
  --c-surface-elevated: #FFFFFF;
  --c-primary: #FF6B6B;
  --c-primary-stop: #7C3AED;
  --c-primary-light: #FFF0F0;
  --c-accent: #2DD4BF;
  --c-accent-light: #E6FCF9;
  --c-text: #1C1B1F;
  --c-text-secondary: #8B8794;
  --c-text-muted: #B0ACB8;
  --c-border: #EDE9E4;
  --c-border-light: #F5F3F0;
  --c-danger: #EF4444;
  --c-danger-light: #FEF2F2;
  --c-success: #10B981;
  --c-success-light: #ECFDF5;
  --c-warning: #F59E0B;

  /* === Typography === */
  --font-display: 'Instrument Serif', 'Noto Serif SC', serif;
  --font-body: 'DM Sans', 'Noto Sans SC', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === Border Radius === */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* === Shadows (Light) === */
  --shadow-sm: 0 1px 3px rgba(28, 27, 31, 0.04), 0 1px 2px rgba(28, 27, 31, 0.06);
  --shadow-md: 0 4px 6px rgba(28, 27, 31, 0.04), 0 2px 10px rgba(28, 27, 31, 0.06);
  --shadow-lg: 0 10px 25px rgba(28, 27, 31, 0.06), 0 4px 12px rgba(28, 27, 31, 0.08);
  --shadow-xl: 0 20px 50px rgba(28, 27, 31, 0.08), 0 8px 20px rgba(28, 27, 31, 0.06);
}

.dark {
  --c-bg: #141316;
  --c-surface: #1E1D21;
  --c-surface-hover: #28262C;
  --c-surface-elevated: #2B2930;
  --c-primary-light: #3D1F2E;
  --c-accent-light: #0F2D2B;
  --c-text: #E8E6E3;
  --c-text-secondary: #9E9AA6;
  --c-text-muted: #6B6872;
  --c-border: #2E2C33;
  --c-border-light: #252328;
  --c-danger-light: #3D1A1A;
  --c-success-light: #0D2B1F;
  --c-warning: #F59E0B;

  /* === Shadows (Dark) === */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.35);
}
```

- [ ] **Commit**

```bash
git add docs/superpowers/specs/2026-06-06-prototypehub-frontend-redesign.md docs/superpowers/plans/2026-06-06-prototypehub-frontend-redesign.md client/src/styles/design-tokens.css
git commit -m "docs: 前端重构设计文档与实施计划

- Luma 设计系统 spec
- 实施计划 (18 个任务)
- 设计 tokens CSS 变量 (亮色/暗色)"
```

---

### Task 2: Tailwind Config + Font Loading + Global CSS

**Files:**
- Modify: `client/tailwind.config.js`
- Modify: `client/index.html`
- Modify: `client/src/style.css`

- [ ] **Update Tailwind config to extend theme with custom tokens**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--c-surface)',
          hover: 'var(--c-surface-hover)',
          elevated: 'var(--c-surface-elevated)',
        },
        primary: {
          DEFAULT: 'var(--c-primary)',
          stop: 'var(--c-primary-stop)',
          light: 'var(--c-primary-light)',
        },
        accent: {
          DEFAULT: 'var(--c-accent)',
          light: 'var(--c-accent-light)',
        },
        text: {
          DEFAULT: 'var(--c-text)',
          secondary: 'var(--c-text-secondary)',
          muted: 'var(--c-text-muted)',
        },
        border: {
          DEFAULT: 'var(--c-border)',
          light: 'var(--c-border-light)',
        },
        danger: {
          DEFAULT: 'var(--c-danger)',
          light: 'var(--c-danger-light)',
        },
        success: {
          DEFAULT: 'var(--c-success)',
          light: 'var(--c-success-light)',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Noto Serif SC', 'serif'],
        body: ['DM Sans', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        soft: 'var(--shadow-sm)',
        card: 'var(--shadow-md)',
        lifted: 'var(--shadow-lg)',
        modal: 'var(--shadow-xl)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Add Google Fonts and update global styles**

In `client/index.html`, add font loading before the closing `</head>` tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Instrument+Serif:opsz@28&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Update `client/src/style.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/design-tokens.css';

body {
  font-family: var(--font-body);
  background-color: var(--c-bg);
  color: var(--c-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background-color: var(--c-primary);
  color: white;
}

/* Shimmer skeleton base */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--c-border-light) 25%,
    var(--c-surface-hover) 50%,
    var(--c-border-light) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

---

### Task 3: BaseButton Component

**Files:**
- Create: `client/src/components/base/BaseButton.vue`

- [ ] **Create BaseButton component**

```vue
<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-200 focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      sizeClasses[size],
      variantClasses[variant],
      loading ? 'relative text-transparent' : ''
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </span>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

defineEmits(['click'])

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-md)]',
}

const variantClasses = {
  primary:
    'bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white shadow-soft hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft',
  secondary:
    'bg-[var(--c-surface)] text-[var(--c-text)] border border-[var(--c-border)] shadow-soft hover:bg-[var(--c-surface-hover)] hover:border-[var(--c-text-muted)] active:bg-[var(--c-surface)]',
  ghost:
    'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]',
  danger:
    'bg-[var(--c-danger)] text-white shadow-soft hover:shadow-card hover:-translate-y-0.5 active:translate-y-0',
}
</script>
```

---

### Task 4: BaseCard Component

**Files:**
- Create: `client/src/components/base/BaseCard.vue`

- [ ] **Create BaseCard component**

```vue
<template>
  <div
    :class="[
      'bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] transition-all duration-200',
      hoverable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : 'shadow-soft',
      paddingClasses[padding],
      classOverride
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  hoverable: { type: Boolean, default: false },
  padding: { type: String, default: 'md' },
  class: { type: String, default: '' },
})

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const classOverride = props.class
</script>
```

---

### Task 5: BaseModal Component

**Files:**
- Create: `client/src/components/base/BaseModal.vue`

- [ ] **Create BaseModal component**

```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div
          class="relative bg-[var(--c-surface)] rounded-[var(--radius-xl)] shadow-modal border border-[var(--c-border)] w-full max-w-md animate-scale-in"
        >
          <div v-if="title" class="flex items-center justify-between px-6 pt-6 pb-0">
            <h2 class="text-lg font-display text-[var(--c-text)]">{{ title }}</h2>
            <button
              class="text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors p-1 rounded-full hover:bg-[var(--c-surface-hover)]"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-6"><slot /></div>
          <div v-if="$slots.footer" class="flex justify-end gap-3 px-6 pb-6 pt-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
```

---

### Task 6: BaseInput + BaseSkeleton Components

**Files:**
- Create: `client/src/components/base/BaseInput.vue`
- Create: `client/src/components/base/BaseSkeleton.vue`

- [ ] **Create BaseInput**

```vue
<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-[var(--c-text-secondary)]" :for="id">{{ label }}</label>
    <input
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :type="type"
      class="w-full px-3 py-2 bg-[var(--c-surface)] border rounded-[var(--radius-sm)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] transition-all duration-150 outline-none"
      :class="error
        ? 'border-[var(--c-danger)] focus:ring-2 focus:ring-[var(--c-danger)]/20'
        : 'border-[var(--c-border)] focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="text-xs text-[var(--c-danger)]">{{ error }}</p>
  </div>
</template>

<script setup>
import { useId } from 'vue'
defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  type: { type: String, default: 'text' },
  error: String,
})
defineEmits(['update:modelValue'])
const id = useId()
</script>
```

- [ ] **Create BaseSkeleton**

```vue
<template>
  <div
    class="skeleton"
    :style="{
      width: width,
      height: height,
      borderRadius: round ? '50%' : 'var(--radius-sm)',
    }"
  />
</template>

<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '16px' },
  round: { type: Boolean, default: false },
})
</script>
```

---

### Task 7: Toast Notification System

**Files:**
- Create: `client/src/components/base/ToastProvider.vue`
- Create: `client/src/stores/toastStore.js`
- Modify: `client/src/main.js`

- [ ] **Create toast Pinia store**

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let nextId = 0

  function add(message, type = 'info', duration = 3000) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), duration)
  }

  function remove(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx > -1) toasts.value.splice(idx, 1)
  }

  return { toasts, add, remove }
})
```

- [ ] **Create ToastProvider component**

```vue
<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-card border text-sm"
          :class="toastClasses[toast.type]"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button class="opacity-60 hover:opacity-100 transition-opacity" @click="toastStore.remove(toast.id)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toastStore'
const toastStore = useToastStore()

const toastClasses = {
  success: 'bg-[var(--c-success-light)] border-[var(--c-success)]/20 text-[var(--c-success)]',
  error: 'bg-[var(--c-danger-light)] border-[var(--c-danger)]/20 text-[var(--c-danger)]',
  info: 'bg-[var(--c-surface)] border-[var(--c-border)] text-[var(--c-text)]',
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { transform: translateX(100%); opacity: 0; }
.toast-leave-to { transform: translateX(100%); opacity: 0; }
.toast-move { transition: transform 0.3s ease; }
</style>
```

- [ ] **Register ToastProvider in main.js**

```js
// Add to main.js imports
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ToastProvider from './components/base/ToastProvider.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.component('ToastProvider', ToastProvider)
app.mount('#app')
```

Also add to `App.vue` template (inside root div):

```vue
<ToastProvider />
```

---

### Task 8: App.vue — Layout Transitions & Global Structure

**Files:**
- Modify: `client/src/App.vue`

- [ ] **Update App.vue with route transitions**

```vue
<template>
  <div :class="[uiStore.darkMode ? 'dark' : '', 'min-h-screen bg-[var(--c-bg)]']">
    <ToastProvider />
    <router-view v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/uiStore'
import ToastProvider from '@/components/base/ToastProvider.vue'

const uiStore = useUiStore()
</script>

<style>
.page-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
```

---

### Task 9: ProjectList.vue — Complete Redesign

**Files:**
- Modify: `client/src/pages/ProjectList.vue`

Major changes:
- Use BaseCard for project cards
- Add stagger entrance animation
- BaseSkeleton for loading state
- BaseModal for create dialog (replace prompt)
- BaseButton for actions
- Gradient accent on create button
- Better empty state

- [ ] **Rewrite ProjectList.vue**

```vue
<template>
  <div class="min-h-screen bg-[var(--c-bg)]">
    <!-- Header -->
    <header class="border-b border-[var(--c-border)] bg-[var(--c-surface)]/80 backdrop-blur-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <h1 class="text-2xl font-display text-[var(--c-text)] tracking-tight">PrototypeHub</h1>
        <div class="flex items-center gap-3">
          <BaseButton size="sm" variant="ghost" @click="uiStore.toggleDarkMode()">
            <span v-if="uiStore.darkMode">☀️</span>
            <span v-else>🌙</span>
          </BaseButton>
          <BaseButton @click="showCreate = true">+ 新建项目</BaseButton>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="n in 6" :key="n" class="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-lg)] p-5">
          <BaseSkeleton height="20px" width="60%" class="mb-3" />
          <BaseSkeleton height="14px" width="80%" class="mb-2" />
          <BaseSkeleton height="14px" width="40%" />
        </div>
      </div>
    </div>

    <!-- Project List -->
    <div v-else class="max-w-7xl mx-auto px-6 py-8">
      <TransitionGroup
        v-if="store.list.length"
        name="project-card"
        tag="div"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div
          v-for="(project, idx) in store.list"
          :key="project.id"
          :style="{ '--delay': idx * 0.06 + 's' }"
          class="project-card-item"
          @click="goProject(project.id)"
        >
          <BaseCard hoverable padding="lg" class="h-full flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-body font-semibold text-[var(--c-text)] mb-1.5">{{ project.name }}</h3>
              <p class="text-sm text-[var(--c-text-secondary)] line-clamp-2">{{ project.description || '暂无描述' }}</p>
            </div>
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-[var(--c-border-light)]">
              <span class="text-xs text-[var(--c-text-muted)]">{{ project.prototype_count || 0 }} 个原型</span>
              <BaseButton variant="ghost" size="sm" @click.stop="confirmDelete(project)">
                <span class="text-[var(--c-danger)]">删除</span>
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </TransitionGroup>

      <!-- Empty State -->
      <div v-else class="text-center py-24">
        <div class="text-5xl mb-4 opacity-30">📐</div>
        <p class="text-lg font-display text-[var(--c-text-secondary)] mb-2">还没有项目</p>
        <p class="text-sm text-[var(--c-text-muted)] mb-6">创建一个新项目开始原型审查</p>
        <BaseButton @click="showCreate = true">+ 新建项目</BaseButton>
      </div>
    </div>

    <!-- Create Modal -->
    <BaseModal v-model="showCreate" title="新建项目">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="newName" label="项目名称" placeholder="输入项目名称" />
        <BaseInput v-model="newDesc" label="项目描述" placeholder="简短描述（可选）" />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showCreate = false">取消</BaseButton>
        <BaseButton :loading="creating" @click="handleCreate">创建</BaseButton>
      </template>
    </BaseModal>

    <!-- Delete Confirm Modal -->
    <BaseModal v-model="showDelete" title="删除项目">
      <p class="text-[var(--c-text-secondary)]">确定要删除「{{ deleteTarget?.name }}」吗？此操作不可撤销。</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDelete = false">取消</BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="handleDelete">删除</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { useUiStore } from '@/stores/uiStore'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'

const router = useRouter()
const store = useProjectStore()
const uiStore = useUiStore()

const loading = ref(true)
const showCreate = ref(false)
const showDelete = ref(false)
const creating = ref(false)
const deleting = ref(false)
const newName = ref('')
const newDesc = ref('')
const deleteTarget = ref(null)

onMounted(async () => {
  await store.fetchList()
  loading.value = false
})

function goProject(id) {
  router.push(`/project/${id}`)
}

async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  await store.create(newName.value.trim(), newDesc.value.trim())
  creating.value = false
  showCreate.value = false
  newName.value = ''
  newDesc.value = ''
}

function confirmDelete(project) {
  deleteTarget.value = project
  showDelete.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  await store.remove(deleteTarget.value.id)
  deleting.value = false
  showDelete.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.project-card-item {
  animation: projectCardIn 0.4s ease-out both;
  animation-delay: var(--delay);
}
@keyframes projectCardIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
```

---

### Task 10: ProjectDetail.vue — Layout & Toolbar

**Files:**
- Modify: `client/src/pages/ProjectDetail.vue`

Major changes:
- Refined toolbar with gradient accents
- Better sidebar styling
- Animated panel transitions for AI panel
- BaseButton usage
- Dark mode toggle styling

- [ ] **Rewrite ProjectDetail.vue**

```vue
<template>
  <div class="h-screen flex flex-col bg-[var(--c-bg)]">
    <!-- Top Toolbar -->
    <header class="h-12 border-b border-[var(--c-border)] bg-[var(--c-surface)]/90 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-3">
        <button class="text-[var(--c-text-secondary)] hover:text-[var(--c-text)] transition-colors p-1" @click="goBack">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span class="text-sm font-medium text-[var(--c-text)]">{{ store.current?.name || '加载中...' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <ResolutionSwitcher />
        <div class="w-px h-5 bg-[var(--c-border)] mx-1" />
        <BaseButton variant="ghost" size="sm" @click="toggleAiPanel">
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
            </svg>
            <span class="hidden sm:inline">AI</span>
          </span>
        </BaseButton>
        <div class="w-px h-5 bg-[var(--c-border)] mx-1" />
        <button class="p-1.5 rounded-[var(--radius-sm)] text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)] transition-all" @click="uiStore.toggleDarkMode()">
          <span class="text-sm">{{ uiStore.darkMode ? '☀️' : '🌙' }}</span>
        </button>
        <button class="p-1.5 rounded-[var(--radius-sm)] text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)] transition-all" @click="goSettings">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-60 border-r border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col shrink-0 overflow-y-auto">
        <!-- Folder/Prototype Tree goes here (existing content) -->
        <div class="p-3">
          <slot name="sidebar" />
        </div>
      </aside>

      <!-- Center: Viewer -->
      <main class="flex-1 flex flex-col min-w-0 bg-[var(--c-bg)]">
        <div class="flex-1 relative">
          <PrototypeViewer />
        </div>
      </main>

      <!-- Right: Annotations (or AI Panel) -->
      <Transition name="panel-slide">
        <aside
          v-if="aiPanelOpen"
          class="w-96 border-l border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col shrink-0 overflow-hidden"
        >
          <AiPanel @close="aiPanelOpen = false" />
        </aside>
        <aside
          v-else
          class="w-72 border-l border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col shrink-0 overflow-y-auto"
        >
          <div class="p-3">
            <slot name="annotations" />
          </div>
        </aside>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { useUiStore } from '@/stores/uiStore'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const store = useProjectStore()
const uiStore = useUiStore()
const aiPanelOpen = ref(false)

function goBack() { router.push('/') }
function goSettings() { router.push(`/project/${router.currentRoute.value.params.id}/settings`) }
function toggleAiPanel() { aiPanelOpen.value = !aiPanelOpen.value }
</script>

<style scoped>
.panel-slide-enter-active, .panel-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.panel-slide-enter-from { transform: translateX(20px); opacity: 0; }
.panel-slide-leave-to { transform: translateX(20px); opacity: 0; }
</style>
```

---

### Task 11: Annotation Components — Styling Refresh

**Files:**
- Modify: `client/src/components/AnnotationCard.vue`
- Modify: `client/src/components/AnnotationLayer.vue`

- [ ] **Update AnnotationCard.vue — refined card with animation**

Wrap content in a card with the new design tokens, and update color dots to use the coral/purple/teal palette. Add hover scale and entrance animation.

```vue
<template>
  <div
    class="group bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-md)] p-3 transition-all duration-200 hover:shadow-card hover:border-[var(--c-text-muted)]"
  >
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 w-3 h-3 rounded-full shrink-0 ring-2 ring-[var(--c-surface)]"
        :style="{ backgroundColor: annotation.color || 'var(--c-primary)' }"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-[var(--c-text)]">{{ annotation.author }}</span>
          <span class="text-xs text-[var(--c-text-muted)]">{{ timeAgo(annotation.created_at) }}</span>
        </div>
        <p class="text-sm text-[var(--c-text-secondary)] leading-relaxed">{{ annotation.content }}</p>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Update AnnotationLayer.vue — pulse animation on dots**

Add a subtle pulse animation to annotation dots:

```css
.annotation-dot {
  animation: dotPulse 2s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(255, 107, 107, 0); }
}
```

Update dots to use the new color palette: `['#FF6B6B', '#7C3AED', '#2DD4BF', '#F59E0B', '#3B82F6', '#EC4899']`

---

### Task 12: CommentThread.vue — Styling & Animation

**Files:**
- Modify: `client/src/components/CommentThread.vue`

- [ ] **Update CommentThread.vue with refined styling**

Apply new design tokens, add list transitions for comments, and update the input area styling with BaseInput integration.

```vue
<template>
  <div class="space-y-3">
    <TransitionGroup name="comment" tag="div" class="space-y-2">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="flex gap-2.5 p-2.5 rounded-[var(--radius-sm)] bg-[var(--c-surface-hover)]"
      >
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-primary-stop)] flex items-center justify-center text-white text-xs font-medium shrink-0">
          {{ comment.author?.[0] || '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-xs font-medium text-[var(--c-text)]">{{ comment.author }}</span>
            <span class="text-xs text-[var(--c-text-muted)]">{{ timeAgo(comment.created_at) }}</span>
          </div>
          <p class="text-sm text-[var(--c-text-secondary)]">{{ comment.content }}</p>
        </div>
      </div>
    </TransitionGroup>
    <!-- Input area -->
    <div class="flex gap-2">
      <input
        v-model="newComment"
        placeholder="添加评论..."
        class="flex-1 px-3 py-1.5 text-sm bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all"
        @keydown.enter="submit"
      />
      <BaseButton size="sm" @click="submit">发送</BaseButton>
    </div>
  </div>
</template>
```

Comment list transition CSS:

```css
.comment-enter-active { transition: all 0.25s ease-out; }
.comment-leave-active { transition: all 0.2s ease-in; }
.comment-enter-from { opacity: 0; transform: translateY(8px); }
.comment-leave-to { opacity: 0; }
```

---

### Task 13: AiPanel.vue — Panel Animation & Message Bubbles

**Files:**
- Modify: `client/src/components/AiPanel.vue`

- [ ] **Update AiPanel.vue with animations**

Add message bubble entrance animation (staggered), refined styling with design tokens, and streaming text effect using CSS.

```vue
<!-- In AiPanel.vue, wrap message list with TransitionGroup -->
<TransitionGroup name="msg" tag="div" class="flex-1 overflow-y-auto p-4 space-y-4">
  <div v-for="(msg, idx) in messages" :key="msg.id" :style="{ '--delay': idx * 0.03 + 's' }" class="msg-item">
    <!-- message content -->
  </div>
</TransitionGroup>
```

CSS:

```css
.msg-item {
  animation: msgIn 0.3s ease-out both;
  animation-delay: var(--delay);
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

Update message bubbles styling to use new tokens and gradient accents for AI messages.

---

### Task 14: VersionList.vue — Dark Mode & Animations

**Files:**
- Modify: `client/src/components/VersionList.vue`

- [ ] **Complete dark mode coverage and add list animations**

Replace any remaining hardcoded Tailwind color classes with CSS var references or proper `dark:` variants. Add list transition for version items.

---

### Task 15: ResolutionSwitcher.vue — Refined Toggle Group

**Files:**
- Modify: `client/src/components/ResolutionSwitcher.vue`

- [ ] **Update button group styling**

```vue
<template>
  <div class="flex bg-[var(--c-surface-hover)] rounded-[var(--radius-sm)] p-0.5 gap-0.5">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-all duration-150"
      :class="resolution === opt.value
        ? 'bg-[var(--c-surface)] text-[var(--c-text)] shadow-soft'
        : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)]'"
      @click="uiStore.setResolution(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
```

---

### Task 16: Settings.vue & AuthorModal.vue — Styling Pass

**Files:**
- Modify: `client/src/pages/Settings.vue`
- Modify: `client/src/components/AuthorModal.vue`

- [ ] **Update Settings page design**

Apply card-based layout with the new tokens, styled toggle switches with coral accent color.

- [ ] **Update AuthorModal with BaseModal**

Replace the existing modal implementation with BaseModal. Apply new styles.

---

### Task 17: Complete Dark Mode Coverage

**Files:**
- Modify: `client/src/components/VersionList.vue` (verify)
- Modify: `client/src/components/PrototypeViewer.vue` (verify)
- Spot-check all components

- [ ] **Audit and fix any missing dark variants**

Search through each component for color classes without `dark:` equivalents. Add where missing.

---

### Task 18: Final Polish & Verify

**Files:**
- All modified files

- [ ] **Start dev server and verify**

```bash
cd client && npm run dev
```

- [ ] **Check visually:**
  - ProjectList card animations and loading state
  - ProjectDetail toolbar and panel transitions
  - Dark/light mode toggle
  - Modal animations
  - Toast notifications
  - Annotation/comment styling
  - AI panel

- [ ] **Fix any visual issues found**

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: 前端 Luma 设计系统重构

- 添加设计 tokens CSS 变量（亮色/暗色）
- 新建基础组件库 (BaseButton/Card/Modal/Input/Skeleton/Toast)
- 重构 ProjectList 页面（卡片动画、骨架屏、模态框）
- 重构 ProjectDetail 布局（面板过渡动画）
- 更新标注/评论组件样式
- 完善暗色模式覆盖
- 添加页面过渡和微交互动效"
```
