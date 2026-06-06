import { createRouter, createWebHistory } from 'vue-router'
import ProjectList from '../pages/ProjectList.vue'

const routes = [
  { path: '/', name: 'projects', component: ProjectList },
  { path: '/project/:id', name: 'project-detail', component: () => import('../pages/ProjectDetail.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
