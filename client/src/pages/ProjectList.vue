<template>
  <div class="min-h-screen bg-[var(--c-bg)]">
    <AuthorModal @confirmed="refresh" />

    <!-- Header -->
    <header class="border-b border-[var(--c-border)] bg-[var(--c-surface)]/80 backdrop-blur-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <h1 class="text-2xl font-display text-[var(--c-text)] tracking-tight">PrototypeHub</h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-[var(--c-text-secondary)] hidden sm:block">{{ author }}</span>
          <BaseButton size="sm" variant="ghost" @click="ui.toggleDarkMode()">
            <span>{{ ui.darkMode ? '☀️' : '🌙' }}</span>
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

    <!-- Project Grid -->
    <div v-else class="max-w-7xl mx-auto px-6 py-8">
      <TransitionGroup
        v-if="store.list.length"
        name="project-card"
        tag="div"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div
          v-for="(project, idx) in store.list" :key="project.id"
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
        <BaseButton :loading="creating" :disabled="!newName.trim()" @click="handleCreate">创建</BaseButton>
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
import { useProjectStore } from '../stores/projectStore'
import { useUiStore } from '../stores/uiStore'
import { getAuthor } from '../utils/author'
import AuthorModal from '../components/AuthorModal.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseCard from '../components/base/BaseCard.vue'
import BaseModal from '../components/base/BaseModal.vue'
import BaseInput from '../components/base/BaseInput.vue'
import BaseSkeleton from '../components/base/BaseSkeleton.vue'

const router = useRouter()
const store = useProjectStore()
const ui = useUiStore()
const author = ref(getAuthor())

const loading = ref(true)
const showCreate = ref(false)
const showDelete = ref(false)
const creating = ref(false)
const deleting = ref(false)
const newName = ref('')
const newDesc = ref('')
const deleteTarget = ref(null)

onMounted(async () => {
  if (getAuthor()) {
    await store.fetchProjects()
  }
  loading.value = false
})

function refresh() { author.value = getAuthor() }

function goProject(id) {
  router.push(`/project/${id}`)
}

async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  const project = await store.createProject({ name: newName.value.trim(), description: newDesc.value.trim() })
  creating.value = false
  showCreate.value = false
  newName.value = ''
  newDesc.value = ''
  if (project) router.push(`/project/${project.id}`)
}

function confirmDelete(project) {
  deleteTarget.value = project
  showDelete.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  await store.deleteProject(deleteTarget.value.id)
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
