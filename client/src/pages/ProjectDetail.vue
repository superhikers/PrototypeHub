<template>
  <div class="h-screen flex flex-col" v-if="project">
    <header class="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <router-link to="/" class="text-sm text-blue-600 hover:underline">← 返回列表</router-link>
        <h1 class="font-bold">{{ project.name }}</h1>
        <router-link :to="`/project/${project.id}/settings`" class="text-xs text-gray-400 hover:text-blue-600 ml-2">
          设置
        </router-link>
      </div>
      <div class="text-sm text-gray-500">{{ author }}</div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- 左栏 -->
      <aside class="w-56 border-r bg-white p-4 overflow-y-auto shrink-0">
        <VersionList :project-id="project.id" @select="onVersionSelect" />
      </aside>

      <!-- 中间区域 -->
      <main class="flex-1 flex flex-col overflow-hidden bg-gray-100">
        <PrototypeViewer
          :version="versionStore.current"
          :annotations="annotationStore.list"
          :mode="annotationStore.mode"
          @annotate="onAnnotate"
          @select="selectAnnotation"
          @delete="onDeleteAnnotation"
        />
        <div class="bg-white border-t px-4 py-2 flex items-center gap-2 shrink-0">
          <button v-for="m in modes" :key="m.key"
            class="px-3 py-1 text-sm rounded"
            :class="[
              annotationStore.mode === m.key ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200',
              m.key === 'annotate' && !allowCreateAnno ? 'opacity-30 cursor-not-allowed' : ''
            ]"
            @click="m.key === 'annotate' && !allowCreateAnno ? null : annotationStore.setMode(m.key)">
            {{ m.label }}
          </button>
          <div class="flex-1"></div>
          <ResolutionSwitcher />
          <!-- 便签盒（拖拽创建标注） -->
          <div v-if="allowCreateAnno" class="w-6 h-6 rounded-full bg-yellow-300 border-2 border-yellow-500 cursor-grab active:cursor-grabbing"
            draggable="true"
            @dragstart="onDragStart"
            title="拖拽到原型上创建标注"
          ></div>
        </div>
      </main>

      <!-- 右栏 -->
      <aside class="w-80 border-l bg-white overflow-y-auto shrink-0">
        <div v-if="!annotationStore.selected" class="p-4">
          <h3 class="font-bold text-sm mb-3">标注列表</h3>
          <div v-if="annotationStore.list.length === 0" class="text-sm text-gray-400">暂无标注</div>
          <AnnotationCard
            v-for="a in annotationStore.sortedList" :key="a.id"
            :annotation="a"
            @click="selectAnnotation(a)"
          />
        </div>
        <div v-else class="p-4">
          <button class="text-sm text-blue-600 hover:underline mb-3" @click="annotationStore.clearSelection()">
            ← 返回列表
          </button>
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: annotationStore.selected.color }"></span>
              <span class="text-xs text-gray-500">{{ annotationStore.selected.author }}</span>
              <span class="text-xs text-gray-400">{{ new Date(annotationStore.selected.created_at).toLocaleString() }}</span>
            </div>
            <p class="text-sm whitespace-pre-wrap">{{ annotationStore.selected.content }}</p>
          </div>
          <CommentThread :annotation-id="annotationStore.selected.id" />
        </div>
      </aside>
    </div>

    <!-- 标注创建弹窗 -->
    <div v-if="showCreateDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-4 w-72 shadow-xl">
        <h3 class="font-bold text-sm mb-3">新建标注</h3>
        <div class="flex gap-1 mb-3">
          <button v-for="c in COLORS" :key="c"
            class="w-7 h-7 rounded-full border-2"
            :class="newColor === c ? 'border-gray-800' : 'border-transparent'"
            :style="{ backgroundColor: c }"
            @click="newColor = c">
          </button>
        </div>
        <textarea v-model="newContent" class="w-full border rounded px-3 py-2 text-sm mb-3" rows="3" placeholder="输入标注内容..." autofocus></textarea>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded" @click="showCreateDialog = false">取消</button>
          <button class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" @click="confirmCreate">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useVersionStore } from '../stores/versionStore'
import { useAnnotationStore } from '../stores/annotationStore'
import { getAuthor } from '../utils/author'
import { api } from '../utils/api'
import VersionList from '../components/VersionList.vue'
import PrototypeViewer from '../components/PrototypeViewer.vue'
import AnnotationCard from '../components/AnnotationCard.vue'
import CommentThread from '../components/CommentThread.vue'
import ResolutionSwitcher from '../components/ResolutionSwitcher.vue'

const route = useRoute()
const projectStore = useProjectStore()
const versionStore = useVersionStore()
const annotationStore = useAnnotationStore()
const author = ref(getAuthor())

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF8C42']

const allowCreateAnno = ref(true)

const modes = [
  { key: 'hand', label: '手型' },
  { key: 'annotate', label: '标注' },
  { key: 'delete', label: '删除' },
]

const project = ref(null)

const showCreateDialog = ref(false)
const pendingPos = ref({ x: 0, y: 0 })
const newContent = ref('')
const newColor = ref(COLORS[1])

onMounted(async () => {
  await projectStore.fetchProject(route.params.id)
  project.value = projectStore.current
  try {
    const r = await api.getSettings(route.params.id)
    allowCreateAnno.value = r.data.allow_annotate !== 0
  } catch {}
  await versionStore.fetchVersions(route.params.id)
  if (versionStore.list.length > 0) {
    versionStore.setCurrent(versionStore.list[0])
    onVersionSelect(versionStore.list[0])
  }
})

async function onVersionSelect(v) {
  if (!v) return
  annotationStore.clearSelection()
  await annotationStore.fetchAnnotations(v.id)
}

function onAnnotate({ x, y }) {
  if (!versionStore.current || !author.value) return
  pendingPos.value = { x, y }
  newContent.value = ''
  newColor.value = COLORS[1]
  showCreateDialog.value = true
}

async function confirmCreate() {
  const a = await annotationStore.createAnnotation(versionStore.current.id, {
    x: pendingPos.value.x,
    y: pendingPos.value.y,
    color: newColor.value,
    content: newContent.value,
    author: author.value,
  })
  showCreateDialog.value = false
  annotationStore.selectAnnotation(a)
}

async function onDeleteAnnotation(a) {
  if (!confirm('确定删除此标注？')) return
  await annotationStore.deleteAnnotation(versionStore.current.id, a.id)
}

function selectAnnotation(a) {
  annotationStore.selectAnnotation(a)
  setTimeout(() => {
    const el = document.getElementById('annotation-' + a.id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 50)
}

function onDragStart(e) {
  e.dataTransfer.setData('text/plain', 'new-annotation')
  e.dataTransfer.effectAllowed = 'copy'
}
</script>
