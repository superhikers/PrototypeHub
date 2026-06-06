<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-[var(--c-text-secondary)] uppercase tracking-wider">版本列表</h3>
      <BaseButton variant="ghost" size="sm" @click="showUpload = true">+ 上传</BaseButton>
    </div>

    <div v-if="showUpload" class="mb-3 p-3 bg-[var(--c-surface-hover)] rounded-[var(--radius-md)] border border-[var(--c-border-light)] text-sm space-y-2">
      <input type="file" accept=".html" class="block text-xs text-[var(--c-text-secondary)] file:mr-3 file:py-1 file:px-3 file:rounded-[var(--radius-sm)] file:border file:border-[var(--c-border)] file:text-xs file:bg-[var(--c-surface)] file:text-[var(--c-text)] hover:file:bg-[var(--c-surface-hover)]" @change="onFileChange" ref="fileInput" />
      <input v-model="uploadTitle" class="w-full border border-[var(--c-border)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs bg-[var(--c-surface)] text-[var(--c-text)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all" placeholder="版本描述（可选）" />
      <div class="flex gap-2">
        <BaseButton size="sm" :disabled="!selectedFile || versionStore.uploading" @click="doUpload">
          {{ versionStore.uploading ? '上传中...' : '上传' }}
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="showUpload = false">取消</BaseButton>
      </div>
    </div>

    <TransitionGroup name="version" tag="div" class="space-y-1">
      <div v-for="v in displayList" :key="v.id"
        class="px-3 py-2 rounded-[var(--radius-md)] cursor-pointer text-sm flex items-center justify-between transition-all duration-150"
        :class="versionStore.current?.id === v.id
          ? 'bg-gradient-to-r from-[var(--c-primary-light)] to-[var(--c-accent-light)] text-[var(--c-text)]'
          : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-hover)]'"
        @click="selectVersion(v)">
        <div>
          <span class="font-medium">v{{ v.version_number }}</span>
          <span v-if="v.title" class="ml-1.5 text-xs text-[var(--c-text-muted)]">— {{ v.title }}</span>
        </div>
        <button class="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-danger)] transition-colors"
          @click.stop="confirmDelete(v)">
          删除
        </button>
      </div>
    </TransitionGroup>

    <!-- Delete Confirm -->
    <BaseModal v-model="showDelete" title="删除版本">
      <p class="text-[var(--c-text-secondary)]">确定删除版本 v{{ deleteTarget?.version_number }}？将同时删除该版本的所有标注。</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDelete = false">取消</BaseButton>
        <BaseButton variant="danger" @click="handleDelete">删除</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVersionStore } from '../stores/versionStore'
import BaseButton from '../components/base/BaseButton.vue'
import BaseModal from '../components/base/BaseModal.vue'

const emit = defineEmits(['select'])
const props = defineProps({
  projectId: { type: String, required: true },
  folderId: { type: String, default: null },
})
const versionStore = useVersionStore()

const displayList = computed(() => {
  if (props.folderId) {
    return versionStore.list.filter(v => v.folder_id === props.folderId)
  }
  return versionStore.list
})

const showUpload = ref(false)
const selectedFile = ref(null)
const uploadTitle = ref('')
const fileInput = ref(null)
const showDelete = ref(false)
const deleteTarget = ref(null)

function onFileChange(e) { selectedFile.value = e.target.files[0] }

async function doUpload() {
  if (!selectedFile.value) return
  await versionStore.uploadVersion(props.projectId, selectedFile.value, uploadTitle.value, props.folderId)
  showUpload.value = false
  selectedFile.value = null
  uploadTitle.value = ''
}

function selectVersion(v) {
  versionStore.setCurrent(v)
  emit('select', v)
}

function confirmDelete(v) {
  deleteTarget.value = v
  showDelete.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const pid = deleteTarget.value.project_id
  await versionStore.deleteVersion(pid, deleteTarget.value.id)
  showDelete.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.version-enter-active { transition: all 0.25s ease-out; }
.version-leave-active { transition: all 0.15s ease-in; }
.version-enter-from { opacity: 0; transform: translateY(8px); }
.version-leave-to { opacity: 0; }
.version-move { transition: transform 0.25s ease; }
</style>
