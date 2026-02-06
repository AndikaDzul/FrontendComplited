import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// ✅ Konfigurasi agar frontend bisa diakses dari HP di jaringan LAN
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',  // listen semua IP
    port: 5173,        // port default
    strictPort: true,  // error kalau port 5173 sudah dipakai
    open: false,       // jangan otomatis buka browser
    cors: true         // biar bisa request ke backend IP
  }
})
