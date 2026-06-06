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
    // SQLite stores booleans as 0/1 integers
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
