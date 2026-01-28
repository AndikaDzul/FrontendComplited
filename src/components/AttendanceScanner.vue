<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'

const router = useRouter()
const scannerId = 'qr-reader'
let html5QrCode = null

const scanResult = ref('')
const errorMessage = ref('')

onMounted(async () => {
  html5QrCode = new Html5Qrcode(scannerId)

  try {
    const cameras = await Html5Qrcode.getCameras()
    if (!cameras.length) {
      errorMessage.value = 'Kamera tidak ditemukan'
      return
    }

    await html5QrCode.start(
      cameras[0].id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        scanResult.value = decodedText
        stopScanner()

        // setelah scan → kembali ke dashboard
        router.push('/dashboard')
      }
    )
  } catch (err) {
    errorMessage.value = 'Gagal mengakses kamera'
    console.error(err)
  }
})

const stopScanner = async () => {
  if (html5QrCode) {
    await html5QrCode.stop()
    await html5QrCode.clear()
  }
}

onUnmounted(() => {
  stopScanner()
})
</script>

<template>
  <div class="scan-page">
    <header class="scan-header">
      <button @click="router.back()">⬅</button>
      <h3>Scan QR Absensi</h3>
    </header>

    <div id="qr-reader" class="scanner-box"></div>

    <p v-if="scanResult" class="result">
      Hasil Scan: <strong>{{ scanResult }}</strong>
    </p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.scan-page {
  padding: 20px;
  min-height: 100vh;
  background: #f9fafb;
}

.scan-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.scanner-box {
  width: 100%;
  max-width: 350px;
  margin: auto;
  border-radius: 16px;
  overflow: hidden;
}

.result {
  margin-top: 15px;
  text-align: center;
  color: #059669;
  font-weight: 600;
}

.error {
  margin-top: 15px;
  text-align: center;
  color: #dc2626;
}
</style>
