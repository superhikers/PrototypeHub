<template>
  <div>
    <div v-if="store.loading" class="text-sm text-[var(--c-text-muted)]">加载中...</div>

    <div v-else class="space-y-3 mb-4">
      <TransitionGroup name="comment" tag="div" class="space-y-2">
        <div v-for="c in store.comments" :key="c.id" class="text-sm">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-xs font-medium text-[var(--c-text)]">{{ c.author }}</span>
            <span class="text-xs text-[var(--c-text-muted)]">{{ new Date(c.created_at).toLocaleString() }}</span>
          </div>
          <p class="text-sm text-[var(--c-text-secondary)] whitespace-pre-wrap">{{ c.content }}</p>
          <button class="text-xs text-[var(--c-text-secondary)] hover:text-[var(--c-text)] transition-colors mt-0.5" @click="replyTo = replyTo === c.id ? null : c.id">
            {{ replyTo === c.id ? '取消回复' : '回复' }}
          </button>
          <div v-if="replyTo === c.id" class="ml-4 mt-1.5 flex gap-1.5">
            <input v-model="replyContent" class="flex-1 px-2.5 py-1.5 text-xs bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all" placeholder="输入回复..." @keyup.enter="addReply(c.id)" />
            <BaseButton size="sm" :disabled="!replyContent.trim() || !author" @click="addReply(c.id)">发送</BaseButton>
          </div>
          <TransitionGroup name="comment" tag="div" class="ml-4 mt-1.5 space-y-1.5">
            <div v-for="child in children(c.id)" :key="child.id" class="p-2 bg-[var(--c-surface-hover)] rounded-[var(--radius-sm)] border border-[var(--c-border-light)]">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-xs font-medium text-[var(--c-text)]">{{ child.author }}</span>
                <span class="text-xs text-[var(--c-text-muted)]">{{ new Date(child.created_at).toLocaleString() }}</span>
              </div>
              <p class="text-xs text-[var(--c-text-secondary)]">{{ child.content }}</p>
            </div>
          </TransitionGroup>
        </div>
      </TransitionGroup>
    </div>

    <!-- New Comment Input -->
    <div class="flex gap-2">
      <input v-model="newComment" class="flex-1 px-3 py-1.5 text-sm bg-[var(--c-surface)] border border-[var(--c-border)] rounded-[var(--radius-sm)] text-[var(--c-text)] placeholder-[var(--c-text-muted)] outline-none focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20 transition-all" rows="1" placeholder="添加评论..." @keydown.enter="addComment" />
      <BaseButton size="sm" :disabled="!newComment.trim() || !author" @click="addComment">发送</BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCommentStore } from '../stores/commentStore'
import { getAuthor } from '../utils/author'
import BaseButton from '../components/base/BaseButton.vue'

const props = defineProps({ annotationId: { type: String, required: true } })
const store = useCommentStore()
const author = ref(getAuthor())
const newComment = ref('')
const replyTo = ref(null)
const replyContent = ref('')

onMounted(() => { store.fetchComments(props.annotationId) })

watch(() => props.annotationId, (id) => { if (id) store.fetchComments(id) })

function children(parentId) {
  return store.comments.filter(c => c.parent_id === parentId)
}

async function addComment() {
  if (!newComment.value.trim() || !author.value) return
  await store.addComment(props.annotationId, { author: author.value, content: newComment.value.trim() })
  newComment.value = ''
}

async function addReply(parentId) {
  if (!replyContent.value.trim() || !author.value) return
  await store.addComment(props.annotationId, { author: author.value, content: replyContent.value.trim(), parentId })
  replyContent.value = ''
  replyTo.value = null
}
</script>

<style scoped>
.comment-enter-active {
  transition: all 0.25s ease-out;
}
.comment-leave-active {
  transition: all 0.2s ease-in;
}
.comment-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.comment-leave-to {
  opacity: 0;
}
</style>
