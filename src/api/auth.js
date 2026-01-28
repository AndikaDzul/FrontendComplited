import axios from 'axios'

const API = 'http://localhost:3000'

export const loginGuru = async (payload) => {
  const res = await axios.post(`${API}/auth/login`, payload)
  return res.data
}
