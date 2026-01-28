import axios from 'axios'

export async function getStudents() {
  const res = await axios.get('http://localhost:3000/students')
  return res.data
}
