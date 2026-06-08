import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, Users, Trophy, AlertCircle } from 'lucide-react'
import { formatPrice, timeAgo } from '../../utils/format'
import useAuthStore from '../../store/authStore'
import AuctionTimer from './AuctionTimer'
import api from '../../services/api'

export default function AuctionPanel({ listing, onBidPlaced }) {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const [bidAmount, setBidAmount] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const currentBid  = listing.current_bid || listing.starting_bid || listing.price
  const increment   = Math.max(50, Math.round(currentBid * 0.02))
  const minNextBid  = listing.bid_count > 0 ? currentBid + increment : currentBid
  const isEnded     = new Date(listing.auction_end_at) <= new Date()
  const isOwner     = listing.seller?.id === user?.id
  const isTopBidder = listing.bids?.[0]?.bidder_id === user?.id

  const handleBid = async (e) => {
    e.preventDefault()
    if (!isLoggedIn()) { navigate('/login'); return }
    const amount = Number(bidAmount)
    if (!amount || amount < minNextBid) {
      setError(`Minimum bid is ${formatPrice(minNextBid)}`)
      return
    }
    setPlacing(true)
    setError('')
    try {
      await api.post(`/listings/${listing.id}/bids`, { amount })
      setSuccess(true)
      setBidAmount('')
      onBidPlaced?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="card p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white"
          style={{ background: '#B81365' }}
        >
          <Gavel className="w-3.5 h-3.5" />
          Live Auction
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {listing.bid_count || 0} {listing.bid_count === 1 ? 'bid' : 'bids'}
        </span>
      </div>

      {/* Timer */}
      {!isEnded && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Time remaining</p>
          <AuctionTimer endAt={listing.auction_end_at} />
        </div>
      )}

      {/* Current bid display */}
      <div
        className="rounded-xl p-4"
        style={{ background: '#fdf2f5', border: '1px solid #F8C0C8' }}
      >
        <p className="text-xs text-gray-500 mb-0.5">
          {listing.bid_count > 0 ? 'Current highest bid' : 'Starting bid'}
        </p>
        <p
          className="text-3xl font-black"
          style={{ fontFamily: "'Poppins', sans-serif", color: '#B81365' }}
        >
          {formatPrice(currentBid)}
        </p>
        {listing.bid_count > 0 && !isEnded && (
          <p className="text-xs text-gray-400 mt-1">
            Min next bid: <span className="font-semibold">{formatPrice(minNextBid)}</span>
          </p>
        )}
      </div>

      {/* Ended state */}
      {isEnded ? (
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <Trophy className="w-6 h-6 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-bold text-gray-700">Auction closed</p>
          {listing.bid_count > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Final price: <span className="font-semibold">{formatPrice(currentBid)}</span>
            </p>
          )}
        </div>
      ) : isOwner ? (
        <p className="text-xs text-gray-400 text-center">This is your listing</p>
      ) : (
        /* Bid form */
        <form onSubmit={handleBid} className="space-y-3">
          {success && (
            <div
              className="text-xs font-medium rounded-xl p-3 flex items-center gap-2"
              style={{ background: '#f0fdf4', color: '#15803d' }}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              You are the highest bidder!
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">
                GHS
              </span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => { setBidAmount(e.target.value); setError(''); setSuccess(false) }}
                placeholder={minNextBid}
                min={minNextBid}
                step={50}
                className="input pl-12 focus:ring-0"
              />
            </div>
            <button
              type="submit"
              disabled={placing}
              className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#B81365' }}
            >
              <Gavel className="w-4 h-4" />
              {placing ? 'Placing…' : 'Bid'}
            </button>
          </div>

          {!isLoggedIn() && (
            <p className="text-xs text-gray-400 text-center">
              You must{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold underline"
                style={{ color: '#B81365' }}
              >
                sign in
              </button>{' '}
              to place a bid
            </p>
          )}
        </form>
      )}

      {/* Bid history */}
      {listing.bids?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Bid history
          </p>
          <div className="space-y-2.5">
            {listing.bids.slice(0, 5).map((bid, i) => (
              <div key={bid.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: i === 0 ? '#B81365' : '#f3f4f6',
                      color: i === 0 ? '#fff' : '#9ca3af',
                    }}
                  >
                    {i === 0 ? '★' : i + 1}
                  </div>
                  <span className="text-sm text-gray-600">{bid.bidder_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatPrice(bid.amount)}</p>
                  <p className="text-[11px] text-gray-400">{timeAgo(bid.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
