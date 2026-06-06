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
              <div class="w-10 h-5.5 bg-[var(--c-text-muted)] rounded-full peer-checked:bg-gradient-to-r peer-checked:from-[var(--c-primary)] peer-checked:to-[var(--c-primary-stop)] after:content-[''] after:absolute after:top-0.5 after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[18px]"></div>
            </label>
          </div>

          <div class="p-5 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-[var(--c-text)]">允许成员标注</h3>
              <p class="text-xs text-[var(--c-text-secondary)] mt-0.5">成员可自行创建标注</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" v-model="allowAnnotate" @change="updateSettings" />
              <div class="w-10 h-5.5 bg-[var(--c-text-muted)] rounded-full peer-checked:bg-gradient-to-r peer-checked:from-[var(--c-primary)] peer-checked:to-[var(--c-primary-stop)] after:content-[''] after:absolute after:top-0.5 after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[18px]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import BaseSkeleton from '../components/base/BaseSkeleton.vue'

const route = useRoute()
const projectId = route.params.id

const loading = ref(true)
const allowComment = ref(true)
const allowAnnotate = ref(false)

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
