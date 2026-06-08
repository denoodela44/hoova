import { useState } from 'react'
import { X, Send, CheckCircle } from 'lucide-react'
import { formatPrice } from '../../utils/format'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'

export default function OfferModal({ listing, onClose, onSubmitted }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const askingPrice = listing.price
  const pct = amount ? Math.round((1 - Number(amount) / askingPrice) * 100) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn()) { onClose(); navigate('/login'); return }
    const num = Number(amount)
    if (!num || num <= 0) { setError('Enter a valid offer amount'); return }
    if (num > askingPrice) { setError('Offer cannot exceed the asking price'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.post(`/listings/${listing.id}/offers`, { amount: num, message: message.trim() })
      setDone(true)
      onSubmitted?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send offer. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Make an Offer
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          /* Success */
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="font-bold text-gray-900 mb-1">Offer sent!</p>
            <p className="text-sm text-gray-500 mb-5">
              The seller will be notified and can accept, decline, or counter your offer.
            </p>
            <button onClick={onClose} className="btn-secondary text-sm">Close</button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

            {/* Asking price reference */}
            <div
              className="flex items-center justify-between text-sm px-4 py-3 rounded-xl"
              style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}
            >
              <span className="text-gray-500">Asking price</span>
              <span className="font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {formatPrice(askingPrice)}
              </span>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Your offer (GHS)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">
                  GHS
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={askingPrice}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError('') }}
                  placeholder="Enter your offer"
                  className="input pl-12 focus:ring-0"
                  autoFocus
                />
              </div>
              {pct !== null && pct > 0 && (
                <p className="text-xs mt-1" style={{ color: '#B81365' }}>
                  {pct}% below asking price
                </p>
              )}
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Message to seller <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. I'm a serious buyer, can meet today…"
                className="input h-auto py-2.5 resize-none text-sm focus:ring-0"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !amount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: '#B81365' }}
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Sending…' : 'Send Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
