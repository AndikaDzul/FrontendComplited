<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import axios from 'axios'

const router = useRouter()
const backendUrl = 'https://backend-deployys-bere9s.vercel.app'

// ================= STATE =================
const user = ref({ name:'', role:'guru', mapel:'' })
const students = ref([])
const searchQuery = ref('')
const showHistoryFor = ref(null)
const activeTab = ref('hadir') // Tab default: 'hadir'

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

// LOGIC: Filter berdasarkan tab dan pencarian
const filteredStudents = computed(() => {
  let list = students.value

  // Filter berdasarkan tab
  if (activeTab.value === 'hadir') {
    list = list.filter(s => s.status && s.status !== '')
  } else if (activeTab.value === 'belum') {
    list = list.filter(s => !s.status || s.status === '')
  }

  // Filter berdasarkan pencarian
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.nis.includes(q)
    )
  }

  return list
})

const hadirCount = computed(() =>
  students.value.filter(s => s.status === 'Hadir').length
)

// ================= LOAD STUDENTS =================
const loadStudents = async () => {
  try {
    const res = await axios.get(`${backendUrl}/students`)
    students.value = res.data.map(s => ({ ...s, history: s.history || [] }))
  } catch(err) {
    console.error('Load siswa gagal:', err)
  }
}

// ================= RESET =================
const resetAllAttendance = async () => {
  if(!confirm('Bersihkan semua data kehadiran hari ini?')) return
  try {
    for (const s of students.value) {
      await axios.patch(`${backendUrl}/students/attendance/${s.nis}`, {
        status: '',
        method: 'system'
      })
      s.status = ''
      s.history = []
    }
    showToast('♻ Database kehadiran telah direset')
  } catch (e) {
    showToast('Gagal mereset data', 'error')
  }
}

const logout = () => {
  localStorage.clear()
  router.replace('/login')
}

const generateQr = async () => {
  const qrData = `${guruToken}-${Date.now()}`
  guruQr.value = await QRCode.toDataURL(qrData)
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
<div :class="['app-container', darkMode ? 'dark' : 'light']">

  <Transition name="toast">
    <div v-if="toastVisible" class="toast-notif" :class="toastType">
      <span class="toast-icon">{{ toastType === 'success' ? '✅' : '❌' }}</span>
      {{ toastMessage }}
    </div>
  </Transition>

  <nav class="glass-nav">
    <div class="nav-content">
      <div class="user-profile">
        <div class="avatar-ring">
          <div class="avatar-box">{{ avatarInitial }}</div>
          <div class="online-indicator"></div>
        </div>
        <div class="user-text">
          <span class="welcome">Selamat Mengajar,</span>
          <span class="user-name">{{ user.name }}</span>
        </div>
      </div>
      <div class="nav-actions">
        <button @click="toggleDarkMode" class="circle-btn">
          {{ darkMode ? '☀️' : '🌙' }}
        </button>
        <button @click="logout" class="circle-btn logout">🚪</button>
      </div>
    </div>
  </nav>

  <main class="content-wrapper">
    <section class="hero-card">
      <div class="hero-info">
        <h3>Laporan Kehadiran</h3>
        <p>Pantau partisipasi siswa secara real-time</p>
      </div>
      <div class="stats-row">
        <div class="stat-pill">
          <span class="s-val">{{ hadirCount }}</span>
          <span class="s-lab">Hadir</span>
        </div>
        <div class="stat-separator"></div>
        <div class="stat-pill">
          <span class="s-val">{{ students.length }}</span>
          <span class="s-lab">Total Siswa</span>
        </div>
      </div>
    </section>

    <section class="qr-trigger-section">
      <button @click="showQrModal=true" class="qr-main-button">
        <div class="qr-icon-wrap">
          <div class="qr-inner-icon">📱</div>
        </div>
        <div class="qr-btn-text">
          <strong>Buka QR Absensi</strong>
          <span>Scan untuk mencatat kehadiran</span>
        </div>
        <span class="chevron">→</span>
      </button>
    </section>

    <section class="student-section">
      <div class="section-header">
        <div class="tab-switcher">
          <button @click="activeTab = 'hadir'" :class="{ active: activeTab === 'hadir' }">Sudah Absen</button>
          <button @click="activeTab = 'belum'" :class="{ active: activeTab === 'belum' }">Belum Absen</button>
          <button @click="activeTab = 'semua'" :class="{ active: activeTab === 'semua' }">Semua</button>
        </div>
        
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" placeholder="Cari nama siswa..." />
        </div>
      </div>

      <div class="list-wrapper">
        <TransitionGroup name="list" tag="div" class="list-anim">
          <div v-for="s in filteredStudents" :key="s.nis" class="student-card-modern">
            <div class="card-body">
              <div class="s-avatar">{{ s.name.charAt(0) }}</div>
              <div class="s-details">
                <h4>{{ s.name }}</h4>
                <p>{{ s.class || 'Kelas -' }} • {{ s.nis }}</p>
              </div>
              <div class="s-status">
                <span :class="['badge', s.status || 'None']">{{ s.status || 'Pending' }}</span>
              </div>
            </div>
            
            <div class="card-footer">
              <button @click="toggleHistory(s.nis)" class="history-toggle-btn">
                {{ showHistoryFor === s.nis ? 'Tutup Detail' : 'Lihat Waktu Absen' }}
              </button>
              <Transition name="expand">
                <div v-if="showHistoryFor === s.nis" class="history-content">
                  <div v-if="s.history.length > 0" class="history-timeline">
                    <div v-for="(h, i) in s.history" :key="i" class="time-node">
                      <span class="node-dot"></span>
                      <span class="node-status">{{ h.status }}</span>
                      <span class="node-time">{{ new Date(h.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) }}</span>
                    </div>
                  </div>
                  <div v-else class="empty-node">Belum ada riwayat tercatat</div>
                </div>
              </Transition>
            </div>
          </div>
        </TransitionGroup>

        <div v-if="filteredStudents.length === 0" class="empty-state">
          <div class="empty-illu">📂</div>
          <p>Tidak ada data siswa ditemukan</p>
        </div>
      </div>

      <button @click="resetAllAttendance" class="danger-outline-btn">
        🗑️ Reset Data Absensi Hari Ini
      </button>
    </section>
  </main>

  <Transition name="modal">
    <div v-if="showQrModal" class="modal-overlay" @click.self="showQrModal=false">
      <div class="modal-card">
        <div class="modal-line"></div>
        <div class="modal-top">
          <h4>Scan QR Code</h4>
          <p>Siswa silakan scan kode di bawah ini</p>
          <button class="close-modal-btn" @click="showQrModal=false">✕</button>
        </div>
        <div class="qr-container-box">
          <img :src="guruQr" class="qr-img" />
          <div class="qr-loader"></div>
        </div>
        <div class="qr-footer-msg">
          <span class="sync-icon">🔄</span> Terupdate otomatis setiap 20 detik
        </div>
      </div>
    </div>
  </Transition>

</div>
</template>

<style scoped>
/* BASE STYLES */
.app-container {
  min-height: 100vh;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: 60px;
}
.light { background: #f0f4f8; color: #1a202c; }
.dark { background: #0b0e14; color: #e2e8f0; }

/* NAVIGATION */
.glass-nav {
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(12px);
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.light .glass-nav { background: rgba(240, 244, 248, 0.8); }
.dark .glass-nav { background: rgba(11, 14, 20, 0.8); }

.nav-content {
  max-width: 600px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
}
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar-ring { position: relative; }
.avatar-box {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #9333ea);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.online-indicator {
  position: absolute; bottom: -2px; right: -2px;
  width: 12px; height: 12px; background: #10b981;
  border: 2px solid white; border-radius: 50%;
}
.user-text { display: flex; flex-direction: column; }
.welcome { font-size: 0.7rem; opacity: 0.6; }
.user-name { font-weight: 700; font-size: 0.95rem; }

.nav-actions { display: flex; gap: 10px; }
.circle-btn {
  width: 40px; height: 40px; border-radius: 50%; border: none;
  background: white; cursor: pointer; display: flex;
  align-items: center; justify-content: center; font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: 0.3s;
}
.dark .circle-btn { background: #1e293b; color: white; }
.circle-btn.logout { color: #ef4444; }
.circle-btn:active { transform: scale(0.9); }

/* CONTENT WRAPPER */
.content-wrapper { max-width: 600px; margin: 0 auto; padding: 20px 16px; }

/* HERO CARD */
.hero-card {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: white; border-radius: 28px; padding: 24px;
  margin-bottom: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  position: relative; overflow: hidden;
}
.hero-card::after {
  content: ''; position: absolute; top: -50%; right: -20%;
  width: 200px; height: 200px; background: rgba(79, 70, 229, 0.2);
  filter: blur(50px); border-radius: 50%;
}
.hero-info h3 { font-size: 1.4rem; margin: 0; font-weight: 800; }
.hero-info p { font-size: 0.85rem; opacity: 0.7; margin: 6px 0 20px 0; }

.stats-row { display: flex; align-items: center; background: rgba(255,255,255,0.05); border-radius: 18px; padding: 12px; }
.stat-pill { flex: 1; text-align: center; display: flex; flex-direction: column; }
.s-val { font-size: 1.5rem; font-weight: 800; }
.s-lab { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
.stat-separator { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

/* QR TRIGGER BUTTON */
.qr-trigger-section { margin-bottom: 30px; }
.qr-main-button {
  width: 100%; padding: 16px; border-radius: 24px; border: none;
  background: white; display: flex; align-items: center; gap: 16px;
  cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
  transition: 0.3s;
}
.dark .qr-main-button { background: #1e293b; color: white; }
.qr-icon-wrap {
  width: 50px; height: 50px; border-radius: 16px;
  background: #eef2ff; display: flex; align-items: center; justify-content: center;
}
.dark .qr-icon-wrap { background: #312e81; }
.qr-inner-icon { font-size: 1.5rem; }
.qr-btn-text { flex: 1; text-align: left; display: flex; flex-direction: column; }
.qr-btn-text strong { font-size: 1rem; }
.qr-btn-text span { font-size: 0.75rem; opacity: 0.6; }
.chevron { font-size: 1.2rem; opacity: 0.3; }
.qr-main-button:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }

/* SECTION HEADER & TABS */
.section-header { margin-bottom: 16px; }
.tab-switcher {
  display: flex; gap: 8px; background: rgba(0,0,0,0.03);
  padding: 6px; border-radius: 14px; margin-bottom: 16px;
}
.dark .tab-switcher { background: rgba(255,255,255,0.05); }
.tab-switcher button {
  flex: 1; border: none; padding: 8px; border-radius: 10px;
  font-size: 0.8rem; font-weight: 600; cursor: pointer;
  background: transparent; color: inherit; transition: 0.3s;
}
.tab-switcher button.active {
  background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.dark .tab-switcher button.active { background: #334155; }

.search-box {
  position: relative; display: flex; align-items: center;
}
.search-icon { position: absolute; left: 14px; opacity: 0.4; }
.search-box input {
  width: 100%; padding: 12px 12px 12px 42px; border-radius: 16px;
  border: 1px solid transparent; outline: none; background: white;
  font-size: 0.9rem; transition: 0.3s;
}
.dark .search-box input { background: #1e293b; color: white; }
.search-box input:focus { border-color: #6366f1; }

/* STUDENT CARDS */
.student-card-modern {
  background: white; border-radius: 20px; margin-bottom: 12px;
  padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: 0.3s; border: 1px solid rgba(0,0,0,0.02);
}
.dark .student-card-modern { background: #1e293b; border-color: rgba(255,255,255,0.05); }

.card-body { display: flex; align-items: center; gap: 14px; }
.s-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: #f1f5f9; display: flex; align-items: center;
  justify-content: center; font-weight: 800; color: #6366f1;
}
.dark .s-avatar { background: #0f172a; }
.s-details { flex: 1; }
.s-details h4 { margin: 0; font-size: 0.95rem; font-weight: 700; }
.s-details p { margin: 2px 0 0 0; font-size: 0.75rem; opacity: 0.6; }

.badge {
  font-size: 0.7rem; font-weight: 800; padding: 5px 12px; border-radius: 8px;
  text-transform: uppercase;
}
.badge.Hadir { background: #dcfce7; color: #15803d; }
.badge.Izin { background: #fef9c3; color: #a16207; }
.badge.Sakit { background: #e0f2fe; color: #0369a1; }
.badge.Alfa { background: #fee2e2; color: #b91c1c; }
.badge.None { background: #f1f5f9; color: #64748b; }

.card-footer { margin-top: 12px; border-top: 1px solid rgba(0,0,0,0.03); padding-top: 10px; }
.dark .card-footer { border-color: rgba(255,255,255,0.05); }
.history-toggle-btn {
  background: none; border: none; color: #6366f1;
  font-size: 0.75rem; font-weight: 700; cursor: pointer;
}

.history-content { margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 12px; }
.dark .history-content { background: rgba(0,0,0,0.2); }
.history-timeline { display: flex; flex-direction: column; gap: 8px; }
.time-node { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; }
.node-dot { width: 6px; height: 6px; background: #6366f1; border-radius: 50%; }
.node-time { margin-left: auto; opacity: 0.5; }

/* DANGER ACTION */
.danger-outline-btn {
  width: 100%; margin-top: 30px; padding: 14px; border-radius: 16px;
  background: none; border: 1.5px dashed #ef4444; color: #ef4444;
  font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.3s;
}
.danger-outline-btn:hover { background: #fef2f2; }
.dark .danger-outline-btn:hover { background: rgba(239, 68, 68, 0.1); }

/* MODAL STYLES */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px); display: flex; align-items: flex-end;
  z-index: 1000;
}
.modal-card {
  background: white; width: 100%; border-radius: 32px 32px 0 0;
  padding: 24px; position: relative; animation: slideUp 0.4s ease-out;
}
.dark .modal-card { background: #1e293b; }
.modal-line {
  width: 40px; height: 4px; background: rgba(0,0,0,0.1);
  border-radius: 2px; margin: -12px auto 20px auto;
}
.modal-top { text-align: center; margin-bottom: 24px; }
.modal-top h4 { margin: 0; font-size: 1.2rem; }
.modal-top p { font-size: 0.8rem; opacity: 0.6; margin: 4px 0 0 0; }
.close-modal-btn {
  position: absolute; top: 20px; right: 20px;
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: #f1f5f9; cursor: pointer;
}
.dark .close-modal-btn { background: #0f172a; color: white; }

.qr-container-box {
  background: white; padding: 20px; border-radius: 24px;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}
.qr-img { width: 220px; height: 220px; }
.qr-loader {
  width: 100%; height: 4px; background: #e0e7ff;
  border-radius: 2px; margin-top: 15px; position: relative; overflow: hidden;
}
.qr-loader::after {
  content: ''; position: absolute; left: 0; top: 0; height: 100%;
  background: #6366f1; width: 100%; animation: loadBar 20s linear infinite;
}

.qr-footer-msg {
  margin-top: 20px; text-align: center; font-size: 0.75rem; opacity: 0.6;
}

/* ANIMATIONS */
@keyframes loadBar { from { width: 100%; } to { width: 0%; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-20px); }

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; max-height: 200px; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }

.toast-notif {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  padding: 12px 20px; border-radius: 16px; background: #1a202c; color: white;
  display: flex; align-items: center; gap: 10px; font-weight: 700;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 2000; font-size: 0.85rem;
}
.toast-notif.error { background: #ef4444; }

.empty-state {
  text-align: center; padding: 40px 0; opacity: 0.5;
}
.empty-illu { font-size: 3rem; margin-bottom: 10px; }

/* RESPONSIVE */
@media (max-width: 480px) {
  .hero-card { border-radius: 0 0 24px 24px; margin: -20px -16px 20px -16px; }
  .modal-card { padding-bottom: 40px; }
}
</style>