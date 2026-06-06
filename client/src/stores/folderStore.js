import { defineStore } from 'pinia'
import { api } from '../utils/api'

export const useFolderStore = defineStore('folder', {
  state: () => ({ list: [], loading: false }),
  actions: {
    async fetchFolders(pid) {
      this.loading = true
      try { const r = await api.getFolders(pid); this.list = r.data } catch {}
      finally { this.loading = false }
    },
    async createFolder(pid, name) {
      const r = await api.createFolder(pid, { name })
      this.list.push(r.data)
      return r.data
    },
    async renameFolder(fid, name) {
      await api.renameFolder(fid, { name })
      const f = this.list.find(f => f.id === fid)
      if (f) f.name = name
    },
    async deleteFolder(fid) {
      await api.deleteFolder(fid)
      this.list = this.list.filter(f => f.id !== fid)
    },
  },
})
