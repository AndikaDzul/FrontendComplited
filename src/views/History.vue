<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <span class="material-icons">arrow_back</span> Kembali
      </button>
      <h3>Riwayat Absensi</h3>
    </div>

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
        <span class="status" :class="log.status.toLowerCase()">{{ log.status }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { store } from '../stores/attendance'
import { useRouter } from 'vue-router'

const router = useRouter()
const goBack = () => router.back()
</script>

<style scoped>
.page { padding: 20px; font-family: 'Inter', sans-serif; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.back-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; background: #f3f4f6; border: none; cursor: pointer; }
.back-btn:hover { background: #e5e7eb; }
.back-btn .material-icons { font-size: 1.2rem; }

.history-item { display: flex; align-items: center; padding: 12px; gap: 12px; border-bottom: 1px solid #f3f4f6; }
.mini-avatar { width: 40px; height: 40px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.detail { flex: 1; }
.time-date { display: flex; gap: 12px; font-size: 0.75rem; color: #6b7280; }
.status.present { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 999px; }
.status.absent { background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 999px; }
.empty { padding: 20px; text-align: center; color: #9ca3af; border-radius: 14px; background: white; box-shadow: 0 6px 16px rgba(0,0,0,0.06); }
</style>
