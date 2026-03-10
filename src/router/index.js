import { createRouter, createWebHistory } from 'vue-router'

// Views - Pastikan path ini sesuai dengan struktur folder src/views kamu
import Login from '../views/Login.vue'
import AdminDashboard from '../views/Admin.vue'
import TeacherDashboard from '../views/Dashboard.vue'
import StudentDashboard from '../views/StudentDashboard.vue'

const routes = [
  { 
    path: '/', 
    redirect: '/login' 
  },
  { 
    path: '/login', 
    name: 'Login',
    component: Login 
  },
  { 
    path: '/admin-dashboard', 
    name: 'AdminDashboard',
    component: AdminDashboard, 
    meta: { requiresAuth: true, role: 'admin' } 
  },
  { 
    path: '/dashboard', 
    name: 'TeacherDashboard',
    component: TeacherDashboard, 
    meta: { requiresAuth: true, role: 'guru' } 
  },
  { 
    path: '/student-dashboard', 
    name: 'StudentDashboard',
    component: StudentDashboard, 
    meta: { requiresAuth: true, role: 'siswa' } 
  },
  // Fallback: Jika rute tidak ditemukan, arahkan ke login
  { 
    path: '/:pathMatch(.*)*', 
    redirect: '/login' 
  }
]

const router = createRouter({
  // Gunakan createWebHistory untuk URL bersih (tanpa #)
  history: createWebHistory(),
  routes
})

// --- Router Guard (Logic Fix & Improvement) ---
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const role = localStorage.getItem('role')

  // 1. Jika mencoba akses halaman ber-auth tapi belum login
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } 
  // 2. Jika mencoba akses rute spesifik tapi role tidak cocok
  else if (to.meta.role && to.meta.role !== role) {
    // Arahkan ke dashboard masing-masing sesuai role yang benar
    if (role === 'admin') next('/admin-dashboard')
    else if (role === 'guru') next('/dashboard')
    else if (role === 'siswa') next('/student-dashboard')
    else next('/login')
  } 
  // 3. Jika sudah login tapi mencoba akses halaman login lagi
  else if (to.path === '/login' && isLoggedIn) {
    if (role === 'admin') next('/admin-dashboard')
    else if (role === 'guru') next('/dashboard')
    else if (role === 'siswa') next('/student-dashboard')
    else next()
  }
  // 4. Lanjutkan akses
  else {
    next()
  }
})

export default router