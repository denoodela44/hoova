import { useState, useEffect } from 'react'

function calcLeft(endAt) {
  const diff = new Date(endAt) - Date.now()
  if (diff <= 0) return null
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    total: diff,
  }
}

export default function AuctionTimer({ endAt, compact = false }) {
  const [left, setLeft] = useState(() => calcLeft(endAt))

  useEffect(() => {
    const t = setInterval(() => setLeft(calcLeft(endAt)), 1000)
    return () => clearInterval(t)
  }, [endAt])

  if (!left) {
    return (
      <span className="text-xs font-bold text-red-500">Auction ended</span>
    )
  }

  const urgent = left.total < 3600000

  if (compact) {
    const parts = []
    if (left.d > 0) parts.push(`${left.d}d`)
    parts.push(`${String(left.h).padStart(2, '0')}h`)
    parts.push(`${String(left.m).padStart(2, '0')}m`)
    if (left.d === 0) parts.push(`${String(left.s).padStart(2, '0')}s`)
    return (
      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: urgent ? '#ef4444' : '#B81365' }}
      >
        {parts.join(' ')}
      </span>
    )
  }

  const units = [
    ...(left.d > 0 ? [{ v: left.d, l: 'd' }] : []),
    { v: left.h, l: 'h' },
    { v: left.m, l: 'm' },
    { v: left.s, l: 's' },
  ]

  return (
    <div className="flex items-end gap-1.5">
      {units.map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <span
            className="text-lg font-black w-11 h-11 rounded-xl flex items-center justify-center tabular-nums"
            style={{
              background: urgent ? '#fef2f2' : '#fdf2f5',
              color: urgent ? '#ef4444' : '#B81365',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {String(v).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{l}</span>
        </div>
      ))}
    </div>
  )
}
