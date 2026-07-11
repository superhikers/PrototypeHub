<template>
  <div class="h-screen flex flex-col bg-[var(--c-bg)]" v-if="project">
    <!-- Top Toolbar -->
    <header class="h-12 border-b border-[var(--c-border)] bg-[var(--c-surface)]/90 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-3">
        <router-link to="/" class="text-[var(--c-text-secondary)] hover:text-[var(--c-text)] transition-colors p-1">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <span class="text-sm font-medium text-[var(--c-text)]">{{ project.name }}</span>
        <router-link :to="`/project/${project.id}/settings`" class="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-primary)] transition-colors ml-1">
          设置
        </router-link>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-[var(--c-text-muted)] hidden sm:block">{{ author }}</span>
        <ResolutionSwitcher />
        <div class="w-px h-4 bg-[var(--c-border)] mx-0.5" />
        <button
          class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all duration-150"
          :class="aiStore.panelOpen ? 'bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-stop)] text-white' : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]'"
          @click="aiStore.panelOpen ? aiStore.panelOpen = false : aiStore.openForGenerate()">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
          </svg>
          AI
        </button>
        <div class="w-px h-4 bg-[var(--c-border)] mx-0.5" />
        <button class="p-1.5 rounded-[var(--radius-sm)] text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)] transition-all text-sm" @click="ui.toggleDarkMode()">
          {{ ui.darkMode ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-56 border-r border-[var(--c-border)] bg-[var(--c-surface)] p-4 overflow-y-auto shrink-0">
        <!-- Folders -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-semibold text-[var(--c-text-secondary)] uppercase tracking-wider">文件夹</h3>
            <BaseButton variant="ghost" size="sm" @click="showNewFolder = true">+ 新建</BaseButton>
          </div>
          <div v-if="showNewFolder" class="mb-2 flex gap-1">
            <input v-model="newFolderName" class="flex-1 border border-[var(--c-border)] rounded-[var(--radius-sm)] px-2 py-1 text-xs bg-[var(--c-surface)] text-[var(--c-text)] outline-none" placeholder="名称" @keyup.enter="createFolder" @keyup.escape="showNewFolder = false" />
            <BaseButton size="sm" @click="createFolder">确定</BaseButton>
          </div>
          <div class="space-y-0.5">
            <div class="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-sm)] text-xs cursor-pointer transition-colors"
              :class="selectedFolder === null ? 'bg-gradient-to-r from-[var(--c-primary-light)] to-[var(--c-accent-light)] text-[var(--c-text)] font-medium' : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]'"
              @click="selectedFolder = null; loadPrototypes()">
              <span>全部原型</span>
            </div>
            <div v-for="f in folderStore.list" :key="f.id" class="group">
              <div class="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-sm)] text-xs cursor-pointer transition-colors"
                :class="selectedFolder === f.id ? 'bg-gradient-to-r from-[var(--c-primary-light)] to-[var(--c-accent-light)] text-[var(--c-text)] font-medium' : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]'"
                @click="selectedFolder = f.id; loadPrototypes()">
                <span>{{ f.name }}</span>
                <button class="text-[var(--c-text-muted)] hover:text-[var(--c-danger)] opacity-0 group-hover:opacity-100 transition-opacity" @click.stop="doDeleteFolder(f)">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Prototypes -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-semibold text-[var(--c-text-secondary)] uppercase tracking-wider">原型列表</h3>
            <label class="text-xs font-medium text-[var(--c-primary)] hover:text-[var(--c-primary-stop)] cursor-pointer transition-colors">
              + 上传
              <input type="file" accept=".html" class="hidden" @change="onUploadFile" />
            </label>
          </div>

          <div v-if="protoStore.loading" class="text-xs text-[var(--c-text-muted)]">加载中...</div>
          <div v-else-if="protoStore.list.length === 0" class="text-xs text-[var(--c-text-muted)]">暂无原型</div>
          <div v-else class="space-y-0.5">
            <div v-for="p in protoStore.list" :key="p.id"
              class="px-2 py-1.5 rounded-[var(--radius-sm)] text-xs cursor-pointer group transition-colors"
              :class="protoStore.current?.id === p.id ? 'bg-gradient-to-r from-[var(--c-primary-light)] to-[var(--c-accent-light)] text-[var(--c-text)] font-medium' : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]'"
              @click="selectPrototype(p)">
              <div class="flex items-center justify-between">
                <span class="truncate">{{ p.name }}</span>
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[var(--c-text-muted)]">v{{ p.latest_version || '?' }}</span>
                  <button class="text-[var(--c-text-muted)] hover:text-[var(--c-danger)] opacity-0 group-hover:opacity-100 transition-opacity" @click.stop="doDeletePrototype(p)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center: Viewer -->
      <main class="flex-1 flex flex-col overflow-hidden">
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
        <!-- Bottom toolbar -->
        <div class="bg-[var(--c-surface)] border-t border-[var(--c-border)] px-3 py-1.5 flex items-center gap-1.5 shrink-0">
          <BaseButton
            v-for="m in modes" :key="m.key"
            :variant="annotationStore.mode === m.key ? 'primary' : 'ghost'"
            size="sm"
            :disabled="m.key === 'annotate' && !allowCreateAnno"
            @click="annotationStore.setMode(m.key)">
            {{ m.label }}
          </BaseButton>
          <div class="flex-1"></div>
          <div v-if="versionStore.current" class="flex items-center gap-1 text-xs text-[var(--c-text-muted)] mr-2">
            <span class="font-mono">v{{ versionStore.current.version_number }}</span>
            <button class="text-[var(--c-accent)] hover:text-[var(--c-accent)] underline ml-1 transition-colors"
              @click="aiStore.openForModify(versionStore.current.id)">
              AI 微调
            </button>
          </div>
          <div v-if="annotationStore.mode === 'select' && annotationStore.selectedIds.length > 0">
            <BaseButton variant="danger" size="sm" @click="batchDelete">
              删除 ({{ annotationStore.selectedIds.length }})
            </BaseButton>
          </div>
          <div v-if="allowCreateAnno" class="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-accent)] shadow-soft cursor-grab active:cursor-grabbing"
            draggable="true"
            @dragstart="onDragStart"
            title="拖拽创建标注"
          ></div>
        </div>
      </main>

      <!-- Right Panel -->
      <Transition name="panel-slide" mode="out-in">
        <AiPanel v-if="aiStore.panelOpen" :key="'ai'" :project-id="route.params.id" @applied="onAiApplied" />
        <aside v-else key="annotations" class="w-80 border-l border-[var(--c-border)] bg-[var(--c-surface)] overflow-y-auto shrink-0">
          <div class="p-4">
            <h3 class="text-xs font-semibold text-[var(--c-text-secondary)] uppercase tracking-wider mb-3">
              标注列表
              <span class="text-xs font-normal text-[var(--c-text-muted)] ml-1">({{ annotationStore.list.length }})</span>
            </h3>

            <!-- Selected annotation detail -->
            <div v-if="annotationStore.selected" class="mb-4 p-3 bg-[var(--c-surface-hover)] rounded-[var(--radius-md)] border border-[var(--c-border-light)]">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="w-3 h-3 rounded-full inline-block shrink-0 ring-2 ring-[var(--c-surface)]" :style="{ backgroundColor: annotationStore.selected.color }"></span>
                <span class="text-xs font-bold text-[var(--c-text)]">#{{ selectedNumber }}</span>
                <span class="text-xs text-[var(--c-text-secondary)]">{{ annotationStore.selected.author }}</span>
                <span class="text-xs text-[var(--c-text-muted)] ml-auto">{{ new Date(annotationStore.selected.created_at).toLocaleString() }}</span>
              </div>
              <div>
                <p v-if="editingAnnoId !== annotationStore.selected.id"
                  class="text-sm text-[var(--c-text-secondary)] whitespace-pre-wrap mb-2 cursor-pointer hover:text-[var(--c-text)] rounded px-1 -mx-1 transition-colors"
                  @click="startEdit">
                  {{ annotationStore.selected.content || '（点击添加内容）' }}
                </p>
                <div v-else class="mb-2">
                  <textarea v-model="editContent"
                    class="w-full border border-[var(--c-border)] rounded-[var(--radius-sm)] px-2 py-1.5 text-sm bg-[var(--c-surface)] text-[var(--c-text)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20"
                    rows="3" ref="editInput"
                    @blur="saveEdit"
                    @keydown.escape="cancelEdit"
                    @keydown.ctrl.enter="saveEdit">
                  </textarea>
                  <div class="flex gap-1 mt-1.5">
                    <BaseButton size="sm" @click="saveEdit">保存</BaseButton>
                    <BaseButton variant="ghost" size="sm" @click="cancelEdit">取消</BaseButton>
                  </div>
                </div>
              </div>
              <button class="text-xs text-[var(--c-text-secondary)] hover:text-[var(--c-text)] transition-colors mt-1" @click="showComments = !showComments">
                {{ showComments ? '收起评论' : '查看评论' }}
              </button>
              <div v-if="showComments" class="mt-2 border-t border-[var(--c-border-light)] pt-2">
                <CommentThread :annotation-id="annotationStore.selected.id" />
              </div>
            </div>

            <!-- Annotation list -->
            <div v-if="annotationStore.list.length === 0" class="text-sm text-[var(--c-text-muted)] py-8 text-center">
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
      </Transition>
    </div>

    <!-- Create Annotation Modal -->
    <BaseModal v-model="showCreateDialog" title="新建标注">
      <div class="flex gap-1.5 mb-3">
        <button v-for="c in COLORS" :key="c"
          class="w-7 h-7 rounded-full border-2 transition-all"
          :class="newColor === c ? 'border-[var(--c-text)] scale-110' : 'border-transparent'"
          :style="{ backgroundColor: c }"
          @click="newColor = c">
        </button>
      </div>
      <textarea v-model="newContent"
        class="w-full border border-[var(--c-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm bg-[var(--c-surface)] text-[var(--c-text)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20"
        rows="3" placeholder="输入标注内容..." autofocus></textarea>
      <template #footer>
        <BaseButton variant="secondary" @click="showCreateDialog = false">取消</BaseButton>
        <BaseButton @click="confirmCreate">确定</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useVersionStore } from '../stores/versionStore'
import { useAnnotationStore } from '../stores/annotationStore'
import { useFolderStore } from '../stores/folderStore'
import { usePrototypeStore } from '../stores/prototypeStore'
import { useUiStore } from '../stores/uiStore'
import { getAuthor } from '../utils/author'
import { api } from '../utils/api'
import PrototypeViewer from '../components/PrototypeViewer.vue'
import AnnotationCard from '../components/AnnotationCard.vue'
import CommentThread from '../components/CommentThread.vue'
import ResolutionSwitcher from '../components/ResolutionSwitcher.vue'
import AiPanel from '../components/AiPanel.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseModal from '../components/base/BaseModal.vue'
import { useAiStore } from '../stores/aiStore'

const route = useRoute()
const projectStore = useProjectStore()
const versionStore = useVersionStore()
const annotationStore = useAnnotationStore()
const folderStore = useFolderStore()
const protoStore = usePrototypeStore()
const aiStore = useAiStore()
const ui = useUiStore()
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

watch(selectedFolder, () => {
  protoStore.setCurrent(null)
  versionStore.setCurrent(null)
  versionStore.list = []
  annotationStore.clearSelection()
  loadPrototypes()
})
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
  await folderStore.fetchFolders(route.params.id)
  await loadPrototypes()
  // Auto-select first prototype if any
  if (protoStore.list.length > 0) {
    selectPrototype(protoStore.list[0])
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

async function loadPrototypes() {
  const pid = route.params.id
  const folderId = selectedFolder.value
  await protoStore.fetchPrototypes(pid, folderId)
}

function selectPrototype(p) {
  protoStore.setCurrent(p)
  annotationStore.clearSelection()
  versionStore.fetchVersions(route.params.id, p.id).then(() => {
    if (versionStore.list.length > 0) {
      versionStore.setCurrent(versionStore.list[0])
      onVersionSelect(versionStore.list[0])
    } else {
      versionStore.setCurrent(null)
    }
  })
}

async function onUploadFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const pid = route.params.id
  const ptid = protoStore.current?.id || null
  const fid = selectedFolder.value
  await versionStore.uploadVersion(pid, file, file.name, ptid, fid)
  e.target.value = ''
  await loadPrototypes()
  // Auto-select the first prototype in current folder
  if (protoStore.list.length > 0) {
    selectPrototype(protoStore.list[0])
  }
}

async function doDeletePrototype(p) {
  if (!confirm(`删除原型「${p.name}」？所有版本将被删除`)) return
  await protoStore.deletePrototype(p.id)
  if (protoStore.current?.id === p.id) {
    protoStore.setCurrent(null)
    versionStore.list = []
    versionStore.current = null
  }
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

async function onAiApplied(result) {
  if (!result) return
  aiStore.panelOpen = false
  // 刷新原型列表并选中新生成的原型
  await loadPrototypes()
  const match = protoStore.list.find(p => p.id === result.prototypeId)
  if (match) {
    selectPrototype(match)
  }
}
</script>

<style scoped>
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.panel-slide-enter-from {
  transform: translateX(24px);
  opacity: 0;
}
.panel-slide-leave-to {
  transform: translateX(24px);
  opacity: 0;
}
</style>
