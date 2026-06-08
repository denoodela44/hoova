import { useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, Tag } from 'lucide-react'
import { formatPrice, timeAgo } from '../../utils/format'
import api from '../../services/api'

const STATUS = {
  pending:   { label: 'Pending',   textColor: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  accepted:  { label: 'Accepted',  textColor: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  declined:  { label: 'Declined',  textColor: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  countered: { label: 'Countered', textColor: '#B81365', bg: '#fdf2f5', border: '#F8C0C8' },
}

export default function OfferThread({ offers, isSeller, onRefresh }) {
  if (!offers?.length) return null

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4" style={{ color: '#B81365' }} />
        <h3 className="font-semibold text-sm text-gray-800">
          Offers <span className="text-gray-400 font-normal">({offers.length})</span>
        </h3>
      </div>
      <div className="space-y-3">
        {offers.map((offer) => (
          <OfferRow
            key={offer.id}
            offer={offer}
            isSeller={isSeller}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  )
}

function OfferRow({ offer, isSeller, onRefresh }) {
  const [acting, setActing] = useState(false)
  const cfg = STATUS[offer.status] || STATUS.pending

  const act = async (action, counter_amount) => {
    setActing(true)
    try {
      await api.patch(`/offers/${offer.id}`, { action, counter_amount })
      onRefresh?.()
    } catch (_) {}
    setActing(false)
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
    >
      {/* Buyer + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={offer.buyer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.buyer?.name || 'B')}&size=28&background=F8C0C8&color=B81365&bold=true`}
            className="w-7 h-7 rounded-full object-cover"
            alt={offer.buyer?.name}
          />
          <span className="text-sm font-medium text-gray-800">
            {isSeller ? offer.buyer?.name || 'Buyer' : 'Your offer'}
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: 'white', color: cfg.textColor, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Offer amount → counter (if any) */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Offer</p>
          <p
            className="text-xl font-black"
            style={{ fontFamily: "'Poppins', sans-serif", color: '#B81365' }}
          >
            {formatPrice(offer.amount)}
          </p>
        </div>
        {offer.counter_amount && (
          <>
            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Counter</p>
              <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {formatPrice(offer.counter_amount)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Message */}
      {offer.message && (
        <p className="text-xs text-gray-500 italic">"{offer.message}"</p>
      )}

      <p className="text-[11px] text-gray-400">{timeAgo(offer.created_at)}</p>

      {/* Seller actions on pending offer */}
      {isSeller && offer.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => act('accept')}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: '#22c55e' }}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Accept
          </button>
          <button
            onClick={() => act('decline')}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: '#fef2f2', color: '#b91c1c' }}
          >
            <XCircle className="w-3.5 h-3.5" /> Decline
          </button>
          <CounterInput onSubmit={(amt) => act('counter', amt)} disabled={acting} />
        </div>
      )}

      {/* Buyer: accept or decline a counter */}
      {!isSeller && offer.status === 'countered' && offer.counter_amount && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => act('accept')}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#22c55e' }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Accept {formatPrice(offer.counter_amount)}
          </button>
          <button
            onClick={() => act('decline')}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#fef2f2', color: '#b91c1c' }}
          >
            <XCircle className="w-3.5 h-3.5" /> Decline
          </button>
        </div>
      )}
    </div>
  )
}

function CounterInput({ onSubmit, disabled }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold transition-all"
        style={{ background: '#fdf2f5', color: '#B81365' }}
      >
        Counter
      </button>
    )
  }

  return (
    <div className="w-full flex gap-2 mt-1">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Counter amount"
        className="input flex-1 text-sm focus:ring-0"
        style={{ height: 36 }}
        autoFocus
      />
      <button
        onClick={() => { if (value) { onSubmit(Number(value)); setOpen(false) } }}
        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
        style={{ background: '#B81365' }}
      >
        Send
      </button>
      <button
        onClick={() => setOpen(false)}
        className="px-2 py-1.5 rounded-xl text-xs text-gray-400"
      >
        ✕
      </button>
    </div>
  )
}
