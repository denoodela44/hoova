import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  try {
    // Admin routes use separate admin token
    if (config.url?.startsWith('/admin')) {
      const adminToken = localStorage.getItem('hoova-admin-token')
      if (adminToken) { config.headers.Authorization = `Bearer ${adminToken}`; return config }
    }
    const stored = JSON.parse(localStorage.getItem('hoova-auth') || '{}')
    const token = stored?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch (_) {}
  return config
})

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hoova-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
