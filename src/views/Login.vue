<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const backendUrl = 'https://backend-deployys-bere9s.vercel.app'
const router = useRouter()

const username = ref('')
const password = ref('')
const role = ref('guru')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = 'Email dan password wajib diisi'
    return
  }

  loading.value = true
  
  // Debugging: Cek data sebelum dikirim
  console.log("Mencoba login...", { email: username.value, role: role.value });

  try {
    let endpoint = ''
    if (role.value === 'guru') endpoint = '/teachers/login'
    else if (role.value === 'siswa') endpoint = '/students/login'
    else if (role.value === 'admin') endpoint = '/admins/login'

    const response = await axios.post(`${backendUrl}${endpoint}`, {
      email: username.value,
      password: password.value
    })

    // Kadang response backend berada di response.data atau response.data.user
    // Kita buat fleksibel
    const data = response.data.user || response.data

    console.log("Login Berhasil, Data User:", data)

    // ================= SIMPAN KE LOCALSTORAGE =================
    localStorage.clear() // Bersihkan sisa session lama
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('role', role.value)

    if (role.value === 'guru') {
      localStorage.setItem('teacherId', data._id)
      localStorage.setItem('teacherName', data.name)
      localStorage.setItem('teacherMapel', data.mapel || '')
      router.push('/dashboard')
    } 
    else if (role.value === 'siswa') {
      localStorage.setItem('studentId', data._id)
      localStorage.setItem('studentName', data.name)
      localStorage.setItem('studentNis', data.nis)
      localStorage.setItem('studentClass', data.class)
      // Simpan status absen terakhir jika ada dari backend
      if (data.status) localStorage.setItem('studentStatus', data.status)
      router.push('/student-dashboard')
    } 
    else if (role.value === 'admin') {
      localStorage.setItem('adminId', data._id)
      localStorage.setItem('adminName', data.name)
      localStorage.setItem('adminEmail', data.email)
      router.push('/admin-dashboard')
    }

  } catch (err) {
    console.error("Detail Error Login:", err.response || err)
    
    // Pesan error lebih spesifik
    if (!err.response) {
      error.value = 'Tidak dapat terhubung ke server. Cek koneksi internet.'
    } else {
      error.value = err.response.data?.message || 'Email atau Password salah'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div v-if="loading" class="overlay">
      <div class="spinner"></div>
      <p>Memverifikasi Akun...</p>
    </div>

    <div class="login-card">
      <div class="header">
        <h1>Absensi Digital</h1>
        <p>Silakan masuk ke akun Anda</p>
      </div>

      <div class="role-switch">
        <button type="button" :class="{ active: role === 'guru' }" @click="role = 'guru'">Guru</button>
        <button type="button" :class="{ active: role === 'siswa' }" @click="role = 'siswa'">Siswa</button>
        <button type="button" :class="{ active: role === 'admin' }" @click="role = 'admin'">Admin</button>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Email Address</label>
          <input 
            v-model="username" 
            type="email" 
            placeholder="nama@sekolah.com" 
            required 
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            autocomplete="current-password"
          />
        </div>

        <Transition name="fade">
          <p v-if="error" class="error-msg">{{ error }}</p>
        </Transition>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Sedang Masuk...' : 'Login sebagai ' + role.charAt(0).toUpperCase() + role.slice(1) }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
  font-family: 'Inter', sans-serif;
}

.login-card {
  width: 90%;
  max-width: 400px;
  padding: 40px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

.header { text-align: center; margin-bottom: 30px; }
.header h1 { margin: 0 0 8px 0; font-size: 1.75rem; color: #1f2937; }
.header p { margin: 0; color: #6b7280; font-size: 0.9rem; }

.role-switch { 
  display: flex; 
  gap: 8px; 
  margin-bottom: 25px; 
  background: #f3f4f6;
  padding: 4px;
  border-radius: 10px;
}
.role-switch button { 
  flex: 1; 
  padding: 8px; 
  border-radius: 8px; 
  border: none; 
  background: transparent; 
  cursor: pointer; 
  transition: 0.3s; 
  font-weight: 600; 
  font-size: 0.85rem;
  color: #6b7280;
}
.role-switch button.active { 
  background: white; 
  color: #4f46e5; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-group input { 
  width: 100%; 
  padding: 12px; 
  border-radius: 8px; 
  border: 1px solid #d1d5db; 
  font-size: 1rem;
}
.form-group input:focus { 
  outline: none; 
  border-color: #4f46e5; 
  box-shadow: 0 0 0 3px rgba(79,70,229,0.1); 
}

.error-msg { 
  color: #ef4444; 
  background: #fee2e2;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px; 
  font-size: 0.85rem; 
  text-align: center;
}

.btn-primary { 
  width: 100%; 
  padding: 14px; 
  background: #4f46e5; 
  color: white; 
  border: none; 
  border-radius: 8px; 
  font-weight: bold; 
  cursor: pointer; 
  transition: 0.2s; 
}
.btn-primary:hover { background: #4338ca; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.overlay {
  position: fixed; inset: 0;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  z-index: 9999; color: #4f46e5;
}

.spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  width: 40px; height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>