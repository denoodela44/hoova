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

// On 401: admin sessions never redirect to user login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (isAdminSession() || onAdminPage()) {
        localStorage.removeItem('hoova-admin-token')
      } else {
        localStorage.removeItem('hoova-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
