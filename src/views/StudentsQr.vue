<script setup>
import { onMounted } from 'vue'
import { store } from '../stores/attendance'
import QrcodeVue from 'qrcode.vue'

onMounted(() => {
  store.fetchStudents()
})
</script>

<template>
  <div class="students-page">
    <h2 class="title">🎓 Data Siswa & QR Code</h2>

    <!-- Loading -->
    <div v-if="store.loading" class="state loading">
      ⏳ Memuat data siswa...
    </div>

    <!-- Empty -->
    <div v-else-if="store.students.length === 0" class="state empty">
      📭 Belum ada data siswa
    </div>

    <!-- List -->
    <div class="grid">
      <div
        v-for="s in store.students"
        :key="s.id"
        class="student-card"
      >
        <div class="left">
          <div class="avatar">
            {{ s.name.charAt(0).toUpperCase() }}
          </div>

          <div class="info">
            <strong class="name">{{ s.name }}</strong>
            <span class="nis">NIS: {{ s.nis }}</span>
            <small class="class">{{ s.class }}</small>
          </div>
        </div>

        <div class="qr">
          <qrcode-vue :value="s.nis" :size="90" />
          <span class="qr-label">Scan NIS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.students-page {
  padding: 24px;
  min-height: 100vh;
  background: #f9fafb;
}

.title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #111827;
}

/* STATES */
.state {
  padding: 30px;
  text-align: center;
  border-radius: 14px;
  background: white;
  color: #6b7280;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}

.state.loading {
  color: #4f46e5;
}

.state.empty {
  color: #9ca3af;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

/* CARD */
.student-card {
  background: white;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.student-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(0,0,0,0.1);
}

/* LEFT */
.left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 1rem;
  color: #111827;
}

.nis {
  font-size: 0.85rem;
  color: #6b7280;
}

.class {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* QR */
.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.qr-label {
  font-size: 0.7rem;
  color: #6b7280;
}
</style>
