import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import Logo from '../../components/layout/Logo'
import AuthIllustration from '../../components/auth/AuthIllustration'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [pwdFocused, setPwdFocused] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form')
  const [phone, setPhone] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const pwdField = register('password', {
    required: 'Password is required',
    minLength: { value: 8, message: 'At least 8 characters' },
  })

  const onSubmit = async (data) => {
    setError('')
    try {
      const payload = { ...data }
      const res = await api.post('/auth/register', payload)
      const { user, token, refreshToken, requiresPhoneVerify } = res.data.data
      if (requiresPhoneVerify) {
        setPhone(data.phone)
        setStep('verify-phone')
      } else {
        setAuth(user, token, refreshToken)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex bg-white overflow-hidden">

      {/* ── Left: Illustration ── */}
      <AuthIllustration pwdFocused={pwdFocused} />

      {/* ── Right: Form / Verify ── */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-8 sm:px-14 pt-10 pb-16 lg:pt-0 lg:pb-0 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={26} />
          </div>

          {step === 'verify-phone' ? (
            <VerifyPhone
              phone={phone}
              onSuccess={(user, token, rt) => { setAuth(user, token, rt); navigate('/') }}
            />
          ) : (
            <>
              <h1
                className="text-[26px] font-black text-gray-900 mb-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Join the plug
              </h1>
              <p className="text-sm text-gray-500 mb-7">Free to join. Your wallet won't even feel it.</p>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <FormField label="Email address" error={errors.email?.message}>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                    })}
                  />
                </FormField>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Phone number <span className="font-normal text-gray-400">(Ghana)</span>
                  </label>
                  <div className="flex">
                    <span
                      className="flex items-center justify-center shrink-0 px-3 text-sm text-gray-500 border border-r-0 rounded-l-xl"
                      style={{ border: '1.5px solid #e5e7eb', background: '#f9fafb', borderRight: 'none' }}
                    >
                      +233
                    </span>
                    <input
                      type="tel"
                      placeholder="24 123 4567"
                      className="auth-input rounded-l-none flex-1"
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                      {...register('phone', {
                        required: 'Phone is required',
                        pattern: { value: /^[0-9]{9,10}$/, message: 'Enter a valid Ghana number' },
                      })}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1.5">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      className="auth-input pr-11"
                      {...pwdField}
                      onFocus={() => setPwdFocused(true)}
                      onBlur={(e) => { setPwdFocused(false); pwdField.onBlur(e) }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
                </div>

                <p className="text-xs text-gray-400 pt-1">
                  By joining you agree to our{' '}
                  <Link to="/terms" className="font-semibold hover:underline" style={{ color: '#B81365' }}>Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="font-semibold hover:underline" style={{ color: '#B81365' }}>Privacy Policy</Link>.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#B81365' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#9e1057' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#B81365' }}
                >
                  {isSubmitting
                    ? <><Spinner /> Setting you up…</>
                    : <><UserPlus className="w-4 h-4" /> Let's get it</>
                  }
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <a
                href="/api/auth/google"
                className="w-full h-11 rounded-xl border border-gray-200 font-semibold text-sm text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </a>

              <p className="text-center text-sm text-gray-500 mt-7">
                Already plugged in?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: '#B81365' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 14px;
          background: white;
          outline: none;
          transition: border-color 0.15s;
          color: #111827;
        }
        .auth-input::placeholder { color: #9ca3af; }
        .auth-input:focus { border-color: #B81365; }
      `}</style>
    </div>
  )
}

/* ── Shared sub-components ── */

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

function VerifyPhone({ phone, onSuccess }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-phone', { phone, otp })
      onSuccess(res.data.data.user, res.data.data.token, res.data.data.refreshToken)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6" style={{ background: '#fdf2f5' }}>
        📱
      </div>
      <h1 className="text-[26px] font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Verify your phone
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Enter the 6-digit code sent to <strong className="text-gray-800">+233{phone}</strong>
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          placeholder="000 000"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="auth-input text-center text-2xl tracking-[0.6em] font-bold"
        />
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#B81365' }}
        >
          {loading ? 'Verifying…' : 'Verify phone'}
        </button>
      </form>

      <button
        onClick={() => api.post('/auth/resend-otp', { phone })}
        className="w-full text-center text-sm mt-4 hover:underline transition-colors"
        style={{ color: '#B81365' }}
      >
        Resend code
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
