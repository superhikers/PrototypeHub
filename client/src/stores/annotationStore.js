import { defineStore } from 'pinia'
import { api } from '../utils/api'

export const useAnnotationStore = defineStore('annotation', {
  state: () => ({ list: [], selected: null, loading: false, mode: 'hand', error: null }),
  getters: {
    sortedList: (state) => [...state.list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  },
  actions: {
    async fetchAnnotations(vid) {
      this.loading = true; this.error = null
      try { const r = await api.getAnnotations(vid); this.list = r.data } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },
    async createAnnotation(vid, data) {
      const r = await api.createAnnotation(vid, data)
      this.list.push(r.data)
      return r.data
    },
    async updateAnnotation(vid, aid, data) {
      const r = await api.updateAnnotation(vid, aid, data)
      const idx = this.list.findIndex(a => a.id === aid)
      if (idx >= 0) this.list[idx] = r.data
      if (this.selected?.id === aid) this.selected = r.data
    },
    async deleteAnnotation(vid, aid) {
      await api.deleteAnnotation(vid, aid)
      this.list = this.list.filter(a => a.id !== aid)
      if (this.selected?.id === aid) this.selected = null
    },
    selectAnnotation(a) { this.selected = a },
    clearSelection() { this.selected = null },
    setMode(mode) { this.mode = mode },
  },
})
