<template>
  <div class="max-w-5xl mx-auto p-6">
    <AuthorModal @confirmed="refresh" />

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">项目列表</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ author }}</span>
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" @click="showNewDialog = true">
          + 新建项目
        </button>
      </div>
    </div>

    <!-- 新建项目弹窗 -->
    <div v-if="showNewDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div class="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 class="text-lg font-bold mb-4">新建项目</h2>
        <input v-model="newName" class="w-full border rounded px-3 py-2 mb-3" placeholder="项目名称" autofocus />
        <textarea v-model="newDesc" class="w-full border rounded px-3 py-2 mb-4" placeholder="项目描述（可选）" rows="3"></textarea>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded" @click="showNewDialog = false">取消</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" :disabled="!newName.trim()" @click="createProject">创建</button>
        </div>
      </div>
    </div>

    <!-- 项目列表 -->
    <div v-if="store.loading" class="text-center py-12 text-gray-400">加载中...</div>
    <div v-else-if="store.list.length === 0" class="text-center py-12 text-gray-400">
      还没有项目，点击"新建项目"开始
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="p in store.list" :key="p.id"
        class="bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
        @click="$router.push(`/project/${p.id}`)"
      >
        <h3 class="font-bold mb-1 truncate">{{ p.name }}</h3>
        <p v-if="p.description" class="text-sm text-gray-500 mb-2 truncate">{{ p.description }}</p>
        <div class="text-xs text-gray-400">
          {{ p.updated_at ? new Date(p.updated_at).toLocaleString() : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { getAuthor } from '../utils/author'
import AuthorModal from '../components/AuthorModal.vue'

const router = useRouter()
const store = useProjectStore()
const author = ref(getAuthor())
const showNewDialog = ref(false)
const newName = ref('')
const newDesc = ref('')

function refresh() { author.value = getAuthor() }

onMounted(() => {
  if (getAuthor()) store.fetchProjects()
})

async function createProject() {
  if (!newName.value.trim()) return
  const project = await store.createProject({ name: newName.value.trim(), description: newDesc.value.trim() })
  showNewDialog.value = false
  newName.value = ''
  newDesc.value = ''
  if (project) router.push(`/project/${project.id}`)
}
</script>
