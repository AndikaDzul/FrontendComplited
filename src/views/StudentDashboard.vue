<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { Html5Qrcode } from 'html5-qrcode'
import axios from 'axios'

const router = useRouter()
const backendUrl = 'https://backend-test-n4bo.vercel.app'

const user = ref({ name:'', role:'', mapel:'' })
const students = ref([])
const schedule = ref([])
const searchQuery = ref('')
const loadingStudents = ref(false)
const loadingSchedule = ref(false)

const qrScannerVisible = ref(false)
let html5QrCode = null

/* ===== TOAST + DOUBLE SCAN ===== */
const toastVisible = ref(false)
const toastMessage = ref('')
const scannedNis = ref(new Set())

/* ===== QR MODAL (ZOOM) ===== */
const qrModalVisible = ref(false)
const selectedQr = ref('')

const openQrModal = (qr) => {
  selectedQr.value = qr
  qrModalVisible.value = true
}

const closeQrModal = () => {
  qrModalVisible.value = false
  selectedQr.value = ''
}
/* ============================== */

const avatarInitial = computed(() =>
  user.value.name ? user.value.name.charAt(0).toUpperCase() : 'G'
)

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  return students.value.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const hadirCount = computed(() =>
  students.value.filter(s => s.status === 'Hadir').length
)

// ================= LOAD DATA =================
const loadStudents = async () => {
  if (user.value.role !== 'guru') return
  loadingStudents.value = true
  try {
    const res = await axios.get(`${backendUrl}/students`)
    students.value = res.data.map(s => ({
      ...s,
      status: s.status || '',
      qrCode: ''
    }))
    for (let s of students.value) {
      s.qrCode = await QRCode.toDataURL(s.nis)
    }
  } finally {
    loadingStudents.value = false
  }
}

const loadSchedule = async () => {
  loadingSchedule.value = true
  try {
    const res = await axios.get(`${backendUrl}/schedule`)
    schedule.value = res.data
  } finally {
    loadingSchedule.value = false
  }
}

// ================= UPDATE STATUS =================
const updateStatus = async (nis, status) => {
  const student = students.value.find(s => s.nis === nis)
  if (!student) return
  student.status = status
  try {
    await axios.patch(`${backendUrl}/students/attendance/${nis}`, { status })
  } catch {}
}

// ================= TOAST =================
const showToast = (msg) => {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => toastVisible.value = false, 2500)
}

// ================= QR SCAN =================
const startQrScan = async () => {
  qrScannerVisible.value = true
  html5QrCode = new Html5Qrcode('qr-reader')
  const cams = await Html5Qrcode.getCameras()
  if (!cams.length) return

  await html5QrCode.start(
    cams[0].id,
    { fps: 10, qrbox: 250 },
    decoded => {
      const student = students.value.find(s => s.nis === decoded)
      if (!student) return
      if (scannedNis.value.has(decoded)) return

      scannedNis.value.add(decoded)
      updateStatus(decoded, 'Hadir')

      if (navigator.vibrate) navigator.vibrate(200)
      showToast(`✅ Hadir: ${student.name}`)
    }
  )
}

const stopQrScan = async () => {
  if (!html5QrCode) return
  await html5QrCode.stop()
  await html5QrCode.clear()
  qrScannerVisible.value = false
}

// ================= LOGOUT =================
const logout = () => {
  localStorage.clear()
  router.push('/login')
}

// ================= MOUNT =================
onMounted(async () => {
  const role = localStorage.getItem('role') || 'siswa'
  user.value.role = role

  if (role === 'guru') {
    user.value.name = localStorage.getItem('teacherName') || 'Guru'
    user.value.mapel = localStorage.getItem('teacherMapel') || 'RPL'
  }

  await loadStudents()
  await loadSchedule()
})

onUnmounted(stopQrScan)
</script>

<template>
<div class="app">

  <!-- TOAST -->
  <div v-if="toast.show" class="toast" :class="toast.type">
    {{ toast.message }}
  </div>

  <!-- HEADER -->
  <header class="header">
    <div class="user">
      <div class="avatar">{{ guru.name.charAt(0) }}</div>
      <div>
        <h4>{{ guru.name }}</h4>
        <small>
          {{ guru.role }}
          <span v-if="guru.mapel">• {{ guru.mapel }}</span>
        </small>
      </div>
    </div>
    <button class="logout" @click="logout">Logout</button>
  </header>

  <!-- STATS -->
  <section class="stats">
    <div class="card primary">
      <h3>{{ totalHadir }}</h3>
      <p>Total Hadir</p>
    </div>
    <div class="card success">
      <h3>{{ attendanceHistory.length }}</h3>
      <p>Riwayat Absensi</p>
    </div>
  </section>

  <!-- SCAN -->
  <section class="scan">
    <button class="scan-btn" @click="startQrScan">
      📷 Scan QR Absensi
    </button>
    <div v-if="qrScannerVisible" id="qr-reader" class="qr-box"></div>
  </section>

  <!-- HISTORY -->
  <section class="history">
    <h3>Riwayat Absensi</h3>

    <p v-if="loadingHistory" class="loading">Memuat data...</p>

    <ul v-else>
      <li v-for="(item,i) in attendanceHistory" :key="i">
        <div>
          <strong>{{ item.studentName || 'Siswa' }}</strong>
          <div class="time">{{ formatTime(item.time) }}</div>
        </div>
        <span class="badge" :class="item.status.toLowerCase()">
          {{ item.status }}
        </span>
      </li>
    </ul>
  </section>

</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

* { font-family:'Inter',sans-serif; }

.app {
  min-height:100vh;
  padding:24px;
  background:linear-gradient(135deg,#eef2ff,#f8fafc);
}

/* TOAST */
.toast {
  position:fixed;
  top:24px;
  right:24px;
  padding:14px 22px;
  border-radius:14px;
  color:white;
  font-weight:600;
  z-index:999;
  animation:slide .3s ease;
}
.toast.success { background:#10b981; }
.toast.error { background:#ef4444; }

@keyframes slide {
  from { transform:translateY(-20px); opacity:0 }
  to { transform:translateY(0); opacity:1 }
}

/* HEADER */
.header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:white;
  padding:16px 24px;
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,.08);
}

.user { display:flex; gap:14px; align-items:center; }
.avatar {
  width:52px; height:52px;
  border-radius:50%;
  background:linear-gradient(135deg,#4f46e5,#6366f1);
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.3rem;
  font-weight:700;
}

.logout {
  background:#ef4444;
  color:white;
  border:none;
  padding:10px 18px;
  border-radius:12px;
}

/* STATS */
.stats {
  margin:24px 0;
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:20px;
}

.card {
  padding:24px;
  border-radius:18px;
  color:white;
  box-shadow:0 12px 30px rgba(0,0,0,.12);
}

.primary { background:#4f46e5; }
.success { background:#10b981; }

/* SCAN */
.scan {
  background:white;
  padding:24px;
  border-radius:18px;
  margin-bottom:24px;
}

.scan-btn {
  background:#4f46e5;
  color:white;
  padding:12px 20px;
  border:none;
  border-radius:12px;
}

.qr-box { margin-top:16px; max-width:340px; }

/* HISTORY */
.history {
  background:white;
  padding:24px;
  border-radius:18px;
}

.history li {
  display:flex;
  justify-content:space-between;
  padding:14px 0;
  border-bottom:1px solid #e5e7eb;
}

.time {
  font-size:.75rem;
  color:#6b7280;
}

.badge {
  padding:6px 14px;
  border-radius:999px;
  font-size:.75rem;
  font-weight:600;
}
.hadir { background:#d1fae5; color:#065f46; }
.izin { background:#fef3c7; color:#92400e; }
.sakit { background:#dbeafe; color:#1e40af; }
.alfa { background:#fee2e2; color:#991b1b; }

.loading { color:#6b7280; }
</style>
