import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import StudentDashboard from '../views/StudentDashboard.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true, role:'guru' } },
  { path: '/student-dashboard', component: StudentDashboard, meta: { requiresAuth: true, role:'siswa' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const role = localStorage.getItem('role')

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.meta.role && to.meta.role !== role) {
    next('/login')
  } else {
    next()
  }
})

export default router
