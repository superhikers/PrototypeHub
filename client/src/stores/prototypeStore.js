import { defineStore } from 'pinia'
import { api } from '../utils/api'

export const usePrototypeStore = defineStore('prototype', {
  state: () => ({ list: [], current: null, loading: false }),
  actions: {
    async fetchPrototypes(pid, folderId) {
      this.loading = true
      try {
        const params = folderId ? { folder_id: folderId } : null
        const r = await api.getPrototypes(pid, params)
        this.list = r.data
      } catch {}
      finally { this.loading = false }
    },
    async createPrototype(pid, data) {
      const r = await api.createPrototype(pid, data)
      this.list.unshift(r.data)
      return r.data
    },
    async deletePrototype(ptid) {
      await api.deletePrototype(ptid)
      this.list = this.list.filter(p => p.id !== ptid)
      if (this.current?.id === ptid) this.current = null
    },
    setCurrent(p) { this.current = p },
  },
})
