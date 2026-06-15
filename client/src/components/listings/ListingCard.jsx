import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Star, ShieldCheck, Zap, Eye, ChevronLeft, ChevronRight, Gavel } from 'lucide-react'
import { formatPrice, timeAgo } from '../../utils/format'
import AuctionTimer from './AuctionTimer'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import { trackImpression } from '../../services/impressionTracker'

function memberDuration(dateStr) {
  if (!dateStr) return null
  const months = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
  if (months < 1) return 'New'
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  return `${years}yr${years > 1 ? 's' : ''}`
}

export default function ListingCard({ listing, onSaveToggle }) {
  const { isLoggedIn } = useAuthStore()
  const [saved, setSaved] = useState(listing.is_saved ?? false)
  const [savePending, setSavePending] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const touchStartX = useRef(null)
  const didSwipe = useRef(false)

  const images = listing.images?.length > 0
    ? listing.images.map((img) => img.url)
    : [listing.primary_image || '/placeholder.jpg']

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn()) { window.location.href = '/login'; return }
    if (savePending) return
    setSavePending(true)
    try {
      if (saved) await api.delete(`/listings/${listing.id}/save`)
      else await api.post(`/listings/${listing.id}/save`)
      setSaved((s) => !s)
      onSaveToggle?.(listing.id, !saved)
    } catch (_) {}
    finally { setSavePending(false) }
  }

  const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((i) => (i - 1 + images.length) % images.length) }
  const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((i) => (i + 1) % images.length) }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; didSwipe.current = false }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      didSwipe.current = true
      if (diff > 0) setImgIndex((i) => (i + 1) % images.length)
      else setImgIndex((i) => (i - 1 + images.length) % images.length)
    }
    touchStartX.current = null
  }
  const handleLinkClick = (e) => { if (didSwipe.current) { e.preventDefault(); didSwipe.current = false } }

  const isBoosted  = !!listing.boost_tier
  const isAuction  = listing.listing_type === 'auction'
  const auctionEnded = isAuction && new Date(listing.auction_end_at) <= new Date()

  const cardRef = useRef(null)
  useEffect(() => {
    const el = cardRef.current
    if (!el || !listing.id) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { trackImpression(listing.id); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [listing.id])

  return (
    <Link
      ref={cardRef}
      to={`/listing/${listing.id}`}
      onClick={handleLinkClick}
      className="group block overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden select-none"
        style={{ aspectRatio: '4/5', background: '#f3f4f6' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[imgIndex]}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          draggable={false}
          onError={(e) => { e.target.src = '/placeholder.jpg' }}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isAuction && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: '#B81365' }}
            >
              <Gavel className="w-3 h-3" strokeWidth={2.5} />
              {auctionEnded ? 'Ended' : 'Auction'}
            </span>
          )}
          {isBoosted && !isAuction && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: '#F8C0C8', color: '#B81365' }}
            >
              <Zap className="w-3 h-3" strokeWidth={2.5} />
              Promoted
            </span>
          )}
          {!isAuction && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={
                listing.condition === 'new'
                  ? { background: '#16a34a', color: '#fff' }
                  : { background: 'rgba(34,34,34,0.55)', color: '#fff' }
              }
            >
              {listing.condition === 'new' ? 'New' : 'Used'}
            </span>
          )}
        </div>

        {/* Auction countdown overlay */}
        {isAuction && !auctionEnded && (
          <div
            className="absolute bottom-7 left-2.5 flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <AuctionTimer endAt={listing.auction_end_at} compact />
          </div>
        )}

        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
          style={{
            background: saved ? '#B81365' : 'rgba(255,255,255,0.9)',
            color: saved ? '#fff' : '#9CA3AF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
          aria-label={saved ? 'Unsave' : 'Save listing'}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} strokeWidth={2} />
        </button>

        {/* Views */}
        {listing.views_count > 0 && (
          <div
            className="absolute bottom-7 left-2.5 flex items-center gap-1 text-white text-[11px] rounded-full px-2 py-0.5"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          >
            <Eye className="w-3 h-3" />
            {listing.views_count}
          </div>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i) }}
                aria-label={`Image ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === imgIndex ? 14 : 6,
                  height: 6,
                  background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Price */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {isAuction && (
            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">
              {listing.bid_count > 0 ? 'Bid' : 'Start'}
            </span>
          )}
          <p
            className="font-bold leading-none"
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: isAuction ? '#B81365' : 'var(--color-text)' }}
          >
            {formatPrice(isAuction ? (listing.current_bid || listing.starting_bid || listing.price) : listing.price)}
          </p>
          {listing.price_dropped && !isAuction && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>↓</span>
          )}
          {listing.negotiable && !isAuction && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#fdf2f5', color: '#B81365' }}>OBO</span>
          )}
          {isAuction && listing.bid_count > 0 && (
            <span className="text-[10px] text-gray-400 ml-auto shrink-0">{listing.bid_count}b</span>
          )}
        </div>

        {/* Title */}
        <p
          className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2.5"
          style={{ color: 'var(--color-text)' }}
        >
          {listing.title}
        </p>

        {/* Footer row: seller + location + time */}
        <div className="flex items-center gap-1 min-w-0" style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
          {listing.seller && (
            <img
              src={listing.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller.store_name || listing.seller.name || 'S')}&size=24&background=F8C0C8&color=B81365&bold=true`}
              alt={listing.seller.store_name || listing.seller.name}
              className="w-4 h-4 rounded-full object-cover shrink-0"
            />
          )}
          {listing.seller?.id_verified && <ShieldCheck className="w-3 h-3 shrink-0" style={{ color: '#16a34a' }} />}
          {listing.seller?.rating_avg >= 4 && (
            <span className="flex items-center gap-0.5 shrink-0 font-semibold" style={{ color: '#555' }}>
              <Star className="w-2.5 h-2.5 fill-current" style={{ color: '#f59e0b' }} />
              {Number(listing.seller.rating_avg).toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-0.5 truncate min-w-0 ml-auto" style={{ color: 'var(--color-text-subtle)' }}>
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{listing.location?.city || listing.city || 'Ghana'}</span>
          </span>
          <span className="shrink-0 ml-1">{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
