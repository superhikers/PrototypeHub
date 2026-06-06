import { createRouter, createWebHistory } from 'vue-router'
import ProjectList from '../pages/ProjectList.vue'

const routes = [
  { path: '/', name: 'projects', component: ProjectList },
  { path: '/project/:id', name: 'project-detail', component: () => import('../pages/ProjectDetail.vue') },
  { path: '/project/:id/settings', name: 'settings', component: () => import('../pages/Settings.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
