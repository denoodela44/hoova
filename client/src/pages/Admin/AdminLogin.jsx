import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import api from '../../services/api'
import Logo from '../../components/layout/Logo'
import NotFound from '../NotFound'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accessKey = searchParams.get('k')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // No key in URL → render 404, not a login form
  if (!accessKey) return <NotFound />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/admin/login', { email, password, accessKey })
      localStorage.setItem('hoova-admin-token', res.data.data.token)
      navigate('/admin')
    } catch (err) {
      const status = err.response?.status
      // 404 from backend means wrong access key — still show generic error
      setError(status === 404 ? 'Access denied' : (err.response?.data?.message || 'Invalid credentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f5f4f1' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={28} />
          <div className="mt-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: '#1a1a2e' }}>
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Admin Access
          </h1>
          <p className="text-sm text-gray-500 mt-1">Restricted to authorised personnel only</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hoova.com"
                required
                className="w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all"
                style={{ border: '1.5px solid #e5e7eb', fontSize: 14 }}
                onFocus={(e) => e.target.style.borderColor = '#B81365'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 pr-11 rounded-xl border text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #e5e7eb', fontSize: 14 }}
                  onFocus={(e) => e.target.style.borderColor = '#B81365'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: '#1a1a2e' }}
            >
              {loading ? 'Signing in…' : <><ShieldCheck className="w-4 h-4" /> Sign in to Admin</>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/" className="hover:underline">← Back to Hoova</a>
        </p>
      </div>
    </div>
  )
}
