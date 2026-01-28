<script setup>
import { store } from '../stores/attendance'
import { Html5Qrcode } from 'html5-qrcode'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const qr = ref(null)
const readerId = 'reader'

const startScanner = async () => {
  qr.value = new Html5Qrcode(readerId)

  try {
    const devices = await Html5Qrcode.getCameras()
    if (!devices || devices.length === 0) {
      alert('Tidak ada kamera yang terdeteksi!')
      return
    }

    // Pakai kamera belakang
    const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id

    await qr.value.start(
      cameraId,
      {
        fps: 10,
        qrbox: 250
      },
      async (decodedText) => {
        console.log('QR Terbaca:', decodedText)

        // Panggil store untuk menambahkan absensi
        await store.addAttendanceByQR(decodedText)

        // NOTE: Jangan stop scanner agar bisa scan siswa berikutnya
        // Jika ingin berhenti otomatis untuk satu siswa, uncomment qr.value.stop()
      },
      (errorMessage) => {
        // error saat scan, bisa diabaikan
        console.log('Scan error:', errorMessage)
      }
    )
  } catch (err) {
    console.error('Gagal memulai QR scanner:', err)
  }
}

const stopScanner = async () => {
  if (qr.value) {
    await qr.value.stop()
    qr.value.clear()
  }
}

onMounted(() => startScanner())
onBeforeUnmount(() => stopScanner())
</script>

<template>
  <div id="reader" style="width: 100%; height: 400px;"></div>
</template>

<style scoped>
#reader {
  border-radius: 16px;
  overflow: hidden;
  margin: 0 auto;
}
</style>
