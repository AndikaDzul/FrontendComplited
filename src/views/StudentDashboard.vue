<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import axios from 'axios'

const router = useRouter()
const backendUrl = 'https://backend-deployys-tr57.vercel.app'

// ================= STATE SISWA & TEMA =================
const student = ref({ name:'', nis:'', class:'', status:'', lastAttendance: null })
const myAttendanceHistory = ref([]) 
const qrVisible = ref(false)
const scheduleVisible = ref(false)
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
let html5QrCode = null
let scanning = false
const guruTokenPrefix = 'ABSENSI-GURU-'
const jadwalHariIni = ref([])

// ================= TEMA LOGIC =================
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// ================= AUDIO, VIBRATE & TOAST =================
const playSuccessFeedback = () => {
  const audio = new Audio('/sounds/succes.mp3')
  audio.play().catch(e => console.log("Audio play blocked"))
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }
}

const toast = ref({ show:false, msg:'', type:'success' })
const showToast = (msg,type='success')=>{
  toast.value = { show:true, msg, type }
  setTimeout(()=>toast.value.show=false,3000)
}

// ================= LOGIKA STATUS (TIDAK BERUBAH) =================
const canAbsen = computed(() => {
  if (!student.value.lastAttendance) return true
  const lastTime = new Date(student.value.lastAttendance).getTime()
  const now = new Date().getTime()
  const nineHalfHours = 9.5 * 60 * 60 * 1000
  return (now - lastTime) > nineHalfHours
})

const isLate = computed(() => {
  const now = new Date()
  return now.getHours() >= 15 
})

const displayStatus = computed(() => {
  if (!canAbsen.value) return 'Sudah Hadir'
  if (canAbsen.value && isLate.value) return 'Alfa'
  return 'Belum Absen'
})

const hariIni = computed(()=> new Date().toLocaleDateString('id-ID', { weekday: 'long' }))

const formatDateTime = (ts) => {
  if(!ts) return { hari: '', jam: '' }
  const d = new Date(ts)
  if(isNaN(d.getTime())) return { hari: 'Format Salah', jam: '' }
  return {
    hari: d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' }),
    jam: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
}

// ================= DATA JADWAL =================
const jadwalAll = {
  "Senin":[{ jam:"07:10", mapel:"Konsentrasi RPL", guru:"Yaqub Hadi Permana, S.T." }, { jam:"09:25", mapel:"Pancasila", guru:"Ati Melani" }, { jam:"13:50", mapel:"Matematika", guru:"Hinda Gumiarti, M.Pd" }],
  "Selasa":[{ jam:"07:10", mapel:"Konsentrasi XII RPL-2", guru:"Yaqub Hadi Permana, S.T." }, { jam:"12:30", mapel:"Konsentrasi XII RPL-2", guru:"Fajar M. Sukmawijaya, M.Kom" }],
  "Rabu":[{ jam:"07:10", mapel:"Bahasa Jepang", guru:"Pradita Surya Arianti" }, { jam:"08:30", mapel:"Konsentrasi XII RPL-2", guru:"Yaqub Hadi Permana, S.T." }],
  "Kamis":[{ jam:"07:10", mapel:"PAB", guru:"Dikdik Juanda, S.Pd.I." }, { jam:"12:30", mapel:"Konsentrasi XII RPL-2", guru:"Yayat Ruhiyat, S.ST" }],
  "Jumat":[{ jam:"07:10", mapel:"B. Indonesia", guru:"Rubaetul Adawiyah, S.Pd" }, { jam:"10:05", mapel:"Konsentrasi XII RPL-2", guru:"Sarah Siti Sumaerah, S.T." }]
}

const loadJadwalHariIni = ()=> { jadwalHariIni.value = jadwalAll[hariIni.value] || [] }

// ================= QR SCANNER =================
const startScan = async()=>{
  if(!canAbsen.value){
    showToast('Kamu sudah absen.','error')
    return
  }
  qrVisible.value = true
  scanning = false
  setTimeout(async()=>{
    try {
      html5QrCode = new Html5Qrcode('qr-reader')
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps:15, qrbox: 250 },
        async(decodedText)=>{
          if(scanning) return
          if(!decodedText.startsWith(guruTokenPrefix)){
            showToast('QR Code Tidak Valid','error')
            return
          }
          scanning = true
          await submitAttendance(decodedText)
        }
      )
    } catch (err) {
      showToast('Kamera Bermasalah','error')
      qrVisible.value = false
    }
  },300)
}

const stopScan = async()=>{
  if(html5QrCode) { 
    try { await html5QrCode.stop(); await html5QrCode.clear() } catch(e) {}
  }
  qrVisible.value = false
}

const submitAttendance = async(decodedText)=>{
  try{
    const now = new Date()
    const payload = { status: 'Hadir', qrToken: decodedText, timestamp: now.toISOString() }
    await axios.patch(`${backendUrl}/students/attendance/${student.value.nis}`, payload)
    student.value.status = 'Hadir'
    student.value.lastAttendance = now.toISOString()
    playSuccessFeedback()
    showToast('Berhasil Absen!')
    stopScan()
    loadAttendance() 
  } catch(err){
    showToast(err.response?.data?.message || 'Gagal mengirim absensi','error')
    scanning = false
  }
}

const loadAttendance = async ()=>{
  try{
    const res = await axios.get(`${backendUrl}/students`)
    const me = res.data.find(s => s.nis === student.value.nis)
    if(me) {
      student.value.status = me.status
      if(me.attendanceHistory && me.attendanceHistory.length > 0) {
        myAttendanceHistory.value = [...me.attendanceHistory].reverse()
        student.value.lastAttendance = me.attendanceHistory[me.attendanceHistory.length - 1].timestamp || me.updatedAt
      }
    }
  } catch(err){ console.log('Syncing...') }
}

// ================= FIXED LOGOUT =================
const logout = async () => {
  localStorage.clear() // Hapus semua session
  await router.push('/login') // Pindah ke halaman login
  window.location.reload() // Opsional: Memastikan state bersih total
}

onMounted(()=>{
  const nis = localStorage.getItem('studentNis')
  if(!nis){ 
    router.replace('/login')
    return 
  }
  student.value = { 
    name: localStorage.getItem('studentName'), 
    nis, 
    class: localStorage.getItem('studentClass'), 
    status:'',
    lastAttendance: null
  }
  loadJadwalHariIni()
  loadAttendance()
  const interval = setInterval(loadAttendance, 5000)
  onUnmounted(() => clearInterval(interval))
})

onUnmounted(()=> stopScan())
</script>

<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

  <div class="mobile-app" :class="{ 'dark-mode': isDarkMode }">
    <Transition name="slide-fade">
      <div v-if="toast.show" class="custom-toast" :class="toast.type">
        <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
        {{ toast.msg }}
      </div>
    </Transition>

    <header class="app-header shadow-sm border-bottom px-4 py-3 d-flex justify-content-between align-items-center bg-card">
      <div class="d-flex align-items-center gap-3">
        <div class="avatar-circle">
          {{ student.name?.[0] }}
        </div>
        <div>
          <h1 class="h6 mb-0 fw-bold title-text">{{ student.name }}</h1>
          <small class="text-secondary">{{ student.class }} • {{ student.nis }}</small>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button @click="toggleTheme" class="btn btn-theme rounded-circle border-0">
          <i :class="isDarkMode ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon text-primary'"></i>
        </button>
        <button @click="logout" class="btn btn-outline-danger btn-sm rounded-pill px-3">
          <i class="fa-solid fa-power-off me-1"></i> Keluar
        </button>
      </div>
    </header>

    <main class="container-fluid p-4">
      <section class="status-card mb-4" :class="displayStatus === 'Sudah Hadir' ? 'is-hadir' : (displayStatus === 'Alfa' ? 'is-alfa' : 'is-none')">
        <div class="card-body p-4 d-flex justify-content-between align-items-center text-white">
          <div>
            <span class="text-uppercase fw-semibold opacity-75 small ls-1">Status Kehadiran</span>
            <h2 class="display-6 fw-bold my-1">{{ displayStatus }}</h2>
            <p class="mb-0 small opacity-75">
              <i class="fa-solid fa-calendar-day me-1"></i> {{ hariIni }}, {{ new Date().toLocaleDateString('id-ID') }}
            </p>
          </div>
          <div class="icon-glow">
            <i v-if="displayStatus === 'Sudah Hadir'" class="fa-solid fa-check-double fa-4x"></i>
            <i v-else-if="displayStatus === 'Alfa'" class="fa-solid fa-circle-xmark fa-4x"></i>
            <i v-else class="fa-solid fa-hourglass-start fa-4x opacity-50"></i>
          </div>
        </div>
      </section>

      <div class="row g-3 mb-4">
        <div class="col-6">
          <button @click="startScan" class="btn w-100 action-card py-4" :disabled="!canAbsen" :class="{'disabled-btn': !canAbsen}">
            <div class="icon-box scan mb-2">
              <i class="fa-solid fa-camera-retro"></i>
            </div>
            <span class="fw-bold">Scan QR</span>
          </button>
        </div>
        <div class="col-6">
          <button @click="scheduleVisible = true" class="btn w-100 action-card py-4">
            <div class="icon-box schedule mb-2">
              <i class="fa-solid fa-clipboard-list"></i>
            </div>
            <span class="fw-bold">Jadwal</span>
          </button>
        </div>
      </div>

      <section class="history-section">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="h6 fw-bold mb-0 title-text"><i class="fa-solid fa-history me-2 text-primary"></i>Riwayat Saya</h3>
          <span class="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3">{{ myAttendanceHistory.length }} Record</span>
        </div>
        
        <div class="list-container">
          <div v-for="(log, idx) in myAttendanceHistory" :key="idx" class="history-item d-flex align-items-center justify-content-between p-3 mb-2 rounded-4 border bg-card">
            <div class="d-flex align-items-center gap-3">
              <div class="check-box-ui">
                <i class="fa-solid fa-check text-white"></i>
              </div>
              <div>
                <span class="d-block fw-bold small title-text">{{ formatDateTime(log.timestamp).hari }}</span>
                <small class="text-secondary">Telah diabsen</small>
              </div>
            </div>
            <div class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
              {{ formatDateTime(log.timestamp).jam }}
            </div>
          </div>

          <div v-if="myAttendanceHistory.length === 0" class="text-center py-5 opacity-50 text-secondary">
            <i class="fa-solid fa-inbox fa-3x mb-3"></i>
            <p>Belum ada data</p>
          </div>
        </div>
      </section>
    </main>

    <Transition name="pop">
      <div v-if="scheduleVisible" class="modal-overlay" @click.self="scheduleVisible = false">
        <div class="bottom-sheet w-100 p-4 bg-card rounded-top-5 shadow-lg">
          <div class="sheet-drag-handle mx-auto mb-4"></div>
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0 title-text"><i class="fa-solid fa-calendar me-2 text-primary"></i>Jadwal Hari Ini</h5>
            <button @click="scheduleVisible = false" class="btn-close"></button>
          </div>
          <div class="schedule-list">
            <div v-for="(j, i) in jadwalHariIni" :key="i" class="d-flex gap-3 mb-3 p-3 rounded-4 bg-light-custom">
              <div class="fw-bold text-primary" style="min-width: 60px;">{{ j.jam }}</div>
              <div class="border-start ps-3">
                <div class="fw-bold title-text">{{ j.mapel }}</div>
                <div class="small text-secondary">{{ j.guru }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="qrVisible" class="scanner-full">
        <div class="scanner-header p-4 d-flex justify-content-between text-white">
          <button @click="stopScan" class="btn btn-link text-white text-decoration-none">
            <i class="fa-solid fa-chevron-left me-2"></i> Kembali
          </button>
          <span class="fw-bold">Scan QR Code Guru</span>
          <div style="width: 50px"></div>
        </div>
        <div class="scanner-view">
          <div id="qr-reader"></div>
          <div class="scanner-overlay-ui"></div>
        </div>
        <div class="scanner-footer text-center p-4 text-white">
          <small class="opacity-75">Arahkan kamera tepat ke kode QR</small>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* CSS VARIABLES */
.mobile-app {
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --text-bold: #0f172a;
  --text-muted: #64748b;
  --primary: #4f46e5;
  --light-gray: #f1f5f9;
  
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-main);
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  color: var(--text-bold);
  transition: all 0.3s ease;
}

.dark-mode {
  --bg-main: #020617;
  --bg-card: #1e293b;
  --text-bold: #f8fafc;
  --text-muted: #94a3b8;
  --light-gray: #334155;
}

.bg-card { background-color: var(--bg-card) !important; }
.title-text { color: var(--text-bold) !important; }
.bg-light-custom { background-color: var(--light-gray); }

/* UI COMPONENTS */
.avatar-circle {
  width: 45px; height: 45px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 1.2rem;
}

.btn-theme {
  background: var(--light-gray);
  width: 40px; height: 40px;
}

.custom-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999; padding: 12px 25px; border-radius: 50px;
  color: white; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.custom-toast.success { background: #10b981; }
.custom-toast.error { background: #ef4444; }

/* STATUS CARD */
.status-card {
  border: none; border-radius: 30px;
  box-shadow: 0 15px 35px -5px rgba(0,0,0,0.1);
}
.status-card.is-hadir { background: linear-gradient(135deg, #10b981, #059669); }
.status-card.is-alfa { background: linear-gradient(135deg, #f43f5e, #e11d48); }
.status-card.is-none { background: linear-gradient(135deg, #64748b, #475569); }

.icon-glow { filter: drop-shadow(0 0 10px rgba(255,255,255,0.3)); }

/* ACTION CARD */
.action-card {
  background: var(--bg-card); border: none; border-radius: 25px;
  color: var(--text-bold); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}
.action-card:active { transform: scale(0.95); }
.disabled-btn { opacity: 0.5; filter: grayscale(1); }

.icon-box {
  width: 55px; height: 55px; border-radius: 18px; margin: 0 auto;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.scan { background: #e0e7ff; color: #4338ca; }
.schedule { background: #fef3c7; color: #d97706; }

/* HISTORY */
.check-box-ui {
  width: 35px; height: 35px; border-radius: 10px;
  background: #10b981; display: flex; align-items: center; justify-content: center;
}

/* MODAL & SCANNER */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px); z-index: 2000; display: flex; align-items: flex-end;
}
.sheet-drag-handle { width: 50px; height: 6px; background: #cbd5e1; border-radius: 10px; }

.scanner-full {
  position: fixed; inset: 0; background: #000; z-index: 3000;
}
#qr-reader { width: 100% !important; border: none !important; }

/* ANIMATIONS */
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-enter-from { transform: translate(-50%, -20px); opacity: 0; }
.pop-enter-active { transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from { transform: translateY(100%); }

.ls-1 { letter-spacing: 1px; }
</style>