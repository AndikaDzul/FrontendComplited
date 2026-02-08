<template>
  <div class="layout">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <aside :class="['sidebar', sidebarOpen ? 'show' : '']">
      <div class="sidebar-content">
        <div class="brand">
          <div class="logo-circle"><i class="bi bi-shield-check"></i></div>
          <span>ZieSen</span>
        </div>

        <div class="sidebar-user">
          <div class="avatar-lg"><i class="bi bi-person-badge"></i></div>
          <div class="user-info">
            <span class="user-name">{{ admin.name }}</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>

        <ul class="menu">
          <li :class="{ active: activeMenu==='dashboard' }" @click="activeMenu='dashboard'; sidebarOpen=false">
            <i class="bi bi-grid-1x2-fill"></i> Dashboard
          </li>
          <li :class="{ active: activeMenu==='gps' }" @click="openGpsMenu(); sidebarOpen=false">
            <i class="bi bi-geo-alt-fill"></i> Pengaturan GPS
          </li>
          <li :class="{ active: activeMenu==='siswa' }" @click="activeMenu='siswa'; sidebarOpen=false">
            <i class="bi bi-people-fill"></i> Data Siswa
          </li>
          <li :class="{ active: activeMenu==='guru' }" @click="activeMenu='guru'; sidebarOpen=false">
            <i class="bi bi-person-video3"></i> Guru & Jadwal
          </li>
          <li :class="{ active: activeMenu==='absensi' }" @click="activeMenu='absensi'; sidebarOpen=false">
            <i class="bi bi-calendar-check-fill"></i> Log Absensi
          </li>
          <li :class="{ active: activeMenu==='laporan' }" @click="activeMenu='laporan'; sidebarOpen=false">
            <i class="bi bi-file-earmark-bar-graph-fill"></i> Laporan
          </li>
        </ul>
        
         <button class="btn-logout" @click="logout">
            <i class="bi bi-box-arrow-right"></i> Keluar Sistem
          </button>

        <div class="sidebar-footer">
          <button class="btn-logout" @click="logout">
            <i class="bi bi-box-arrow-right"></i> Keluar Sistem
          </button>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="overlay" @click="sidebarOpen=false"></div>

    <div class="main">
      <header class="navbar">
        <div class="nav-left">
          <button class="menu-btn" @click="sidebarOpen=!sidebarOpen"><i class="bi bi-list"></i></button>
          <h2 class="page-title">{{ activeMenu.toUpperCase() }}</h2>
        </div>
        <div class="navbar-right">
          <div class="notification-badge"><i class="bi bi-bell"></i></div>
          <div class="user-profile">
            <span>{{ admin.name }}</span>
            <div class="avatar"><i class="bi bi-person-fill"></i></div>
          </div>
        </div>
      </header>

      <main class="content">
        <div v-if="activeMenu==='dashboard'" class="dashboard-wrapper fade-in">
          <div class="welcome-banner">
            <h1>Selamat Datang, {{ admin.name }}!</h1>
            <p>Pantau kehadiran siswa dan kelola data akademik dalam satu panel.</p>
          </div>

          <div class="stats">
            <div class="card stat-card" v-for="j in jurusanList" :key="j">
              <div class="stat-icon blue"><i class="bi bi-mortarboard"></i></div>
              <div class="info">
                <p>Jurusan {{ j }}</p>
                <h2>{{ siswa.filter(s => s.class===j && s.status==='Hadir').length }} <span>Hadir</span></h2>
              </div>
            </div>

            <div class="card stat-card gps-status" @click="openGpsMenu" style="cursor: pointer;">
              <div :class="['stat-icon', configGps.lat ? 'green' : 'red']">
                <i class="bi bi-pin-map"></i>
              </div>
              <div class="info">
                <p>Status Geofencing</p>
                <h2 :class="configGps.lat ? 'text-green' : 'text-red'">{{ configGps.lat ? 'Aktif' : 'Nonaktif' }}</h2>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeMenu==='gps'" class="box fade-in">
          <div class="section-header">
            <div class="header-icon"><i class="bi bi-geo-alt"></i></div>
            <div>
              <h3>Konfigurasi Lokasi</h3>
              <p>Atur titik koordinat pusat sekolah dan batas jarak absensi.</p>
            </div>
          </div>
          <div id="map" class="map-container"></div>
          <div class="gps-form-container">
            <div class="form-grid">
              <div class="input-group">
                <label>Latitude</label>
                <input v-model="configGps.lat" placeholder="-6.xxx" @input="updateMapMarker" />
              </div>
              <div class="input-group">
                <label>Longitude</label>
                <input v-model="configGps.lng" placeholder="106.xxx" @input="updateMapMarker" />
              </div>
              <div class="input-group">
                <label>Radius (Meter)</label>
                <input type="number" v-model="configGps.radius" @input="updateMapCircle" />
              </div>
            </div>
            <div class="actions-group mt-3">
              <button class="btn btn-outline" @click="getCurrentLocation">
                <i class="bi bi-crosshair"></i> Deteksi Lokasi Saya
              </button>
              <button class="btn btn-primary shadow-blue" @click="saveGpsConfig">
                <i class="bi bi-cloud-check"></i> Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeMenu==='siswa'" class="box fade-in">
          <div class="section-header">
            <h3>Database Siswa</h3>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>NIS</th><th>Nama Lengkap</th><th>Jurusan</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in siswa" :key="s.nis">
                  <td>{{ s.nis }}</td>
                  <td class="fw-bold">{{ s.name }}</td>
                  <td>{{ s.class }}</td>
                  <td v-html="statusIcon(s.status)"></td>
                  <td>
                    <button class="btn-icon delete" @click="hapusSiswa(s.nis)"><i class="bi bi-trash3"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-card mt-4">
            <h4>Tambah Siswa Baru</h4>
            <div class="form-grid">
              <input v-model="formSiswa.nis" placeholder="NIS">
              <input v-model="formSiswa.name" placeholder="Nama">
              <input type="password" v-model="formSiswa.password" placeholder="Password">
              <select v-model="formSiswa.class">
                <option value="">Pilih Jurusan</option>
                <option v-for="j in jurusanList" :key="j" :value="j">{{ j }}</option>
              </select>
              <button class="btn btn-primary" @click="tambahSiswa">Daftar</button>
            </div>
          </div>
        </div>

        <div v-if="activeMenu==='guru'" class="box fade-in">
          <h3>Manajemen Guru</h3>
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th>Nama Guru</th><th>Email</th><th>Mapel</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="g in guru" :key="g.email">
                  <td>{{ g.name }}</td><td>{{ g.email }}</td><td>{{ g.mapel }}</td>
                  <td><button class="btn-icon delete" @click="hapusGuru(g.email)"><i class="bi bi-trash3"></i></button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-card mt-4 mb-5">
            <h4>Input Data Guru</h4>
            <div class="form-grid">
              <input v-model="formGuru.name" placeholder="Nama">
              <input v-model="formGuru.email" placeholder="Email">
              <input v-model="formGuru.mapel" placeholder="Mapel">
              <input type="password" v-model="formGuru.password" placeholder="Pass">
              <button class="btn btn-primary" @click="tambahGuru">Simpan</button>
            </div>
          </div>

          <hr class="my-5">

          <div class="section-header mt-4">
            <h3>Jadwal Pelajaran</h3>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Hari</th><th>Jam</th><th>Mapel</th><th>Guru</th><th>Kelas</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="j in jadwal" :key="j._id">
                  <td>{{ j.hari }}</td>
                  <td>{{ j.jam }}</td>
                  <td class="fw-bold">{{ j.mapel }}</td>
                  <td>{{ j.guru }}</td>
                  <td>{{ j.kelas }}</td>
                  <td>
                    <button class="btn-icon delete" @click="hapusJadwal(j._id)"><i class="bi bi-trash3"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-card mt-4">
            <h4>Tambah Jadwal Baru</h4>
            <div class="form-grid">
              <select v-model="formJadwal.hari">
                <option value="">Pilih Hari</option>
                <option v-for="h in hariList" :key="h" :value="h">{{ h }}</option>
              </select>
              <input v-model="formJadwal.jam" placeholder="Jam (07:00 - 08:00)">
              <input v-model="formJadwal.mapel" placeholder="Nama Mapel">
              <input v-model="formJadwal.guru" placeholder="Nama Guru">
              <select v-model="formJadwal.kelas">
                <option value="">Pilih Kelas</option>
                <option v-for="cl in jurusanList" :key="cl" :value="cl">{{ cl }}</option>
              </select>
              <button class="btn btn-primary" @click="tambahJadwal">Simpan Jadwal</button>
            </div>
          </div>
        </div>

        <div v-if="activeMenu==='absensi'" class="box fade-in">
          <div class="section-header">
            <h3>Monitoring Absensi</h3>
            <button class="btn btn-danger btn-sm" @click="resetAbsensi">Reset</button>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th>NIS</th><th>Siswa</th><th>Kelas</th><th>Kehadiran</th></tr></thead>
              <tbody>
                <tr v-for="s in siswa" :key="s.nis">
                  <td>{{ s.nis }}</td><td>{{ s.name }}</td><td>{{ s.class }}</td>
                  <td v-html="statusIcon(s.status)"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeMenu==='laporan'" class="box fade-in">
          <div class="report-header-ui mb-4">
            <h3>Rekap Laporan Kehadiran</h3>
            <div class="export-controls" style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
              <select v-model="selectedExportDay" style="padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <option value="">Pilih Hari</option>
                <option v-for="h in hariList" :key="h" :value="h">{{ h }}</option>
              </select>
              <button class="btn btn-success" @click="exportToExcel">
                <i class="bi bi-file-earmark-excel"></i> Export Excel
              </button>
            </div>
          </div>

          <div class="table-responsive mt-4">
            <table class="table">
              <thead>
                <tr>
                  <th>NIS</th><th>Nama</th><th>Kelas</th><th>Hari</th><th>Mapel</th><th>Jam Absen</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in filteredSiswaLaporan" :key="s.nis">
                  <td>{{ s.nis }}</td>
                  <td class="fw-bold">{{ s.name }}</td>
                  <td>{{ s.class }}</td>
                  <td>{{ getLatestAttendance(s).day || '-' }}</td>
                  <td>{{ getLatestAttendance(s).mapel || '-' }}</td>
                  <td>{{ getLatestAttendance(s).jam || '-' }}</td>
                  <td v-html="statusIcon(s.status)"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import L from 'leaflet'

const router = useRouter()
const API = 'https://backend-absensii-andika.vercel.app'
const token = localStorage.getItem('token')
const axiosAuth = axios.create({ baseURL:API, headers:{Authorization:`Bearer ${token}`} })

// State Management
const sidebarOpen = ref(false)
const activeMenu = ref('dashboard')
const selectedExportDay = ref('')
const admin = ref({ name: localStorage.getItem('adminName') || 'Admin' })

const jurusanList = ['RPL','AKL','PS','TJKT','MPLB']
const hariList = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

const siswa = ref([])
const guru = ref([])
const jadwal = ref([])
const configGps = ref({ lat: '', lng: '', radius: 50 })

const formSiswa = ref({ nis:'', name:'', class:'', password:'' })
const formGuru = ref({ name:'', email:'', mapel:'', password:'' })
const formJadwal = ref({ mapel:'', guru:'', hari:'', jam:'', kelas:'' })

let map=null, marker=null, circle=null

// --- CORE LOGIC ---

// GPS & Map Logic
const loadGpsFromServer = async () => {
  try {
    const res = await axiosAuth.get('/config/gps')
    if (res.data) {
      configGps.value = {
        lat: res.data.lat,
        lng: res.data.lng,
        radius: res.data.radius || 50
      }
    }
  } catch (err) { console.error("GPS Load Error", err) }
}

const openGpsMenu = async () => { 
  activeMenu.value = 'gps'
  await loadGpsFromServer()
  nextTick(() => initMap()) 
}

const initMap = () => {
  if (map) { map.off(); map.remove(); map = null; }
  
  const lat = parseFloat(configGps.value.lat) || -6.2
  const lng = parseFloat(configGps.value.lng) || 106.8166
  
  map = L.map('map').setView([lat, lng], 17)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  
  marker = L.marker([lat, lng], { draggable: true }).addTo(map)
  circle = L.circle([lat, lng], {
    radius: configGps.value.radius,
    color: '#3742fa',
    fillColor: '#3742fa',
    fillOpacity: 0.2
  }).addTo(map)

  marker.on('dragend', () => {
    const p = marker.getLatLng()
    configGps.value.lat = p.lat.toFixed(6)
    configGps.value.lng = p.lng.toFixed(6)
    circle.setLatLng(p)
  })

  map.on('click', (e) => {
    configGps.value.lat = e.latlng.lat.toFixed(6)
    configGps.value.lng = e.latlng.lng.toFixed(6)
    marker.setLatLng(e.latlng)
    circle.setLatLng(e.latlng)
  })
}

const updateMapCircle = () => { if (circle) circle.setRadius(configGps.value.radius) }

const updateMapMarker = () => {
  if (marker && configGps.value.lat && configGps.value.lng) {
    const pos = [parseFloat(configGps.value.lat), parseFloat(configGps.value.lng)]
    marker.setLatLng(pos)
    circle.setLatLng(pos)
    map.setView(pos, 17)
  }
}

const getCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(p => {
    configGps.value.lat = p.coords.latitude.toFixed(6)
    configGps.value.lng = p.coords.longitude.toFixed(6)
    const newPos = [configGps.value.lat, configGps.value.lng]
    map.setView(newPos, 17)
    marker.setLatLng(newPos)
    circle.setLatLng(newPos)
  })
}

const saveGpsConfig = async () => {
  try {
    await axiosAuth.post('/config/gps', configGps.value)
    alert('Konfigurasi GPS Berhasil Disimpan!')
  } catch (err) { alert('Gagal menyimpan konfigurasi') }
}

// CRUD Operations
const loadSiswa = async () => { await axiosAuth.get('/students').then(r => siswa.value = r.data) }
const tambahSiswa = async () => { 
  await axiosAuth.post('/students', formSiswa.value)
  formSiswa.value = { nis: '', name: '', class: '', password: '' }
  loadSiswa()
}
const hapusSiswa = async (nis) => { if (confirm('Hapus siswa ini?')) { await axiosAuth.delete(`/students/${nis}`); loadSiswa() } }

const loadGuru = async () => { await axiosAuth.get('/teachers').then(r => guru.value = r.data) }
const tambahGuru = async () => { 
  await axiosAuth.post('/teachers', formGuru.value)
  formGuru.value = { name: '', email: '', mapel: '', password: '' }
  loadGuru()
}
const hapusGuru = async (email) => { if (confirm('Hapus guru ini?')) { await axiosAuth.delete(`/teachers/${email}`); loadGuru() } }

const loadJadwal = async () => { await axiosAuth.get('/schedules').then(r => jadwal.value = r.data) }
const tambahJadwal = async () => { 
  await axiosAuth.post('/schedules', formJadwal.value)
  formJadwal.value = { mapel: '', guru: '', hari: '', jam: '', kelas: '' }
  loadJadwal() 
}
const hapusJadwal = async (id) => { if (confirm('Hapus jadwal ini?')) { await axiosAuth.delete(`/schedules/${id}`); loadJadwal() } }

// Attendance Helpers
const getLatestAttendance = (s) => {
  if (!s.attendanceHistory || s.attendanceHistory.length === 0) return {}
  if (selectedExportDay.value) {
    return s.attendanceHistory.find(h => h.day === selectedExportDay.value) || {}
  }
  return s.attendanceHistory[s.attendanceHistory.length - 1] || {}
}

const filteredSiswaLaporan = computed(() => {
  if (!selectedExportDay.value) return siswa.value
  return siswa.value.filter(s => s.attendanceHistory?.some(h => h.day === selectedExportDay.value))
})

const statusIcon = status => {
  const map = { 'Hadir': 'green', 'Izin': 'yellow', 'Sakit': 'blue', 'Alfa': 'red' }
  return `<span class="status-pill ${map[status] || 'gray'}">${status || '-'}</span>`
}

const resetAbsensi = () => { if (confirm('Reset semua status hari ini?')) siswa.value.forEach(s => s.status = '-') }
const exportToExcel = () => {
  if (!selectedExportDay.value) return alert('Pilih hari!')
  const data = filteredSiswaLaporan.value.map(s => {
    const att = getLatestAttendance(s)
    return { 'NIS': s.nis, 'Nama': s.name, 'Kelas': s.class, 'Status': s.status, 'Jam': att.jam || '-' }
  })
  const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Absensi")
  XLSX.writeFile(wb, `Laporan_${selectedExportDay.value}.xlsx`)
}

const logout = () => { localStorage.clear(); router.push('/login') }

onMounted(() => { loadSiswa(); loadGuru(); loadJadwal(); loadGpsFromServer(); })
</script>

<style scoped>
@import "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css";

.layout { display: flex; height: 100vh; width: 100vw; overflow: hidden; background: #f8fafc; }
.sidebar { width: 280px; height: 100vh; background: #1e293b; color: #f1f2f6; z-index: 1001; transition: 0.3s; }
.sidebar-content { display: flex; flex-direction: column; height: 100%; }
.brand { padding: 25px; display: flex; align-items: center; gap: 12px; font-size: 1.4rem; font-weight: 800; background: #0f172a; }
.logo-circle { width: 35px; height: 35px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.sidebar-user { padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #334155; }
.avatar-lg { width: 50px; height: 50px; background: #334155; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.menu { list-style: none; padding: 15px 0; flex: 1; overflow-y: auto; }
.menu li { padding: 12px 25px; margin: 4px 15px; cursor: pointer; border-radius: 8px; color: #94a3b8; display: flex; align-items: center; gap: 12px; }
.menu li.active { background: #3b82f6; color: white; }
.main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.navbar { height: 70px; background: #fff; padding: 0 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.content { padding: 30px; overflow-y: auto; flex: 1; }
.welcome-banner { background: linear-gradient(135deg, #1d4ed8, #1e40af); padding: 30px; border-radius: 16px; color: white; margin-bottom: 30px; }
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.stat-card { background: white; padding: 20px; border-radius: 12px; display: flex; align-items: center; gap: 15px; border: 1px solid #e2e8f0; }
.stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.stat-icon.blue { background: #eff6ff; color: #3b82f6; }
.stat-icon.green { background: #f0fdf4; color: #22c55e; }
.stat-icon.red { background: #fef2f2; color: #ef4444; }
.box { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
.map-container { height: 350px; border-radius: 12px; margin-bottom: 20px; border: 4px solid #f1f5f9; z-index: 1; }
.table { width: 100%; border-collapse: collapse; }
.table th { padding: 15px; text-align: left; background: #f8fafc; color: #64748b; font-size: 0.8rem; }
.table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.status-pill.green { background: #dcfce7; color: #166534; }
.status-pill.red { background: #fee2e2; color: #991b1b; }
.status-pill.yellow { background: #fef9c3; color: #854d0e; }
.status-pill.blue { background: #dbeafe; color: #1e40af; }
.btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
.btn-primary { background: #3b82f6; color: white; }
.btn-danger { background: #ef4444; color: white; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
.form-grid input, .form-grid select { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }

@media (max-width: 992px) {
  .sidebar { position: fixed; transform: translateX(-100%); }
  .sidebar.show { transform: translateX(0); }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
}
.fade-in { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>