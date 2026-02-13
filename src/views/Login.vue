<template>
  <div class="login-page">
    <div class="bg-circles">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
    </div>

    <div v-if="loading" class="overlay">
      <div class="spinner-wrapper">
        <div class="spinner"></div>
        <div class="spinner-inner"></div>
      </div>
      <p>Memverifikasi Akun...</p>
    </div>

    <div class="login-card">
      <div class="header">
        <div class="logo-box">
          <i class="bi bi-shield-check"></i>
        </div>
        <h1>ZieSen</h1>
        <p>Smart Attendance System</p>
      </div>

      <div class="role-selector">
        <button v-for="r in ['guru', 'siswa', 'admin']" :key="r"
          type="button" :class="{ active: role === r }" @click="role = r">
          {{ r.charAt(0).toUpperCase() + r.slice(1) }}
        </button>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label><i class="bi bi-person"></i> {{ role === 'siswa' ? 'NIS' : 'Email Address' }}</label>
          <input v-model="username" :type="role === 'siswa' ? 'text' : 'email'" 
            :placeholder="role === 'siswa' ? 'Masukkan NIS' : 'nama@sekolah.com'" required />
        </div>

        <div class="form-group">
          <label><i class="bi bi-lock"></i> Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>

        <Transition name="slide-up">
          <div v-if="error" class="error-container">
            <i class="bi bi-exclamation-circle-fill"></i>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Masuk Sebagai {{ role.charAt(0).toUpperCase() + role.slice(1) }}</span>
          <span v-else>Memproses...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const backendUrl = 'https://backend-complited.vercel.app'
const router = useRouter()
const username = ref('')
const password = ref('')
const role = ref('siswa')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    let endpoint = role.value === 'guru' ? '/teachers/login' : 
                   role.value === 'siswa' ? '/students/login' : '/admins/login'

    const body = role.value === 'siswa' 
      ? { nis: username.value, password: password.value } 
      : { email: username.value, password: password.value }

    const response = await axios.post(`${backendUrl}${endpoint}`, body)
    
    // Fleksibilitas untuk menangkap data dari NestJS
    const userData = response.data.user || response.data.data || response.data

    localStorage.clear()
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('role', role.value)

    if (role.value === 'siswa') {
      // Ambil Nama & Kelas dengan fallback field database yang umum
      const finalName = userData.name || userData.nama || userData.full_name || 'Siswa'
      const finalClass = userData.class || userData.kelas || 'RPL'
      const finalNis = userData.nis || username.value

      localStorage.setItem('studentName', finalName)
      localStorage.setItem('studentNis', finalNis)
      localStorage.setItem('studentClass', finalClass)
      
      router.push('/student-dashboard')
    } else {
      localStorage.setItem('userName', userData.name || userData.nama || 'User')
      router.push(role.value === 'guru' ? '/dashboard' : '/admin-dashboard')
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal masuk. Periksa kembali data Anda.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Style tetap sesuai permintaan (tidak diubah) */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.login-page { height: 100vh; display: flex; justify-content: center; align-items: center; background: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; position: relative; }
.bg-circles { position: absolute; width: 100%; height: 100%; z-index: 0; }
.circle { position: absolute; border-radius: 50%; filter: blur(80px); }
.c1 { width: 400px; height: 400px; background: rgba(79, 70, 229, 0.15); top: -100px; right: -50px; }
.c2 { width: 350px; height: 350px; background: rgba(14, 165, 233, 0.15); bottom: -50px; left: -50px; }
.login-card { width: 90%; max-width: 420px; padding: 40px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); z-index: 10; }
.header { text-align: center; margin-bottom: 30px; }
.logo-box { width: 54px; height: 54px; margin: 0 auto 15px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3); }
.header h1 { margin: 0; font-size: 1.75rem; color: #f8fafc; font-weight: 700; letter-spacing: -1px; }
.header p { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; }
.role-selector { display: flex; background: rgba(15, 23, 42, 0.6); padding: 5px; border-radius: 14px; margin-bottom: 30px; position: relative; border: 1px solid rgba(255, 255, 255, 0.05); }
.role-selector button { flex: 1; padding: 12px; border: none; background: none; color: #94a3b8; font-weight: 600; cursor: pointer; z-index: 1; }
.role-selector button.active { color: #fff; background: rgba(255, 255, 255, 0.08); border-radius: 10px; }
.form-group { margin-bottom: 22px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
.form-group input { width: 100%; padding: 14px 16px; border-radius: 12px; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); color: white; }
.btn-primary { width: 100%; padding: 16px; border-radius: 12px; border: none; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; font-weight: 700; cursor: pointer; }
.error-container { background: rgba(239, 68, 68, 0.1); color: #fca5a5; padding: 12px; border-radius: 12px; margin-bottom: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; }
.overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; color: white; }
.spinner { width: 40px; height: 40px; border: 3px solid #6366f1; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>