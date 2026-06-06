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
        <!-- 文件夹列表 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-sm">文件夹</h3>
            <button class="text-xs text-blue-600 hover:underline" @click="showNewFolder = true">+ 新建</button>
          </div>

          <!-- 新建文件夹输入 -->
          <div v-if="showNewFolder" class="mb-2 flex gap-1">
            <input v-model="newFolderName" class="flex-1 border rounded px-2 py-1 text-xs" placeholder="文件夹名" @keyup.enter="createFolder" @keyup.escape="showNewFolder = false" />
            <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" @click="createFolder">确定</button>
          </div>

          <div v-if="folderStore.loading" class="text-xs text-gray-400">加载中...</div>
          <div v-else class="space-y-0.5">
            <!-- 全部版本（无文件夹） -->
            <div class="flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer"
              :class="selectedFolder === null ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'"
              @click="selectedFolder = null">
              <span>全部版本</span>
              <span class="text-gray-400">{{ totalVersionCount }}</span>
            </div>
            <!-- 文件夹列表 -->
            <div v-for="f in folderStore.list" :key="f.id">
              <div class="flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer group"
                :class="selectedFolder === f.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'"
                @click="selectedFolder = f.id">
                <span>📁 {{ f.name }}</span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <span class="text-gray-400">{{ f.version_count }}</span>
                  <button class="text-red-400 hover:text-red-600" @click.stop="doDeleteFolder(f)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <VersionList :project-id="project.id" :folder-id="selectedFolder" @select="onVersionSelect" />
      </aside>

      <!-- 中间区域 -->
      <main class="flex-1 flex flex-col overflow-hidden bg-gray-100">
        <PrototypeViewer
          :version="versionStore.current"
          :annotations="annotationStore.sortedList"
          :mode="annotationStore.mode"
          :selected-ids="annotationStore.selectedIds"
          @annotate="onAnnotate"
          @select="selectAnnotation"
          @delete="onDeleteAnnotation"
          @update-annotation="onUpdateAnnotation"
          @toggle-select="annotationStore.toggleSelect"
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
          <!-- 批量删除 -->
          <div v-if="annotationStore.mode === 'select' && annotationStore.selectedIds.length > 0" class="ml-2">
            <button class="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              @click="batchDelete">
              删除选中 ({{ annotationStore.selectedIds.length }})
            </button>
          </div>
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
        <div class="p-4">
          <h3 class="font-bold text-sm mb-3">
            标注列表
            <span class="text-xs font-normal text-gray-400 ml-1">({{ annotationStore.list.length }})</span>
          </h3>

          <!-- 选中标注的详情 + 评论 -->
          <div v-if="annotationStore.selected" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: annotationStore.selected.color }"></span>
              <span class="text-xs font-bold">#{{ selectedNumber }}</span>
              <span class="text-xs text-gray-500">{{ annotationStore.selected.author }}</span>
              <span class="text-xs text-gray-400">{{ new Date(annotationStore.selected.created_at).toLocaleString() }}</span>
            </div>
            <div>
              <p v-if="editingAnnoId !== annotationStore.selected.id"
                class="text-sm whitespace-pre-wrap mb-2 cursor-pointer hover:bg-blue-100 rounded px-1 -mx-1"
                @click="startEdit">
                {{ annotationStore.selected.content || '（点击添加内容）' }}
              </p>
              <div v-else class="mb-2">
                <textarea v-model="editContent"
                  class="w-full border rounded px-2 py-1 text-sm"
                  rows="3" ref="editInput"
                  @blur="saveEdit"
                  @keydown.escape="cancelEdit"
                  @keydown.ctrl.enter="saveEdit">
                </textarea>
                <div class="flex gap-1 mt-1">
                  <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" @click="saveEdit">保存</button>
                  <button class="text-xs text-gray-600 hover:underline px-2 py-1" @click="cancelEdit">取消</button>
                </div>
              </div>
            </div>
            <button class="text-xs text-blue-600 hover:underline" @click="showComments = !showComments">
              {{ showComments ? '收起评论' : '查看评论' }}
            </button>
            <div v-if="showComments" class="mt-2">
              <CommentThread :annotation-id="annotationStore.selected.id" />
            </div>
          </div>

          <!-- 标注列表 -->
          <div v-if="annotationStore.list.length === 0" class="text-sm text-gray-400 py-4 text-center">
            暂无标注
          </div>
          <AnnotationCard
            v-for="(a, idx) in annotationStore.sortedList" :key="a.id"
            :annotation="a"
            :number="idx + 1"
            :active="annotationStore.selected?.id === a.id"
            @click="selectAnnotation(a)"
          />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useVersionStore } from '../stores/versionStore'
import { useAnnotationStore } from '../stores/annotationStore'
import { useFolderStore } from '../stores/folderStore'
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
const folderStore = useFolderStore()
const author = ref(getAuthor())

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF8C42']

const allowCreateAnno = ref(true)

const modes = [
  { key: 'hand', label: '手型' },
  { key: 'select', label: '选择' },
  { key: 'annotate', label: '标注' },
  { key: 'delete', label: '删除' },
]

const project = ref(null)

const showComments = ref(false)
const showCreateDialog = ref(false)
const pendingPos = ref({ x: 0, y: 0 })
const newContent = ref('')
const newColor = ref(COLORS[1])

const selectedFolder = ref(null)
const showNewFolder = ref(false)
const newFolderName = ref('')

const editingAnnoId = ref(null)
const editContent = ref('')
const editInput = ref(null)

function startEdit() {
  editContent.value = annotationStore.selected.content
  editingAnnoId.value = annotationStore.selected.id
  setTimeout(() => editInput.value?.focus(), 50)
}

async function saveEdit() {
  if (editingAnnoId.value && editContent.value !== annotationStore.selected.content) {
    await annotationStore.updateAnnotation(versionStore.current.id, editingAnnoId.value, { content: editContent.value })
  }
  editingAnnoId.value = null
}

function cancelEdit() {
  editingAnnoId.value = null
}

onMounted(async () => {
  await projectStore.fetchProject(route.params.id)
  project.value = projectStore.current
  try {
    const r = await api.getSettings(route.params.id)
    allowCreateAnno.value = r.data.allow_annotate !== 0
  } catch {}
  await versionStore.fetchVersions(route.params.id)
  await folderStore.fetchFolders(route.params.id)
  if (versionStore.list.length > 0) {
    versionStore.setCurrent(versionStore.list[0])
    onVersionSelect(versionStore.list[0])
  }
})

async function createFolder() {
  if (!newFolderName.value.trim()) return
  await folderStore.createFolder(route.params.id, newFolderName.value.trim())
  newFolderName.value = ''
  showNewFolder.value = false
}

async function doDeleteFolder(f) {
  if (!confirm(`删除文件夹「${f.name}」？版本将移出到根目录`)) return
  await folderStore.deleteFolder(f.id)
  if (selectedFolder.value === f.id) selectedFolder.value = null
}

async function onVersionSelect(v) {
  if (!v) return
  annotationStore.clearSelection()
  showComments.value = false
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

async function batchDelete() {
  if (!confirm(`确定删除选中的 ${annotationStore.selectedIds.length} 个标注？`)) return
  await annotationStore.deleteSelected(versionStore.current.id)
}

async function onUpdateAnnotation({ id, x, y }) {
  await annotationStore.updateAnnotation(versionStore.current.id, id, { x, y })
}

const selectedNumber = computed(() => {
  const idx = annotationStore.sortedList.findIndex(a => a.id === annotationStore.selected?.id)
  return idx >= 0 ? idx + 1 : 0
})

const totalVersionCount = computed(() => versionStore.list.length)

function selectAnnotation(a) {
  const isSame = annotationStore.selected?.id === a.id
  if (isSame) {
    showComments.value = !showComments.value
    return
  }
  annotationStore.selectAnnotation(a)
  showComments.value = false
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
