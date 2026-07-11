import { defineStore } from 'pinia'
import { getAuthor } from '../utils/author'

function loadDarkMode() {
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) return saved === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    resolution: 'full',
    author: getAuthor(),
    darkMode: loadDarkMode(),
  }),
  getters: {
    resolutionWidth: (state) => {
      switch (state.resolution) {
        case 'desktop': return 1440
        case 'tablet': return 768
        case 'mobile': return 375
        default: return null
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
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      localStorage.setItem('darkMode', this.darkMode)
    },
  },
})