<template>
  <div class="dashboard">
    <!-- HEADER -->
    <header class="header">
      <div class="left">
        <div class="avatar">{{ siswa.name.charAt(0) }}</div>
        <div class="info">
          <span class="name">{{ siswa.name }}</span>
          <span class="role">{{ siswa.role }}</span>
          <span class="mapel">{{ siswa.mapel }}</span>
        </div>
      </div>

      <div class="right">
        <button class="logout-btn" @click="logout">
          <span class="material-icons">logout</span>
        </button>
      </div>
    </header>

    <!-- RIWAYAT ABSEN -->
    <section class="history">
      <h3>Riwayat Absensi</h3>

      <div v-if="store.attendanceLog.length === 0" class="empty">
        Belum ada riwayat absensi
      </div>

      <ul v-else>
        <li v-for="log in store.attendanceLog" :key="log.id" class="history-item">
          <div class="mini-avatar">{{ log.name.charAt(0) }}</div>
          <div class="detail">
            <strong>{{ log.name }}</strong>
            <small>{{ log.class }}</small>
            <div class="time-date">
              <span class="time">{{ log.time }}</span>
              <span class="date">{{ log.date }}</span>
            </div>
          </div>
          <span class="status" :class="statusClass(log.status)">
            {{ log.status }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../stores/attendance'

const router = useRouter()

// Reactive guru
const guru = ref({
  name: 'SISWA',
  role: 'SISWA',
  mapel: 'RPL'  
})

onMounted(() => {
  guru.value.name = localStorage.getItem('teacherName') || 'GURU'
  guru.value.role = localStorage.getItem('teacherRole') || 'GURU'
  guru.value.mapel = localStorage.getItem('teacherMapel') || 'RPL'
})

// Logout
const logout = () => {
  localStorage.clear()
  router.push('/')
}

// Class warna status
const statusClass = (status) => {
  switch(status) {
    case 'Hadir': return 'status-hadir'
    case 'Sakit': return 'status-sakit'
    case 'Izin': return 'status-izin'
    default: return 'status-default'
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.dashboard {
  background: #f7f8fb;
  min-height: 100vh;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}

.left { display: flex; align-items: center; gap: 12px; }

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}

.info .name { font-weight: 700; color: #111827; }
.info .role { font-size: 0.75rem; color: #6b7280; }

.right { display: flex; gap: 12px; }
.logout-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn:hover { background: #e5e7eb; }

.history h3 { margin-bottom: 12px; }
.history ul { list-style: none; padding: 0; display: grid; gap: 12px; }
.history-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.mini-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.detail { flex: 1; margin-left: 12px; }
.detail small { font-size: 0.75rem; color: #6b7280; display: block; }
.time-date { margin-top: 4px; display: flex; gap: 8px; }
.time { font-size: 0.75rem; color: #2563eb; }
.date { font-size: 0.75rem; color: #6b7280; }

.status {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  text-align: center;
}
.status-hadir { background: #dcfce7; color: #166534; }
.status-sakit { background: #fee2e2; color: #b91c1c; }
.status-izin { background: #fef3c7; color: #b45309; }
.status-default { background: #e5e7eb; color: #374151; }

.empty {
  background: white;
  padding: 20px;
  border-radius: 14px;
  text-align: center;
  color: #9ca3af;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}
</style>
