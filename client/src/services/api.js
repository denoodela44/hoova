import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

const isAdminSession = () => !!localStorage.getItem('hoova-admin-token')
const onAdminPage = () => window.location.pathname.startsWith('/admin')

// Attach JWT on every request
api.interceptors.request.use((config) => {
  try {
    const adminToken = localStorage.getItem('hoova-admin-token')
    // Use admin token for /admin/* URLs or when browsing admin pages
    if (adminToken && (config.url?.startsWith('/admin') || onAdminPage())) {
      config.headers.Authorization = `Bearer ${adminToken}`
      return config
    }
    const stored = JSON.parse(localStorage.getItem('hoova-auth') || '{}')
    const token = stored?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch (_) {}
  return config
})

// On 401: only clear admin token for /admin/* endpoints; user routes redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (err.config?.url?.startsWith('/admin')) {
        localStorage.removeItem('hoova-admin-token')
      } else if (!isAdminSession()) {
        localStorage.removeItem('hoova-auth')
        window.location.href = '/login'
      }
      // 401 from non-admin endpoint during admin session → ignore, don't sign out
    }
    return Promise.reject(err)
  }
)

export default api
