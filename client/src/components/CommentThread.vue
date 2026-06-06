<template>
  <div>
    <h4 class="font-bold text-sm mb-3">评论</h4>

    <div v-if="store.loading" class="text-sm text-gray-400">加载中...</div>

    <div v-else class="space-y-3 mb-4">
      <div v-for="c in store.comments" :key="c.id" class="text-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium">{{ c.author }}</span>
          <span class="text-xs text-gray-400">{{ new Date(c.created_at).toLocaleString() }}</span>
        </div>
        <p class="text-gray-700 whitespace-pre-wrap ml-0">{{ c.content }}</p>
        <button class="text-xs text-blue-600 hover:underline mt-1" @click="replyTo = replyTo === c.id ? null : c.id">
          {{ replyTo === c.id ? '取消回复' : '回复' }}
        </button>
        <div v-if="replyTo === c.id" class="ml-4 mt-2 flex gap-1">
          <input v-model="replyContent" class="flex-1 border rounded px-2 py-1 text-xs" placeholder="输入回复..." @keyup.enter="addReply(c.id)" />
          <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
            :disabled="!replyContent.trim() || !author" @click="addReply(c.id)">发送</button>
        </div>
        <div v-for="child in children(c.id)" :key="child.id" class="ml-4 mt-2 p-2 bg-gray-50 rounded">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-xs">{{ child.author }}</span>
            <span class="text-xs text-gray-400">{{ new Date(child.created_at).toLocaleString() }}</span>
          </div>
          <p class="text-xs text-gray-700">{{ child.content }}</p>
        </div>
      </div>
    </div>

    <!-- 新评论输入 -->
    <div>
      <textarea v-model="newComment" class="w-full border rounded px-3 py-2 text-sm mb-2" rows="2" placeholder="添加评论..."></textarea>
      <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        :disabled="!newComment.trim() || !author" @click="addComment">
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCommentStore } from '../stores/commentStore'
import { getAuthor } from '../utils/author'

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
