<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import axios from 'axios'

const router = useRouter()
const backendUrl = 'https://backend-deployys-tr57.vercel.app'

// ================= STATE =================
const user = ref({ name:'', role:'guru', mapel:'' })
const students = ref([])
const searchQuery = ref('')
const showHistoryFor = ref(null)
const activeTab = ref('hadir')

// ===== QR GURU =====
const guruToken = 'ABSENSI-GURU-2026'
const guruQr = ref('')
let qrInterval = null
const showQrModal = ref(false)

// ================= DARK MODE =================
const darkMode = ref(localStorage.getItem('darkMode') === 'true')
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  localStorage.setItem('darkMode', darkMode.value)
}

// ================= TOAST =================
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showToast = (msg, type='success') => {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => toastVisible.value = false, 3000)
}

// ================= COMPUTED =================
const avatarInitial = computed(() =>
  user.value.name ? user.value.name[0].toUpperCase() : 'G'
)

const filteredStudents = computed(() => {
  let list = students.value
  if (activeTab.value === 'hadir') {
    list = list.filter(s => s.status && s.status !== '')
  } else if (activeTab.value === 'belum') {
    list = list.filter(s => !s.status || s.status === '')
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => 
      s.name.toLowerCase().includes(q) || 
      String(s.nis).includes(q)
    )
  }
  return list
})

const hadirCount = computed(() =>
  students.value.filter(s => s.status === 'Hadir').length
)

// ================= ACTIONS =================
const loadStudents = async () => {
  try {
    const res = await axios.get(`${backendUrl}/students`)
    students.value = res.data.map(s => ({ ...s, history: s.history || [] }))
  } catch(err) {
    console.error('Load siswa gagal:', err)
  }
}

const resetAllAttendance = async () => {
  if(!confirm('Bersihkan semua data kehadiran hari ini?')) return
  try {
    // Note: Sebaiknya backend menyediakan endpoint bulk reset untuk efisiensi
    for (const s of students.value) {
      await axios.patch(`${backendUrl}/students/attendance/${s.nis}`, {
        status: '',
        method: 'system'
      })
      s.status = ''
      s.history = []
    }
    showToast('♻ Database kehadiran telah direset')
    loadStudents()
  } catch (e) {
    showToast('Gagal mereset data', 'error')
  }
}

// ===== FIX LOGOUT FUNCTION =====
const logout = () => {
  // 1. Hapus semua data sesi
  localStorage.removeItem('teacherName')
  localStorage.removeItem('token') // Jika ada token
  localStorage.removeItem('role')
  
  // Jangan hapus darkMode agar preferensi user tetap ada, 
  // tapi jika ingin bersih total gunakan localStorage.clear()
  
  // 2. Redirect ke halaman login
  // Gunakan push agar user bisa kembali jika tidak sengaja, 
  // atau replace jika ingin menghapus history login
  router.push('/login').then(() => {
    // Opsi tambahan: refresh halaman untuk memastikan state bersih
    window.location.reload()
  })
}

const generateQr = async () => {
  const qrData = `${guruToken}-${Date.now()}`
  try {
    guruQr.value = await QRCode.toDataURL(qrData)
  } catch (err) {
    console.error(err)
  }
}

const toggleHistory = (nis) => {
  showHistoryFor.value = showHistoryFor.value === nis ? null : nis
}

onMounted(async () => {
  user.value.name = localStorage.getItem('teacherName') || 'Guru'
  await loadStudents()
  await generateQr()
  qrInterval = setInterval(generateQr, 20000)
})

onUnmounted(() => {
  if(qrInterval) clearInterval(qrInterval)
})
</script>

<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

  <div class="app-container" :class="darkMode ? 'dark-mode' : 'light-mode'">

    <Transition name="slide-fade">
      <div v-if="toastVisible" class="custom-toast" :class="toastType">
        <i :class="toastType === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
        {{ toastMessage }}
      </div>
    </Transition>

    <nav class="app-header shadow-sm border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <div class="avatar-circle">
          {{ avatarInitial }}
        </div>
        <div>
          <span class="d-block small text-secondary">Selamat Mengajar,</span>
          <h1 class="h6 mb-0 fw-bold title-text">{{ user.name }}</h1>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button @click="toggleDarkMode" class="btn btn-theme rounded-circle border-0">
          <i :class="darkMode ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon text-primary'"></i>
        </button>
        <button @click="logout" class="btn btn-outline-danger btn-sm rounded-pill px-3">
          <i class="fa-solid fa-power-off me-1"></i> Keluar
        </button>
      </div>
    </nav>

    <main class="container-fluid p-4">
      <section class="hero-card mb-4">
        <div class="card-body p-4 text-white">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span class="text-uppercase fw-semibold opacity-75 small">Laporan Kehadiran</span>
              <h2 class="display-6 fw-bold my-1">{{ hadirCount }} <span class="h4 opacity-75">/ {{ students.length }}</span></h2>
              <p class="mb-0 small opacity-75">Siswa hadir hari ini</p>
            </div>
            <div class="icon-glow">
              <i class="fa-solid fa-chart-line fa-3x"></i>
            </div>
          </div>
          <div class="progress bg-white bg-opacity-20" style="height: 6px; border-radius: 10px;">
            <div class="progress-bar bg-white" :style="{ width: (students.length > 0 ? (hadirCount/students.length * 100) : 0) + '%' }"></div>
          </div>
        </div>
      </section>

      <section class="mb-4">
        <button @click="showQrModal=true" class="btn w-100 action-card p-3 d-flex align-items-center gap-3 border shadow-sm">
          <div class="icon-box-qr">
            <i class="fa-solid fa-qrcode fa-xl text-primary"></i>
          </div>
          <div class="text-start">
            <strong class="d-block title-text">Buka QR Absensi</strong>
            <small class="text-secondary">Klik untuk discan oleh siswa</small>
          </div>
          <i class="fa-solid fa-chevron-right ms-auto opacity-25"></i>
        </button>
      </section>

      <section class="student-list-section">
        <div class="tab-switcher p-1 mb-3">
          <button @click="activeTab = 'hadir'" :class="{ active: activeTab === 'hadir' }">Hadir</button>
          <button @click="activeTab = 'belum'" :class="{ active: activeTab === 'belum' }">Belum</button>
          <button @click="activeTab = 'semua'" :class="{ active: activeTab === 'semua' }">Semua</button>
        </div>

        <div class="search-box-wrapper mb-4">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input v-model="searchQuery" class="form-control border-0 shadow-sm ps-5 py-2" placeholder="Cari nama atau NIS..." />
        </div>

        <div class="list-container">
          <TransitionGroup name="list">
            <div v-for="s in filteredStudents" :key="s.nis" class="student-card-item bg-card mb-3 p-3 rounded-4 border shadow-sm">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-3">
                  <div class="s-avatar-box">
                    {{ s.name.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="h6 mb-0 fw-bold title-text">{{ s.name }}</h4>
                    <p class="mb-0 small text-secondary">{{ s.class || 'XII RPL' }} • {{ s.nis }}</p>
                  </div>
                </div>
                <span :class="['badge-ui', s.status || 'None']">{{ s.status || 'Belum' }}</span>
              </div>
              
              <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                <button @click="toggleHistory(s.nis)" class="btn btn-link p-0 text-decoration-none small fw-bold">
                  <i class="fa-solid fa-clock-rotate-left me-1"></i> 
                  {{ showHistoryFor === s.nis ? 'Tutup Detail' : 'Riwayat Absen' }}
                </button>
              </div>

              <Transition name="expand">
                <div v-if="showHistoryFor === s.nis" class="history-content mt-3 p-3 rounded-3">
                  <div v-if="s.history && s.history.length > 0">
                    <div v-for="(h, i) in s.history" :key="i" class="time-node d-flex justify-content-between small mb-1">
                      <span><i class="fa-solid fa-circle-check text-success me-2"></i>{{ h.status }}</span>
                      <span class="text-secondary">{{ new Date(h.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) }}</span>
                    </div>
                  </div>
                  <div v-else class="text-center small text-secondary py-2">Belum ada riwayat tercatat</div>
                </div>
              </Transition>
            </div>
          </TransitionGroup>

          <div v-if="filteredStudents.length === 0" class="text-center py-5 opacity-50">
            <i class="fa-solid fa-folder-open fa-3x mb-3"></i>
            <p>Data tidak ditemukan</p>
          </div>
        </div>

        <button @click="resetAllAttendance" class="btn btn-reset-custom w-100 mt-4 rounded-4 py-3">
          <i class="fa-solid fa-trash-can me-2"></i> Reset Kehadiran Hari Ini
        </button>
      </section>
    </main>

    <Transition name="pop">
      <div v-if="showQrModal" class="modal-overlay" @click.self="showQrModal=false">
        <div class="bottom-sheet bg-card rounded-top-5 p-4 w-100 shadow-lg text-center">
          <div class="drag-handle mx-auto mb-4"></div>
          <h5 class="fw-bold title-text mb-1">QR Code Absensi</h5>
          <p class="small text-secondary mb-4">Siswa silakan scan untuk mencatat kehadiran</p>
          
          <div class="qr-wrapper-box mx-auto p-3 bg-white shadow-sm mb-4">
            <img :src="guruQr" class="img-fluid" alt="QR" />
            <div class="qr-progress-bar mt-3">
              <div class="qr-progress-fill"></div>
            </div>
          </div>

          <p class="small text-muted"><i class="fa-solid fa-sync fa-spin me-2"></i> Diupdate otomatis (20 detik)</p>
          <button @click="showQrModal=false" class="btn btn-primary w-100 rounded-pill py-2 mt-2">Tutup</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* CSS VARIABLES & BASE */
.app-container {
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --text-bold: #0f172a;
  --text-muted: #64748b;
  --primary: #4f46e5;
  --light-gray: #f1f5f9;
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  transition: 0.3s;
  background: var(--bg-main);
}

.dark-mode {
  --bg-main: #020617;
  --bg-card: #1e293b;
  --text-bold: #f8fafc;
  --text-muted: #94a3b8;
  --light-gray: #334155;
}

.bg-card { background: var(--bg-card) !important; }
.title-text { color: var(--text-bold) !important; }

/* HEADER */
.avatar-circle {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.1rem;
}
.app-header { background: var(--bg-card); position: sticky; top: 0; z-index: 100; }

/* HERO CARD */
.hero-card {
  border: none; border-radius: 28px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  box-shadow: 0 15px 35px -5px rgba(0,0,0,0.2);
}
.icon-glow { filter: drop-shadow(0 0 8px rgba(255,255,255,0.4)); }

/* ACTION CARD */
.action-card {
  background: var(--bg-card); border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.05) !important;
}
.icon-box-qr {
  width: 50px; height: 50px; border-radius: 15px;
  background: #eef2ff; display: flex; align-items: center; justify-content: center;
}

/* TABS */
.tab-switcher { background: var(--light-gray); border-radius: 15px; display: flex; }
.tab-switcher button {
  flex: 1; border: none; background: none; padding: 10px;
  border-radius: 12px; font-weight: 700; font-size: 0.8rem;
  color: var(--text-muted); transition: 0.3s;
}
.tab-switcher button.active {
  background: var(--bg-card); color: var(--primary);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

/* SEARCH */
.search-box-wrapper { position: relative; }
.search-icon { position: absolute; left: 18px; top: 13px; opacity: 0.4; }
.search-box-wrapper input { background: var(--bg-card); border-radius: 15px; }

/* STUDENT CARDS */
.s-avatar-box {
  width: 44px; height: 44px; border-radius: 14px;
  background: var(--light-gray); color: var(--primary);
  display: flex; align-items: center; justify-content: center; font-weight: 800;
}
.badge-ui {
  font-size: 0.7rem; font-weight: 800; padding: 5px 12px; border-radius: 8px;
  text-transform: uppercase;
}
.badge-ui.Hadir { background: #dcfce7; color: #15803d; }
.badge-ui.None { background: #f1f5f9; color: #64748b; }

.history-content { background: var(--light-gray); }

/* RESET BUTTON */
.btn-reset-custom {
  background: none; border: 2px dashed #f43f5e; color: #f43f5e;
  font-weight: 800; transition: 0.3s;
}
.btn-reset-custom:hover { background: #fff1f2; }

/* MODAL BOTTOM SHEET */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: flex-end;
}
.bottom-sheet { animation: slideUp 0.4s ease-out; }
.drag-handle { width: 40px; height: 5px; background: #cbd5e1; border-radius: 10px; }
.qr-wrapper-box { width: 250px; border-radius: 20px; }
.qr-progress-bar { height: 4px; background: #e0e7ff; border-radius: 10px; overflow: hidden; }
.qr-progress-fill {
  height: 100%; background: var(--primary); width: 100%;
  animation: loadingBar 20s linear infinite;
}

/* ANIMATIONS */
@keyframes loadingBar { from { width: 100%; } to { width: 0%; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-20px); }

.pop-enter-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from { transform: scale(0.8); opacity: 0; }

.custom-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999; padding: 12px 25px; border-radius: 50px;
  color: white; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.custom-toast.success { background: #10b981; }
.custom-toast.error { background: #ef4444; }

.btn-theme { background: var(--light-gray); width: 38px; height: 38px; }

/* Transitions for history expansion */
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; max-height: 200px; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; padding-top: 0 !important; padding-bottom: 0 !important; }
</style>