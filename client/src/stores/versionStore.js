import { defineStore } from 'pinia'
import { api } from '../utils/api'

export const useVersionStore = defineStore('version', {
  state: () => ({ list: [], current: null, loading: false, uploading: false, error: null }),
  actions: {
    async fetchVersions(pid) {
      this.loading = true; this.error = null
      try { const r = await api.getVersions(pid); this.list = r.data } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },
    async uploadVersion(pid, file, title) {
      this.uploading = true; this.error = null
      try {
        const r = await api.uploadVersion(pid, file, title)
        if (r.error) throw new Error(r.error.message)
        this.list.unshift(r.data)
        this.current = r.data
        return r.data
      } catch (e) { this.error = e.message; throw e }
      finally { this.uploading = false }
    },
    async deleteVersion(pid, vid) {
      await api.deleteVersion(pid, vid)
      this.list = this.list.filter(v => v.id !== vid)
      if (this.current?.id === vid) this.current = this.list[0] || null
    },
    setCurrent(version) { this.current = version },
  },
})
