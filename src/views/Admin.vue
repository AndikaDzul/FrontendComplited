<template>
  <div class="layout">

    <aside :class="['sidebar', sidebarOpen ? 'show' : '']">
      <div class="brand"><i class="bi bi-journal-text"></i> Absensi Admin</div>
      <ul class="menu">
        <li :class="{ active: activeMenu==='dashboard' }" @click="activeMenu='dashboard'">
          <i class="bi bi-house-door-fill"></i> Dashboard
        </li>
        <li :class="{ active: activeMenu==='siswa' }" @click="activeMenu='siswa'">
          <i class="bi bi-people-fill"></i> Data Siswa
        </li>
        <li :class="{ active: activeMenu==='guru' }" @click="activeMenu='guru'">
          <i class="bi bi-person-badge-fill"></i> Data Guru & Jadwal
        </li>
        <li :class="{ active: activeMenu==='absensi' }" @click="activeMenu='absensi'">
          <i class="bi bi-journal-check"></i> Absensi
        </li>
        <li :class="{ active: activeMenu==='laporan' }" @click="activeMenu='laporan'">
          <i class="bi bi-bar-chart-fill"></i> Laporan
        </li>
        <li class="logout" @click="logout">
          <i class="bi bi-box-arrow-right"></i> Logout
        </li>
      </ul>
    </aside>

    <div v-if="sidebarOpen" class="overlay" @click="sidebarOpen=false"></div>

    <div class="main">
      <header class="navbar">
        <button class="menu-btn" @click="sidebarOpen=!sidebarOpen">
          <i class="bi bi-list"></i>
        </button>
        <div class="navbar-right">
          <span>{{ admin.name }}</span>
          <div class="avatar"><i class="bi bi-person-circle"></i></div>
        </div>
      </header>

      <main class="content">

        <div v-if="activeMenu==='dashboard'" class="dashboard">
          <h1>Dashboard Jurusan</h1>
          <div class="stats">
            <div class="card blue" v-for="j in jurusanList" :key="j">
              <i class="bi bi-mortarboard-fill icon"></i>
              <div class="info">
                <p>{{ j }}</p>
                <h2>{{ siswa.filter(s => s.class===j && s.status==='Hadir').length }}</h2>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeMenu==='siswa'" class="box">
          <h3>Data Siswa</h3>
          <table class="table">
            <thead>
              <tr>
                <th>NIS</th>
                <th>Nama</th>
                <th>Jurusan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in siswa" :key="s.nis">
                <td>{{ s.nis }}</td>
                <td>{{ s.name }}</td>
                <td>{{ s.class }}</td>
                <td v-html="statusIcon(s.status)"></td>
                <td>
                  <button class="btn btn-danger btn-sm" @click="hapusSiswa(s.nis)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Tambah Siswa</h3>
          <div class="form">
            <input v-model="formSiswa.nis" placeholder="NIS">
            <input v-model="formSiswa.name" placeholder="Nama">
            <select v-model="formSiswa.class">
              <option value="">-- Pilih Jurusan --</option>
              <option v-for="j in jurusanList" :key="j" :value="j">{{ j }}</option>
            </select>
            <input v-model="formSiswa.email" placeholder="Email">
            <input type="password" v-model="formSiswa.password" placeholder="Password">
            <button class="btn btn-primary" @click="tambahSiswa">Simpan</button>
          </div>
        </div>

        <div v-if="activeMenu==='guru'" class="box">
          <h3>Data Guru</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Nama Guru</th>
                <th>Email</th>
                <th>Mapel</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in guru" :key="g.email">
                <td>{{ g.name }}</td>
                <td>{{ g.email }}</td>
                <td>{{ g.mapel }}</td>
                <td>
                  <button class="btn btn-danger btn-sm" @click="hapusGuru(g.email)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Tambah Guru</h3>
          <div class="form">
            <input v-model="formGuru.name" placeholder="Nama Guru">
            <input v-model="formGuru.email" placeholder="Email">
            <input v-model="formGuru.mapel" placeholder="Mapel">
            <input type="password" v-model="formGuru.password" placeholder="Password">
            <button class="btn btn-primary" @click="tambahGuru">Simpan</button>
          </div>

          <hr class="divider" />

          <h3>Tambah Jadwal Pelajaran</h3>
          <div class="form jadwal-form">
            <select v-model="formJadwal.hari">
              <option value="">-- Pilih Hari --</option>
              <option v-for="h in hariList" :key="h" :value="h">{{ h }}</option>
            </select>
            <input v-model="formJadwal.jam" placeholder="Waktu (07:00 - 09:00)">
            <select v-model="formJadwal.kelas">
              <option value="">-- Pilih Kelas --</option>
              <option v-for="j in jurusanList" :key="j" :value="j">{{ j }}</option>
            </select>
            <input v-model="formJadwal.mapel" placeholder="Mata Pelajaran">
            <input v-model="formJadwal.guru" placeholder="Nama Guru">
            <button class="btn btn-primary" @click="tambahJadwal">Tambah Jadwal</button>
          </div>

          <h4 class="mt-3">Daftar Jadwal Pelajaran</h4>
          <div v-for="hari in hariList" :key="hari" class="jadwal-hari-section">
            <h5 class="jadwal-hari">{{ hari }}</h5>
            <table class="table mt-1">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Kelas</th>
                  <th>Mapel</th>
                  <th>Guru</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="j in jadwalHari(hari)" :key="j._id">
                  <td>{{ j.jam }}</td>
                  <td>{{ j.kelas }}</td>
                  <td>{{ j.mapel }}</td>
                  <td>{{ j.guru || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeMenu==='absensi'" class="box">
          <h3>Absensi Siswa (Otomatis)</h3>
          <table class="table">
            <thead>
              <tr>
                <th>NIS</th>
                <th>Nama</th>
                <th>Jurusan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in siswa" :key="s.nis">
                <td>{{ s.nis }}</td>
                <td>{{ s.name }}</td>
                <td>{{ s.class }}</td>
                <td v-html="statusIcon(s.status)"></td>
              </tr>
            </tbody>
          </table>
          <button class="btn btn-danger" @click="resetAbsensi">Reset Semua Kehadiran</button>
        </div>

        <div v-if="activeMenu==='laporan'" class="box">
          <div class="report-header">
            <h3>Laporan Kehadiran</h3>
            <div class="export-tools">
              <select v-model="selectedExportDay" class="select-export">
                <option value="">-- Pilih Hari Export --</option>
                <option v-for="h in hariList" :key="h" :value="h">{{ h }}</option>
              </select>
              <button class="btn btn-success" @click="exportToExcel">
                <i class="bi bi-file-earmark-excel"></i> Export ke Excel
              </button>
            </div>
          </div>

          <div v-for="hari in hariList" :key="hari" class="laporan-hari-section">
            <h4 class="jadwal-hari">{{ hari }}</h4>
            <table class="table">
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nama</th>
                  <th>Jurusan</th>
                  <th>Status</th>
                  <th>Mapel</th>
                  <th>Guru</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in siswaHari(hari)" :key="s.nis">
                  <td>{{ s.nis }}</td>
                  <td>{{ s.name }}</td>
                  <td>{{ s.class }}</td>
                  <td v-html="statusIcon(s.status)"></td>
                  <td>{{ s.mapel }}</td>
                  <td>{{ s.guru }}</td>
                </tr>
              </tbody>
            </table>
            <div style="height:20px"></div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx' // Pastikan sudah install: npm install xlsx

const router = useRouter()
const API = 'https://backend-deployys-bere9s.vercel.app'

const sidebarOpen = ref(false)
const activeMenu = ref('dashboard')
const selectedExportDay = ref('')

const jurusanList = ['RPL','AKL','PS','TJKT','MPLB']
const hariList = ['Senin','Selasa','Rabu','Kamis','Jumat']

const siswa = ref([])
const guru = ref([])
const jadwal = ref([])
const attendance = ref([])

const formSiswa = ref({
  nis: '',
  name: '',
  class: '',
  email: '',
  password: ''
})

const formGuru = ref({
  name: '',
  email: '',
  mapel: '',
  password: ''
})

const formJadwal = ref({
  hari: '',
  jam: '',
  kelas: '',
  mapel: '',
  guru: ''
})

const admin = ref({ name: localStorage.getItem('adminName') || 'Admin' })
const token = localStorage.getItem('token')

const axiosAuth = axios.create({
  baseURL: API,
  headers: { Authorization: `Bearer ${token}` }
})

/* ================= LOAD DATA ================= */
const loadSiswa = async () => {
  siswa.value = (await axiosAuth.get('/students')).data
}

const loadGuru = async () => {
  guru.value = (await axiosAuth.get('/teachers')).data
}

const loadJadwal = async () => {
  jadwal.value = (await axiosAuth.get('/schedules')).data
}

const loadAttendance = async () => {
  attendance.value = (await axiosAuth.get('/attendance')).data
}

/* ================= CRUD SISWA ================= */
const tambahSiswa = async () => {
  if (!formSiswa.value.nis || !formSiswa.value.name) return alert('Data belum lengkap')

  await axiosAuth.post('/students', formSiswa.value)
  formSiswa.value = { nis:'', name:'', class:'', email:'', password:'' }
  loadSiswa()
}

const hapusSiswa = async (nis) => {
  if (!confirm('Hapus siswa ini?')) return
  await axiosAuth.delete(`/students/${nis}`)
  loadSiswa()
}

/* ================= CRUD GURU ================= */
const tambahGuru = async () => {
  if (!formGuru.value.name) return alert('Lengkapi data guru')

  await axiosAuth.post('/teachers', formGuru.value)
  formGuru.value = { name:'', email:'', mapel:'', password:'' }
  loadGuru()
}

const hapusGuru = async (email) => {
  if (!confirm('Hapus guru ini?')) return
  await axiosAuth.delete(`/teachers/${email}`)
  loadGuru()
}

/* ================= CRUD JADWAL ================= */
const tambahJadwal = async () => {
  if (!formJadwal.value.hari) return alert('Lengkapi jadwal')

  await axiosAuth.post('/schedules', formJadwal.value)
  formJadwal.value = { hari:'', jam:'', kelas:'', mapel:'', guru:'' }
  loadJadwal()
}

/* ================= EXPORT EXCEL ================= */
const exportToExcel = () => {
  if (!selectedExportDay.value) return alert('Silahkan pilih hari terlebih dahulu!')
  
  const dataToExport = siswaHari(selectedExportDay.value).map(item => ({
    'Hari': selectedExportDay.value,
    'NIS': item.nis,
    'Nama Siswa': item.name,
    'Jurusan': item.class,
    'Status Kehadiran': item.status || 'Belum Absen',
    'Mata Pelajaran': item.mapel,
    'Guru Pengampu': item.guru
  }))

  if (dataToExport.length === 0) return alert('Tidak ada data untuk hari tersebut')

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi")
  
  // Penamaan file: Laporan_Absensi_Senin.xlsx
  XLSX.writeFile(workbook, `Laporan_Absensi_${selectedExportDay.value}.xlsx`)
}

/* ================= HELPER ================= */
const statusIcon = (status)=>{
  switch(status?.toLowerCase()){
    case 'hadir': return '<span class="text-success">✔ Hadir</span>'
    case 'izin': return '<span class="text-warning">✎ Izin</span>'
    case 'sakit': return '<span class="text-info">😷 Sakit</span>'
    case 'alfa': return '<span class="text-danger">✖ Alfa</span>'
    default: return '-'
  }
}

const jadwalHari = (hari)=>{
  return jadwal.value.filter(j=>j.hari===hari)
}

const siswaHari = (hari)=>{
  const result = []
  jadwalHari(hari).forEach(j=>{
    siswa.value.filter(s=>s.class===j.kelas).forEach(s=>{
      const absen = attendance.value.find(a=>a.nis===s.nis && a.day===hari)
      result.push({
        ...s,
        status: absen?.status || '-',
        mapel: j.mapel,
        guru: j.guru
      })
    })
  })
  return result
}

/* ================= RESET ================= */
const resetAbsensi = async ()=>{
  await axiosAuth.post('/attendance/reset')
  loadAttendance()
}

/* ================= LOGOUT ================= */
const logout = ()=>{
  localStorage.clear()
  router.push('/login')
}

/* ================= INIT ================= */
onMounted(()=>{
  loadSiswa()
  loadGuru()
  loadJadwal()
  loadAttendance()
})
</script>

<style scoped>
@import "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css";
*{box-sizing:border-box;font-family:Segoe UI}
html,body,#app{height:100%;margin:0}
.layout{display:flex;min-height:100vh;background:#f4f6f9}
.sidebar{width:240px;background:#2f3542;color:white;position:fixed;top:0;bottom:0;transform:translateX(-100%);transition:.3s;z-index:20;overflow:auto}
.sidebar.show{transform:translateX(0)}
.brand{height:60px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.2rem;background:#23272b;border-bottom:1px solid #495057}
.menu{list-style:none;padding:0;margin:0}
.menu li{padding:14px 20px;cursor:pointer;border-bottom:1px solid #495057;border-left:4px solid transparent;transition:.2s;display:flex;align-items:center;gap:5px}
.menu li.active,.menu li:hover{background:#495057;border-left-color:#17a2b8}
.logout{color:#ff6b81;font-weight:bold}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:15}
.main{flex:1;margin-left:0;transition:.3s;min-height:100vh;display:flex;flex-direction:column}
.navbar{height:56px;background:white;display:flex;justify-content:space-between;align-items:center;padding:0 20px;box-shadow:0 1px 4px rgba(0,0,0,.1)}
.menu-btn{font-size:22px;background:none;border:none;cursor:pointer}
.navbar-right{display:flex;align-items:center;gap:10px}
.avatar{background:#3742fa;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold}
.content{padding:20px;flex:1;overflow:auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin-top:15px}
.card{background:white;padding:15px;border-radius:8px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 6px rgba(0,0,0,.1)}
.card:hover{box-shadow:0 4px 12px rgba(0,0,0,.15)}
.card .icon{font-size:28px}
.card.blue{border-left:4px solid #17a2b8}
.box{background:white;padding:20px;margin-top:20px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.1)}
.form{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.form input,.form select{padding:8px;border:1px solid #ced4da;border-radius:4px;flex:1;min-width:150px}
.form button{padding:8px 14px;border:none;border-radius:4px;cursor:pointer;transition:.2s}

/* LAPORAN CUSTOM STYLES */
.report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
.export-tools { display: flex; gap: 10px; align-items: center; }
.select-export { padding: 8px; border: 1px solid #17a2b8; border-radius: 4px; outline: none; }
.btn-success { background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.btn-success:hover { background: #218838; }

.jadwal-form input,.jadwal-form select{min-width:180px}
.jadwal-hari-section{margin-bottom:20px}
.jadwal-hari{background:#17a2b8;color:white;padding:6px 10px;border-radius:4px;margin-bottom:5px}
.btn{display:inline-block;text-align:center}
.btn-primary{background:#17a2b8;color:white}
.btn-primary:hover{background:#138496}
.btn-danger{background:#dc3545;color:white}
.btn-danger:hover{background:#c82333}

.table{width:100%;border-collapse:collapse;margin-top:15px;box-shadow:0 2px 6px rgba(0,0,0,.05)}
.table th, .table td{padding:10px;border-top:1px solid #dee2e6;text-align:left}
.table th{background:#e9ecef}
.divider{border-top:2px solid #17a2b8;margin:20px 0}
.text-success{color:#28a745; font-weight: bold;}
.text-warning{color:#ffc107; font-weight: bold;}
.text-info{color:#17a2b8; font-weight: bold;}
.text-danger{color:#dc3545; font-weight: bold;}

@media (max-width: 768px) {
  .report-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .export-tools { width: 100%; }
  .select-export { flex: 1; }
}
</style>