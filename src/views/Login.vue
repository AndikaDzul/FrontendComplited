<template>
  <div class="login-page">
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div v-if="loading" class="overlay">
      <div class="spinner-wrapper">
        <div class="spinner"></div>
        <div class="spinner-inner"></div>
      </div>
      <p class="mt-3 fw-bold text-dark">Memverifikasi Akun...</p>
    </div>

    <div class="login-card shadow-lg">
      <div class="main-logo-container">
        <img src="../andika.jvg.png" alt="ZieSen Logo" class="brand-image shadow-sm">
      </div>

      <div class="header">
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
          <label>
            <i class="bi" :class="role === 'siswa' ? 'bi-person-badge' : 'bi-envelope'"></i> 
            {{ role === 'siswa' ? 'NIS' : 'Email Address' }}
          </label>
          <input v-model="username" :type="role === 'siswa' ? 'text' : 'email'" 
            :placeholder="role === 'siswa' ? 'Masukkan nomor induk' : 'nama@sekolah.com'" required />
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

      <div class="support-section">
        <p>Mengalami kendala?</p>
        <a :href="`mailto:dika70287@gmail.com?subject=Pengaduan Aplikasi ZieSen - ${role}`" class="support-link">
          <i class="bi bi-chat-dots-fill"></i> Hubungi Admin
        </a>
      </div>
      
      <div class="footer-note mt-4">
        <small>&copy; 2026 ZieSen Team. All Rights Reserved.</small>
      </div>
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
    const userData = response.data.user || response.data.data || response.data

    localStorage.clear()
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('role', role.value)

    if (role.value === 'siswa') {
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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');

.login-page { 
  min-height: 100vh; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  background-color: #f8fafc; 
  font-family: 'Plus Jakarta Sans', sans-serif; 
  overflow: hidden; 
  position: relative; 
  padding: 20px;
}

.main-logo-container {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}
.brand-image {
  width: 111px; 
  height: 111px;
  object-fit: cover;
  border-radius: 24px; 
  border: 4px solid #ffffff;
  background-color: #ffffff;
}

.bg-decoration { position: absolute; width: 100%; height: 100%; z-index: 0; }
.blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.6; }
.blob-1 { width: 400px; height: 400px; background: #e0e7ff; top: -100px; right: -50px; }
.blob-2 { width: 350px; height: 350px; background: #f1f5f9; bottom: -50px; left: -50px; }

.login-card { 
  width: 100%; 
  max-width: 420px; 
  padding: 40px 30px; 
  background: rgba(255, 255, 255, 0.9); 
  backdrop-filter: blur(10px); 
  border: 1px solid #ffffff; 
  border-radius: 32px; 
  z-index: 10; 
  text-align: center;
}

.header { margin-bottom: 25px; }
.header h1 { margin: 0; font-size: 1.6rem; color: #1e293b; font-weight: 800; letter-spacing: -0.5px; }
.header p { color: #64748b; font-size: 0.85rem; margin-top: 5px; font-weight: 500; }

.role-selector { 
  display: flex; 
  background: #f1f5f9; 
  padding: 5px; 
  border-radius: 14px; 
  margin-bottom: 25px; 
}
.role-selector button { 
  flex: 1; 
  padding: 8px; 
  border: none; 
  background: transparent; 
  color: #64748b; 
  font-weight: 700; 
  font-size: 0.8rem;
  cursor: pointer; 
  transition: 0.3s;
  border-radius: 10px;
}
.role-selector button.active { 
  color: #6366f1; 
  background: #ffffff; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); 
}

.form-group { margin-bottom: 18px; text-align: left; }
.form-group label { 
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px; 
  font-size: 0.75rem; 
  color: #475569; 
  font-weight: 700; 
}
.form-group input { 
  width: 100%; 
  padding: 12px 16px; 
  border-radius: 12px; 
  background: #f8fafc; 
  border: 1.5px solid #e2e8f0; 
  color: #1e293b; 
  font-size: 0.9rem;
  transition: 0.3s;
}
.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.btn-primary { 
  width: 100%; 
  padding: 14px; 
  border-radius: 14px; 
  border: none; 
  background: #4f46e5; 
  color: white; 
  font-weight: 700; 
  font-size: 0.95rem;
  cursor: pointer; 
  transition: 0.3s;
  margin-top: 5px;
}
.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(79, 70, 229, 0.3);
}

/* STYLE BARU UNTUK PENGADUAN */
.support-section {
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px dashed #e2e8f0;
}
.support-section p {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 5px;
}
.support-link {
  font-size: 0.85rem;
  color: #4f46e5;
  text-decoration: none;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}
.support-link:hover {
  color: #4338ca;
  text-decoration: underline;
}

.error-container { 
  background: #fff1f2; 
  color: #e11d48; 
  padding: 10px; 
  border-radius: 12px; 
  margin-bottom: 15px; 
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Overlay & Spinner */
.overlay {
  position: fixed; inset: 0; background: rgba(255,255,255,0.8);
  z-index: 9999; display: flex; flex-direction: column;
  align-items: center; justify-content: center; backdrop-filter: blur(4px);
}
.spinner-wrapper { position: relative; width: 60px; height: 60px; }
.spinner {
  width: 100%; height: 100%; border: 4px solid #f3f3f3;
  border-top: 4px solid #6366f1; border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Animasi Slide Up untuk Error */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(10px); }
</style>