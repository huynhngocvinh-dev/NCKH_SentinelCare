import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fg_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize error messages so components can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      'Đã có lỗi xảy ra, vui lòng thử lại.'
    return Promise.reject({ ...err, message })
  }
)

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload),
  resendOtp: (payload) => api.post('/auth/resend-otp', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
}

export default api
