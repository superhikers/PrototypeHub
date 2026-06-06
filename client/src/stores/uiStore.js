import { defineStore } from 'pinia'
import { getAuthor } from '../utils/author'

export const useUiStore = defineStore('ui', {
  state: () => ({
    resolution: 'full',  // 'full' | 'desktop' | 'tablet' | 'mobile'
    author: getAuthor(),
  }),
  getters: {
    resolutionWidth: (state) => {
      switch (state.resolution) {
        case 'desktop': return 1440
        case 'tablet': return 768
        case 'mobile': return 375
        default: return null  // full width
      }
    },
    resolutionLabel: (state) => {
      switch (state.resolution) {
        case 'desktop': return '桌面'
        case 'tablet': return '平板'
        case 'mobile': return '手机'
        default: return '自适应'
      }
    },
  },
  actions: {
    setResolution(res) { this.resolution = res },
    setAuthor(name) { this.author = name },
  },
})
