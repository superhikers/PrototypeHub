import { defineStore } from 'pinia'
import { api } from '../utils/api'

export const useProjectStore = defineStore('project', {
  state: () => ({ list: [], current: null, loading: false, error: null }),
  actions: {
    async fetchProjects() {
      this.loading = true; this.error = null
      try { const r = await api.getProjects(); this.list = r.data } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },
    async fetchProject(id) {
      this.loading = true; this.error = null
      try { const r = await api.getProject(id); this.current = r.data } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },
    async createProject(data) {
      const r = await api.createProject(data)
      this.list.unshift(r.data)
      return r.data
    },
    async deleteProject(id) {
      await api.deleteProject(id)
      this.list = this.list.filter(p => p.id !== id)
    },
  },
})
