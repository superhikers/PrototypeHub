import { defineStore } from 'pinia'
import { api } from '../utils/api'

export const useCommentStore = defineStore('comment', {
  state: () => ({ comments: [], loading: false, error: null }),
  actions: {
    async fetchComments(aid) {
      this.loading = true; this.error = null
      try { const r = await api.getComments(aid); this.comments = r.data } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },
    async addComment(aid, data) {
      const r = await api.addComment(aid, data)
      this.comments.push(r.data)
      return r.data
    },
  },
})
