import { reactive } from 'vue'
import { getStudents } from '../api/students'

export const store = reactive({
  students: [],
  attendanceLog: [],

  async fetchStudents() {
    try {
      const data = await getStudents()
      console.log('DATA SISWA:', data) // ⬅️ DEBUG
      this.students = data
    } catch (err) {
      console.error('Gagal ambil siswa', err)
    }
  }
})
