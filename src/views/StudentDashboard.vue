<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import axios from 'axios'

const router = useRouter()
const backendUrl = 'https://backend-deployys-bere9s.vercel.app'

// ================= STATE SISWA =================
const student = ref({ name:'', nis:'', class:'', status:'' })
const studentsHadir = ref([]) // Hanya menyimpan yang sudah absen
const qrVisible = ref(false)
const scheduleVisible = ref(false)
let html5QrCode = null
let scanning = false
const guruTokenPrefix = 'ABSENSI-GURU-'
const jadwalHariIni = ref([])

// ================= TOAST =================
const toast = ref({ show:false, msg:'', type:'success' })
const showToast = (msg,type='success')=>{
  toast.value = { show:true, msg, type }
  setTimeout(()=>toast.value.show=false,3000)
}

// ================= COMPUTED =================
const hariIni = computed(()=> new Date().toLocaleDateString('id-ID', { weekday: 'long' }))

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
  if(student.value.status === 'Hadir'){
    showToast('Kamu sudah absen hari ini','success')
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

// ================= LOGIC UPDATE DATABASE =================
const submitAttendance = async(decodedText)=>{
  try{
    // Payload untuk update status & history sesuai skema MongoDB Anda
    const payload = { 
      status: 'Hadir',
      qrToken: decodedText,
      timestamp: new Date().toISOString()
    }
    
    // Kirim PATCH ke backend berdasarkan NIS
    await axios.patch(`${backendUrl}/students/attendance/${student.value.nis}`, payload)
    
    student.value.status = 'Hadir'
    showToast('Berhasil Absen! Data disinkronkan.')
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
    // FILTER: Hanya ambil yang statusnya 'Hadir'
    studentsHadir.value = res.data.filter(s => s.status === 'Hadir')
    
    // Update status diri sendiri
    const me = res.data.find(s => s.nis === student.value.nis)
    if(me) student.value.status = me.status
  } catch(err){ console.log('Syncing...') }
}

const logout = () => {
  localStorage.clear()
  router.replace('/login')
}

onMounted(()=>{
  const nis = localStorage.getItem('studentNis')
  if(!nis){ router.replace('/login'); return }
  
  student.value = { 
    name: localStorage.getItem('studentName'), 
    nis, 
    class: localStorage.getItem('studentClass'), 
    status:'' 
  }
  loadJadwalHariIni()
  loadAttendance()
  
  // Refresh setiap 5 detik agar list kehadiran tetap update
  const interval = setInterval(loadAttendance, 5000)
  onUnmounted(() => clearInterval(interval))
})

onUnmounted(()=> stopScan())
</script>

<template>
  <div class="mobile-app">
    <Transition name="slide-fade">
      <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </Transition>

    <header class="app-header">
      <div class="profile-area">
        <div class="avatar">{{ student.name?.[0] }}</div>
        <div class="meta">
          <h3>{{ student.name }}</h3>
          <p>{{ student.class }} • {{ student.nis }}</p>
        </div>
      </div>
      <button @click="logout" class="logout-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </button>
    </header>

    <main class="content">
      <section class="status-box" :class="student.status?.toLowerCase() || 'none'">
        <div class="status-info">
          <span>Status Hari Ini</span>
          <h2>{{ student.status || 'Belum Absen' }}</h2>
          <p>{{ hariIni }}, {{ new Date().toLocaleDateString('id-ID') }}</p>
        </div>
        <div class="status-icon">
          <svg v-if="student.status === 'Hadir'" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <svg v-else viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
      </section>

      <div class="action-grid">
        <button class="action-btn scan" @click="startScan">
          <div class="btn-icon">📸</div>
          <span>Scan QR</span>
        </button>
        <button class="action-btn schedule" @click="scheduleVisible = true">
          <div class="btn-icon">📅</div>
          <span>Jadwal</span>
        </button>
      </div>

      <section class="attendance-list">
        <div class="list-title">
          <h3>Siswa Sudah Absen</h3>
          <span class="badge">{{ studentsHadir.length }} Hadir</span>
        </div>
        <div class="scroll-area">
          <div v-for="s in studentsHadir" :key="s.nis" class="student-card">
            <div class="s-left">
              <div class="s-avatar hadir-bg">{{ s.name[0] }}</div>
              <div class="s-info">
                <strong>{{ s.name }}</strong>
                <small>{{ s.nis }} • {{ s.class }}</small>
              </div>
            </div>
            <div class="s-right">
              <span class="status-tag Hadir">Hadir</span>
            </div>
          </div>
          <div v-if="studentsHadir.length === 0" class="empty-list">
            <p>Belum ada siswa yang absen hari ini.</p>
          </div>
        </div>
      </section>
    </main>

    <Transition name="pop">
      <div v-if="scheduleVisible" class="modal-overlay" @click.self="scheduleVisible = false">
        <div class="modal-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-header">
            <h3>Jadwal {{ hariIni }}</h3>
            <button @click="scheduleVisible = false">✕</button>
          </div>
          <div class="sheet-content">
            <div v-for="(j, i) in jadwalHariIni" :key="i" class="schedule-item">
              <div class="time">{{ j.jam }}</div>
              <div class="desc">
                <strong>{{ j.mapel }}</strong>
                <span>{{ j.guru }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="qrVisible" class="scanner-modal">
        <div class="scanner-header">
          <button @click="stopScan">Kembali</button>
          <h3>Scanner Absensi</h3>
        </div>
        <div id="qr-reader"></div>
        <div class="scanner-footer">Arahkan kamera ke QR Guru</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

.mobile-app {
  font-family: 'Inter', sans-serif;
  background-color: #f0f4f8;
  min-height: 100vh;
  max-width: 500px;
  margin: 0 auto;
  color: #1a365d;
  position: relative;
}

/* Header */
.app-header {
  padding: 25px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
}
.profile-area { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 45px; height: 45px;
  background: #2b6cb0;
  color: white;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 1.2rem;
}
.meta h3 { margin: 0; font-size: 1rem; color: #2d3748; }
.meta p { margin: 0; font-size: 0.75rem; color: #718096; }
.logout-icon { background: none; border: none; color: #e53e3e; cursor: pointer; }

/* Status Box */
.content { padding: 0 20px 20px 20px; }
.status-box {
  margin-top: 10px;
  padding: 25px;
  border-radius: 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
  transition: all 0.4s ease;
}
.status-box.hadir { background: linear-gradient(135deg, #48bb78 0%, #2f855a 100%); }
.status-info h2 { margin: 5px 0; font-size: 1.8rem; }
.status-info span { font-size: 0.8rem; opacity: 0.9; }

/* Actions */
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
.action-btn {
  background: white; border: none; padding: 20px; border-radius: 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  font-weight: 600; color: #2c5282; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}
.btn-icon { font-size: 1.5rem; }

/* List Kehadiran */
.attendance-list {
  background: white; border-radius: 24px; padding: 20px;
  max-height: 400px; display: flex; flex-direction: column;
}
.list-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.badge { background: #e6fffa; color: #2c7a7b; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
.scroll-area { overflow-y: auto; flex: 1; }
.student-card { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #edf2f7; }
.s-left { display: flex; gap: 10px; align-items: center; }
.s-avatar.hadir-bg { background: #c6f6d5; color: #2f855a; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.s-info strong { display: block; font-size: 0.85rem; }
.s-info small { font-size: 0.7rem; color: #a0aec0; }
.status-tag.Hadir { background: #c6f6d5; color: #2f855a; font-size: 0.7rem; font-weight: bold; padding: 4px 10px; border-radius: 8px; }
.empty-list { text-align: center; padding: 20px; color: #a0aec0; font-size: 0.85rem; }

/* Scanner & Modals */
.scanner-modal { position: fixed; inset: 0; background: #000; z-index: 200; display: flex; flex-direction: column; }
.scanner-header { padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; }
.scanner-header button { background: none; border: 1px solid white; color: white; padding: 5px 15px; border-radius: 8px; }
#qr-reader { flex: 1; }
.scanner-footer { padding: 30px; color: white; text-align: center; font-size: 0.9rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: flex-end; }
.modal-sheet { background: white; width: 100%; border-radius: 30px 30px 0 0; padding: 25px; animation: slideUp 0.3s ease-out; }
.sheet-handle { width: 40px; height: 4px; background: #e2e8f0; margin: 0 auto 20px; border-radius: 10px; }
.sheet-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.schedule-item { display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #f7fafc; }
.time { font-weight: bold; color: #3182ce; font-size: 0.85rem; width: 50px; }

/* Transitions */
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-enter-from { transform: translateY(-20px); opacity: 0; }
.pop-enter-active { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from { transform: scale(0.9); opacity: 0; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 1000; padding: 12px 24px; border-radius: 12px; color: white; font-weight: bold;
}
.toast.success { background: #48bb78; }
.toast.error { background: #f56565; }
</style>