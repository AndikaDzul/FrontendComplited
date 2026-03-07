<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

/**
 * Fungsi untuk mengirim data terbaru ke Service Worker
 * agar SW tahu apakah harus menggetarkan HP atau tidak saat aplikasi ditutup.
 */
const syncStatusToServiceWorker = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const status = localStorage.getItem('attendance_status') || 'Belum Absen';
    const isNotifActive = localStorage.getItem('notif_active') !== 'false';
    const studentName = localStorage.getItem('studentName') || 'Siswa';

    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_STATUS',
      status: status,
      enabled: isNotifActive,
      name: studentName
    });
  }
}

onMounted(() => {
  // 1. Registrasi Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('ZieSen Service Worker terdaftar!', reg.scope);
        
        // Cek sinkronisasi setiap kali SW siap
        navigator.serviceWorker.ready.then(() => {
          syncStatusToServiceWorker();
        });
      })
      .catch((err) => {
        console.error('Pendaftaran Service Worker gagal:', err);
      });
  }

  // 2. Meminta izin notifikasi secara otomatis
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        syncStatusToServiceWorker();
      }
    });
  }

  // 3. Sinkronisasi status secara berkala saat aplikasi terbuka
  const syncInterval = setInterval(syncStatusToServiceWorker, 10000);

  // Bersihkan interval jika komponen dilepas
  return () => clearInterval(syncInterval);
})
</script>

<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  padding: 0;
  background-color: transparent;
}

/* Style transisi fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>