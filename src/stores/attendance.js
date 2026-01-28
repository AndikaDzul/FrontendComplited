import { reactive } from 'vue'
import axios from 'axios'

export const store = reactive({
  students: [],
  attendanceLog: [],
  loading: false,

  async fetchStudents() {
    this.loading = true
    try {
      const res = await axios.get('http://localhost:3000/students')
      this.students = res.data
    } catch (err) {
      this.students = []
    } finally {
      this.loading = false
    }
  },

  async markAttendance(nis) {
    try {
      // Update di backend
      await axios.patch(`http://localhost:3000/students/nis/${nis}`, { status: 'Hadir' })

      // Update store
      const s = this.students.find(st => st.nis === nis)
      if (s) {
        s.status = 'Hadir'
        this.attendanceLog.push(s)
      }
    } catch (err) {
      console.error(err)
    }
  }
})
