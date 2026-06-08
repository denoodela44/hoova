import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Heart, Share2, MapPin, Eye, Clock, BadgeCheck, Star,
  MessageSquare, ChevronLeft, ChevronRight, Flag,
  Zap, ArrowLeft, ShieldCheck, X, AlertTriangle, CheckCircle,
  Send, PhoneCall, UserCheck, CalendarDays, Tag
} from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { formatPrice, timeAgo } from '../utils/format'
import { MOCK_LISTINGS, MOCK_AUCTION_LISTINGS, filterMockListings } from '../mocks/data'
import { ListingSEO } from '../components/seo/SEO'
import AuctionPanel from '../components/listings/AuctionPanel'
import OfferModal from '../components/listings/OfferModal'
import OfferThread from '../components/listings/OfferThread'

const REPORT_REASONS = [
  'Seller asked for mobile money or cash upfront',
  'Item does not exist or photos are stolen / fake',
  'Price is misleading or bait-and-switch',
  'Duplicate or spam listing',
  'Inappropriate or offensive content',
  'Other',
]

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()
  const [imgIndex, setImgIndex] = useState(0)
  const [saved, setSaved] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/listings/${id}`)
        setSaved(res.data.data.is_saved ?? false)
        return res.data.data
      } catch {
        const allMocks = [...MOCK_AUCTION_LISTINGS, ...MOCK_LISTINGS]
        const mock = allMocks.find((l) => l.id === id) || MOCK_LISTINGS[0]
        return mock
      }
    },
  })

  const { data: related } = useQuery({
    queryKey: ['listings', 'related', id],
    queryFn: async () => {
      try {
        return await api.get(`/listings?category=${listing?.category?.slug}&limit=6&exclude=${id}`).then((r) => r.data.data)
      } catch {
        return filterMockListings({ category: listing?.category?.slug }).data.filter((l) => l.id !== id).slice(0, 6)
      }
    },
    enabled: !!listing?.category?.slug,
  })

  const handleSave = async () => {
    if (!isLoggedIn()) { navigate('/login'); return }
    try {
      if (saved) await api.delete(`/listings/${id}/save`)
      else await api.post(`/listings/${id}/save`)
      setSaved((s) => !s)
    } catch (_) {}
  }

  const handleContact = async () => {
    if (!isLoggedIn()) { navigate('/login'); return }
    try {
      const res = await api.post('/conversations', { listing_id: id })
      navigate(`/messages/${res.data.data.id}`)
    } catch (_) {}
  }

  const handleWhatsApp = () => {
    if (!listing?.seller?.phone) return
    const text = `Hi, I'm interested in your listing on SIKA: "${listing.title}" — ${window.location.href}`
    window.open(`https://wa.me/${listing.seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    if (!reportReason) return
    try {
      await api.post(`/listings/${id}/report`, { reason: reportReason, detail: reportDetail })
    } catch (_) {}
    setReportSubmitted(true)
  }

  if (isLoading) return <ListingDetailSkeleton />

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="font-bold text-lg mb-2">Listing not found</h2>
        <p className="text-gray-500 mb-4">This listing may have been removed or expired.</p>
        <Link to="/browse" className="btn-primary">Browse listings</Link>
      </div>
    )
  }

  const images = listing.images || []
  const isAuction = listing.listing_type === 'auction'
  const isSeller = user?.id === listing.seller?.id
  const sellerAge = daysSince(listing.seller?.created_at)
  const isNewSeller = sellerAge !== null && sellerAge < 30
  const hasNoReviews = !listing.seller?.review_count || listing.seller.review_count === 0
  const isUnverified = !listing.seller?.id_verified
  const showCautionAlert = isNewSeller && hasNoReviews && isUnverified

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <ListingSEO listing={listing} />

      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Safety Banner ─────────────────────────────────── */}
      {!bannerDismissed && (
        <div
          className="flex items-start gap-3 mb-5 px-4 py-3 rounded-xl"
          style={{ background: '#fdf2f5', border: '1px solid #F8C0C8' }}
        >
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#B81365' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-1" style={{ color: '#B81365' }}>Stay safe on SIKA</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              <li>Never send mobile money or cash to "hold" an item before you've seen it.</li>
              <li>Meet in a public place — a mall, bank, or police station forecourt works well.</li>
              <li>If a deal feels too good to be true, it almost certainly is.</li>
            </ul>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Caution Alert (auto-flag) ──────────────────────── */}
      {showCautionAlert && (
        <div
          className="flex items-start gap-3 mb-5 px-4 py-3 rounded-xl"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
          <div>
            <p className="text-xs font-bold text-orange-700 mb-0.5">Proceed with caution</p>
            <p className="text-xs text-orange-600">
              This seller joined recently and has no reviews or ID verification. Verify the item in person before any payment.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: images + details ─────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image carousel */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-gray-100">
              {images.length > 0 ? (
                <img src={images[imgIndex]?.url} alt={listing.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={`h-2 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-white' : 'w-2 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className="w-16 h-16 rounded-lg overflow-hidden shrink-0 transition-all"
                    style={{ outline: i === imgIndex ? '2px solid #B81365' : '2px solid transparent' }}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                {listing.boost_tier && (
                  <span className="badge-featured inline-flex mb-2">
                    <Zap className="w-3 h-3" />
                    {listing.boost_tier === 'spotlight' ? 'Spotlight' : 'Featured'}
                  </span>
                )}
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{listing.title}</h1>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={handleSave} className={`btn-secondary p-2.5 ${saved ? 'text-red-500 border-red-200' : ''}`}>
                  <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                </button>
                <button onClick={handleShare} className="btn-secondary p-2.5">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {isAuction ? (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider leading-none mb-1">
                    {listing.bid_count > 0 ? 'Current bid' : 'Starting bid'}
                  </p>
                  <p className="text-3xl font-black" style={{ color: '#B81365', fontFamily: "'Poppins', sans-serif" }}>
                    {formatPrice(listing.current_bid || listing.starting_bid || listing.price)}
                  </p>
                  {listing.bid_count > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}</p>
                  )}
                </div>
              ) : (
                <p className="text-3xl font-black text-gray-900">{formatPrice(listing.price)}</p>
              )}
              {listing.condition && (
                <span className="badge badge-new">
                  {listing.condition === 'new' ? 'New' : 'Used'}
                </span>
              )}
              {listing.negotiable && !isAuction && (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#fdf2f5', color: '#B81365', border: '1px solid #F8C0C8' }}
                >
                  Negotiable
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {[listing.location?.area, listing.location?.city, listing.location?.region].filter(Boolean).join(', ')}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {listing.views_count || 0} views
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {timeAgo(listing.created_at)}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>ID: {listing.id}</span>
              <button
                onClick={() => { setShowReport(true); setReportSubmitted(false) }}
                className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors duration-150"
              >
                <Flag className="w-3 h-3" /> Report listing
              </button>
            </div>
          </div>

          {/* Related listings */}
          {related?.length > 0 && (
            <div>
              <h3 className="font-bold text-base mb-3">Similar Listings</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {related.slice(0, 6).map((l) => (
                  <Link key={l.id} to={`/listing/${l.id}`} className="card overflow-hidden hover:shadow-card-hover transition-all group">
                    <img
                      src={l.images?.[0]?.url || '/placeholder.jpg'}
                      alt={l.title}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-2.5">
                      <p className="font-bold text-sm">{formatPrice(l.price)}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{l.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: seller card ─────────────────────────── */}
        <div className="space-y-4">

          {/* Seller trust card */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4 text-gray-700">Seller</h3>

            <Link to={`/seller/${listing.seller?.id}`} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
              <img
                src={listing.seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller?.name || 'S')}&background=F8C0C8&color=B81365&bold=true`}
                alt={listing.seller?.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{listing.seller?.name}</p>
                  {listing.seller?.id_verified && (
                    <BadgeCheck className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                </div>
                {listing.seller?.rating_avg > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Star className="w-3 h-3 fill-current" style={{ color: '#B81365' }} />
                    {Number(listing.seller.rating_avg).toFixed(1)}
                    <span className="text-gray-400">({listing.seller.review_count} reviews)</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">No reviews yet</p>
                )}
              </div>
            </Link>

            {/* Trust signals */}
            <div className="space-y-2 mb-4">
              <TrustRow
                icon={<CalendarDays className="w-3.5 h-3.5" />}
                label={
                  sellerAge !== null
                    ? sellerAge < 30
                      ? `Joined ${sellerAge} days ago`
                      : sellerAge < 365
                      ? `Member for ${Math.floor(sellerAge / 30)} months`
                      : `Member for ${Math.floor(sellerAge / 365)} year${Math.floor(sellerAge / 365) > 1 ? 's' : ''}`
                    : 'Member'
                }
                ok={sellerAge === null || sellerAge >= 30}
                warn={isNewSeller}
              />
              <TrustRow
                icon={<UserCheck className="w-3.5 h-3.5" />}
                label={listing.seller?.id_verified ? 'Ghana Card verified' : 'Identity not verified'}
                ok={!!listing.seller?.id_verified}
                warn={!listing.seller?.id_verified}
              />
              <TrustRow
                icon={<PhoneCall className="w-3.5 h-3.5" />}
                label={listing.seller?.phone_verified ? 'Phone number verified' : 'Phone not verified'}
                ok={!!listing.seller?.phone_verified}
                warn={!listing.seller?.phone_verified}
              />
              {listing.seller?.review_count > 0 && (
                <TrustRow
                  icon={<Star className="w-3.5 h-3.5" />}
                  label={`${listing.seller.review_count} verified ${listing.seller.review_count === 1 ? 'review' : 'reviews'}`}
                  ok={true}
                />
              )}
            </div>

            {!isSeller && !isAuction && (
              <div className="space-y-2.5">
                <button onClick={handleContact} className="btn-primary w-full">
                  <MessageSquare className="w-4 h-4" />
                  Chat with Seller
                </button>
                {listing.negotiable && (
                  <button
                    onClick={() => setShowOffer(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: '#fdf2f5', color: '#B81365', border: '1px solid #F8C0C8' }}
                  >
                    <Tag className="w-4 h-4" />
                    Make an Offer
                  </button>
                )}
                {listing.seller?.phone && (
                  <button
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    style={{ background: '#22c55e', color: '#fff' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Seller
                  </button>
                )}
              </div>
            )}

            {isSeller && (
              <Link to={`/dashboard/listings/${id}/edit`} className="btn-secondary w-full text-center block">
                Edit Listing
              </Link>
            )}
          </div>

          {/* Auction panel */}
          {isAuction && (
            <AuctionPanel
              listing={listing}
              onBidPlaced={() => queryClient.invalidateQueries({ queryKey: ['listing', id] })}
            />
          )}

          {/* Offer thread (seller sees all offers; buyer sees their own) */}
          {!isAuction && listing.offers?.length > 0 && (
            <OfferThread
              offers={listing.offers}
              isSeller={isSeller}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['listing', id] })}
            />
          )}

          {/* Safety card */}
          <div className="card p-4" style={{ borderLeft: '3px solid #B81365' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#B81365' }} />
              <h4 className="font-bold text-xs text-gray-800">Safety Tips</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-gray-300">—</span>
                Meet in a public place: mall, bank, or police station.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-gray-300">—</span>
                Inspect and test the item before you pay.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-gray-300">—</span>
                Never send MoMo or cash to "reserve" an item.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-gray-300">—</span>
                Deals far below market price are a red flag.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile CTA ─────────────────────────────── */}
      {!isSeller && !isAuction && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg flex gap-3 z-40">
          <p className="font-black text-lg flex-1">{formatPrice(listing.price)}</p>
          {listing.negotiable && (
            <button
              onClick={() => setShowOffer(true)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: '#fdf2f5', color: '#B81365', border: '1px solid #F8C0C8' }}
            >
              Offer
            </button>
          )}
          <button
            onClick={handleWhatsApp}
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ background: '#22c55e' }}
          >
            WhatsApp
          </button>
          <button onClick={handleContact} className="btn-primary px-4">
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        </div>
      )}

      {/* ── Offer Modal ───────────────────────────────────── */}
      {showOffer && (
        <OfferModal
          listing={listing}
          onClose={() => setShowOffer(false)}
          onSubmitted={() => {
            setShowOffer(false)
            queryClient.invalidateQueries({ queryKey: ['listing', id] })
          }}
        />
      )}

      {/* ── Report Modal ──────────────────────────────────── */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" />
                <h2 className="font-bold text-sm text-gray-900">Report this listing</h2>
              </div>
              <button onClick={() => setShowReport(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSubmitted ? (
              /* Success state */
              <div className="px-5 py-8 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#dcfce7' }}
                >
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-bold text-gray-900 mb-1">Report submitted</p>
                <p className="text-sm text-gray-500">
                  Our team will review this listing within 24 hours. Thank you for helping keep SIKA safe.
                </p>
                <button
                  onClick={() => setShowReport(false)}
                  className="mt-5 btn-secondary text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Report form */
              <form onSubmit={handleReport} className="px-5 py-4 space-y-4">
                <p className="text-xs text-gray-500">What's wrong with this listing?</p>

                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        background: reportReason === reason ? '#fdf2f5' : '#fafafa',
                        border: `1px solid ${reportReason === reason ? '#F8C0C8' : '#f0f0f0'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="shrink-0"
                        style={{ accentColor: '#B81365' }}
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={reportDetail}
                  onChange={(e) => setReportDetail(e.target.value)}
                  placeholder="Additional details (optional)"
                  rows={2}
                  className="input h-auto py-2.5 resize-none text-sm"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReport(false)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
                    style={{ background: '#B81365' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Trust row ── */
function TrustRow({ icon, label, ok, warn }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="shrink-0"
        style={{ color: ok ? '#22c55e' : warn ? '#f97316' : '#9ca3af' }}
      >
        {icon}
      </span>
      <span style={{ color: ok ? '#374151' : warn ? '#9a3412' : '#6b7280' }}>
        {label}
      </span>
    </div>
  )
}

function ListingDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton aspect-[4/3] rounded-2xl" />
          <div className="card p-5 space-y-3">
            <div className="skeleton h-6 w-3/4 rounded" />
            <div className="skeleton h-8 w-32 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
        <div>
          <div className="card p-5 space-y-3">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="flex gap-3">
              <div className="skeleton w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
