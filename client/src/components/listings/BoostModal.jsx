import { useState } from 'react'
import { X, Zap, TrendingUp, Star, CheckCircle } from 'lucide-react'
import api from '../../services/api'

const TIERS = [
  {
    key:      'featured',
    label:    'Featured',
    price:    30,
    days:     7,
    color:    '#7e22ce',
    bg:       '#f5f3ff',
    icon:     Star,
    perks:    ['Featured badge on listing', 'Shows in "Spotlight Listings" on homepage', 'Priority above standard listings'],
  },
  {
    key:      'spotlight',
    label:    'Spotlight',
    price:    60,
    days:     7,
    color:    '#c2410c',
    bg:       '#fff7ed',
    icon:     Zap,
    perks:    ['Everything in Featured', 'Larger card in search results', 'Top of category pages', '"Promoted" badge'],
    popular:  true,
  },
  {
    key:      'top',
    label:    'Top Ad',
    price:    100,
    days:     7,
    color:    '#854d0e',
    bg:       '#fefce8',
    icon:     TrendingUp,
    perks:    ['Everything in Spotlight', 'Pinned above all other listings', 'Maximum search visibility', 'Homepage hero placement'],
  },
]

export default function BoostModal({ listing, onClose }) {
  const [selected, setSelected] = useState('spotlight')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleBoost = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.post(`/boosts/${listing.id}/purchase`, { tier: selected })
      const { payment_url } = res.data.data
      if (payment_url) {
        window.location.href = payment_url
      } else {
        setError('Could not initiate payment. Try again.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed — try again.')
    } finally {
      setLoading(false)
    }
  }

  const tier = TIERS.find((t) => t.key === selected)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: '#B81365' }} />
            <h2 className="font-bold text-sm text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Boost Listing
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Listing title */}
          <p className="text-xs text-gray-500 truncate">
            Boosting: <span className="font-semibold text-gray-800">{listing.title}</span>
          </p>

          {/* Tier selector */}
          <div className="space-y-2">
            {TIERS.map((t) => {
              const Icon = t.icon
              const active = selected === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setSelected(t.key)}
                  className="w-full text-left rounded-xl p-3.5 transition-all"
                  style={{
                    border: `2px solid ${active ? t.color : '#f0eeeb'}`,
                    background: active ? t.bg : 'white',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: active ? t.color : '#ECEAE6' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: active ? 'white' : '#9ca3af' }} />
                      </div>
                      <span className="font-bold text-sm" style={{ color: active ? t.color : '#374151' }}>
                        {t.label}
                      </span>
                      {t.popular && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: t.color, color: 'white' }}>
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm" style={{ color: active ? t.color : '#374151', fontFamily: "'Poppins', sans-serif" }}>
                        GHS {t.price}
                      </p>
                      <p className="text-[10px] text-gray-400">{t.days} days</p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-[11px]" style={{ color: active ? t.color : '#6b7280' }}>
                        <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="text-xs text-red-500 font-semibold px-3 py-2 rounded-xl bg-red-50">{error}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleBoost}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: tier?.color || '#B81365' }}
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Redirecting to payment…' : `Pay GHS ${tier?.price} — Boost Now`}
          </button>
          <p className="text-center text-[10px] text-gray-400">
            Secure payment via Paystack · Boost activates instantly after payment
          </p>
        </div>
      </div>
    </div>
  )
}
