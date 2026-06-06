<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-sm">版本列表</h3>
      <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" @click="showUpload = true">
        + 上传
      </button>
    </div>

    <div v-if="showUpload" class="mb-3 p-3 bg-gray-50 rounded text-sm">
      <input type="file" accept=".html" class="block mb-2 text-xs" @change="onFileChange" ref="fileInput" />
      <input v-model="uploadTitle" class="w-full border rounded px-2 py-1 text-xs mb-2" placeholder="版本描述（可选）" />
      <div class="flex gap-2">
        <button class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
          :disabled="!selectedFile || versionStore.uploading" @click="doUpload">
          {{ versionStore.uploading ? '上传中...' : '上传' }}
        </button>
        <button class="text-gray-500 text-xs hover:underline" @click="showUpload = false">取消</button>
      </div>
    </div>

    <div class="space-y-1">
      <div
        v-for="v in displayList" :key="v.id"
        class="px-3 py-2 rounded cursor-pointer text-sm flex items-center justify-between"
        :class="versionStore.current?.id === v.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'"
        @click="selectVersion(v)"
      >
        <div>
          <span class="font-medium">v{{ v.version_number }}</span>
          <span v-if="v.title" class="ml-2 text-xs text-gray-500">— {{ v.title }}</span>
        </div>
        <button class="text-xs text-red-500 hover:underline"
          @click.stop="doDelete(v)">
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVersionStore } from '../stores/versionStore'

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

async function doDelete(v) {
  if (!confirm(`确定删除版本 v${v.version_number}？将同时删除该版本的所有标注`)) return
  const pid = v.project_id
  await versionStore.deleteVersion(pid, v.id)
}
</script>
