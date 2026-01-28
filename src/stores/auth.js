// src/stores/auth.js
import { reactive } from 'vue'

export const auth = reactive({
  isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
  name: localStorage.getItem('teacherName') || '',
  role: localStorage.getItem('teacherRole') || '',
  token: localStorage.getItem('token') || ''
})
