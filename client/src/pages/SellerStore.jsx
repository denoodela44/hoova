import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  BadgeCheck, Star, MapPin, Share2, Copy, Check,
  Package, MessageSquare, Calendar, ChevronLeft, ChevronRight,
  Phone, Clock, Zap, ShieldCheck, TrendingUp,
} from 'lucide-react'
import api from '../services/api'
import ListingCard from '../components/listings/ListingCard'
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton'
import { MOCK_LISTINGS, SELLERS } from '../mocks/data'

const BASE_URL = 'https://hoova.com.gh'

const PLAN_META = {
  premium: { label: 'Premium Store', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  pro:     { label: 'Pro Store',     color: '#B81365', bg: '#FDF2F8', border: '#FBCFE8' },
  basic:   { label: 'HOOVA Store',    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
}

function memberSince(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatPrice(p) {
  return `GHS ${Number(p).toLocaleString()}`
}

export default function SellerStore() {
  const { id, slug } = useParams()
  const [page, setPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  // Resolve the API path: slug-based route uses /users/store/:slug, id-based uses /users/:id
  const apiPath = slug ? `/users/store/${slug}` : `/users/${id}`
  const lookupKey = slug || id

  const { data, isLoading } = useQuery({
    queryKey: ['seller-store', lookupKey, page],
    queryFn: async () => {
      try {
        return await api.get(`${apiPath}?page=${page}&limit=12`).then((r) => r.data.data)
      } catch {
        const baseSeller = SELLERS?.find((s) => s.id === id) || SELLERS[0]
        const seller = {
          ...baseSeller,
          store_name: 'Kwame Asante Motors',
          tagline: 'Quality cars. Real deals. Zero stress.',
          bio: 'Ghana\'s most trusted car dealership. Over 10 years selling quality vehicles across Greater Accra. Every car is inspected, priced fairly and ready to drive.',
          store_plan: 'pro',
          response_rate: 97,
          cover_image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80',
          location: { city: 'Accra', region: 'Greater Accra', area: 'East Legon' },
          whatsapp: baseSeller.phone,
          working_hours: 'Mon – Sat, 8am – 6pm',
        }
        const listings = MOCK_LISTINGS.slice(0, 12).map((l) => ({ ...l, seller }))
        return { ...seller, listings, total: 12, page: 1, totalPages: 1, reviews: MOCK_REVIEWS }
      }
    },
  })

  // Prefer the clean slug URL; fall back to ID-based URL
  const storeSlug = data?.store_slug || slug
  const storeUrl = storeSlug
    ? `${BASE_URL}/store/${storeSlug}`
    : `${BASE_URL}/seller/${id || lookupKey}`
  const listings = data?.listings || []
  const plan = PLAN_META[data?.store_plan] || PLAN_META.basic

  const categories = ['all', ...new Set(listings.map((l) => l.category?.slug).filter(Boolean))]
  const filtered = activeCategory === 'all'
    ? listings
    : listings.filter((l) => l.category?.slug === activeCategory)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${data?.store_name || data?.name} on HOOVA`, url: storeUrl })
    } else {
      handleCopy()
    }
  }

  const title = data
    ? `${data.store_name || data.name} — ${data.total || 0} Listings | HOOVA Ghana`
    : 'Store | HOOVA Ghana'
  const description = data?.bio
    ? `${data.bio.slice(0, 150)} — Browse on HOOVA Ghana.`
    : `Browse listings from ${data?.name || 'this seller'} on HOOVA Ghana.`

  return (
    <div style={{ background: '#f9f9f7', minHeight: '100vh' }}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={storeUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {data?.avatar && <meta property="og:image" content={data.avatar} />}
      </Helmet>

      {isLoading ? (
        <StoreSkeleton />
      ) : (
        <>
          {/* ── Cover Banner ─────────────────────────────────────── */}
          <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
            {data?.cover_image ? (
              <img
                src={data.cover_image}
                alt="Store cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div style={{ background: 'linear-gradient(135deg, #B81365 0%, #7c0d43 100%)', height: '100%' }} />
            )}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }}
            />

            {/* Plan badge */}
            <div className="absolute top-4 right-4">
              <span
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}
              >
                <Zap className="w-3 h-3" />
                {plan.label}
              </span>
            </div>
          </div>

          {/* ── Store Identity ────────────────────────────────────── */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="relative -mt-14 mb-6">
              <div
                className="rounded-2xl p-6 sm:p-8"
                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)' }}
              >
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Avatar */}
                  <div className="relative shrink-0 -mt-14 sm:-mt-16">
                    <img
                      src={data?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.name || 'S')}&size=120&background=B81365&color=fff&bold=true`}
                      alt={data?.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                      style={{ border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    />
                    {data?.id_verified && (
                      <span
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#10b981', border: '2px solid #fff' }}
                      >
                        <BadgeCheck className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1
                            className="text-2xl font-black text-gray-900"
                            style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
                          >
                            {data?.store_name || data?.name}
                          </h1>
                          {data?.id_verified && (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                            >
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>

                        {data?.tagline && (
                          <p className="text-sm font-medium text-gray-500 mt-0.5">{data.tagline}</p>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          {data?.rating_avg > 0 && (
                            <StatPill icon={<Star className="w-3.5 h-3.5 fill-current" style={{ color: '#f59e0b' }} />}>
                              {Number(data.rating_avg).toFixed(1)}
                              <span className="text-gray-400 font-normal ml-0.5">({data.review_count})</span>
                            </StatPill>
                          )}
                          <StatPill icon={<Package className="w-3.5 h-3.5 text-gray-400" />}>
                            {data?.total || 0} listings
                          </StatPill>
                          <StatPill icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}>
                            Since {memberSince(data?.created_at)}
                          </StatPill>
                          {data?.response_rate && (
                            <StatPill icon={<TrendingUp className="w-3.5 h-3.5 text-gray-400" />}>
                              {data.response_rate}% response
                            </StatPill>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {data?.whatsapp && (
                          <a
                            href={`https://wa.me/${data.whatsapp?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-95"
                            style={{ background: '#B81365', color: '#fff' }}
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </a>
                        )}
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all duration-150 hover:bg-gray-50"
                          style={{ border: '1.5px solid #e5e7eb', color: '#374151' }}
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>

                    {/* Store link copy */}
                    <button
                      onClick={handleCopy}
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 hover:bg-gray-100 group"
                      style={{ background: '#ECEAE6' }}
                    >
                      <span className="text-xs text-gray-400 font-mono truncate max-w-xs">{storeUrl}</span>
                      <span className="shrink-0 flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#B81365' }}>
                        {copied
                          ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
                          : <><Copy className="w-3.5 h-3.5" /> Copy link</>
                        }
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main grid: listings + sidebar ─────────────────── */}
            <div className="flex gap-6 items-start pb-16">

              {/* Listings area */}
              <div className="flex-1 min-w-0">

                {/* Category filter */}
                {categories.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
                    {categories.map((slug) => (
                      <button
                        key={slug}
                        onClick={() => setActiveCategory(slug)}
                        className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full border capitalize transition-all duration-150"
                        style={
                          activeCategory === slug
                            ? { background: '#B81365', borderColor: '#B81365', color: '#fff' }
                            : { background: '#fff', borderColor: '#e5e7eb', color: '#555' }
                        }
                      >
                        {slug === 'all' ? 'All products' : slug.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Count */}
                <p className="text-xs text-gray-400 font-medium mb-4 uppercase tracking-wide">
                  {filtered.length} {activeCategory === 'all' ? 'total' : activeCategory.replace(/-/g, ' ')} listing{filtered.length !== 1 ? 's' : ''}
                </p>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
                    : filtered.length === 0
                    ? (
                      <div className="col-span-full py-16 text-center text-gray-400">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-25" />
                        <p className="font-medium text-sm">Nothing here yet</p>
                      </div>
                    )
                    : filtered.map((l) => <ListingCard key={l.id} listing={l} />)
                  }
                </div>

                {/* Pagination */}
                {data?.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 rounded-xl border font-semibold text-sm flex items-center justify-center disabled:opacity-40 transition-all hover:bg-gray-50"
                      style={{ border: '1.5px solid #e5e7eb' }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-400 px-3">
                      {page} / {data.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data?.totalPages}
                      className="w-9 h-9 rounded-xl border font-semibold text-sm flex items-center justify-center disabled:opacity-40 transition-all hover:bg-gray-50"
                      style={{ border: '1.5px solid #e5e7eb' }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24">

                {/* About */}
                {data?.bio && (
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0eeeb' }}>
                    <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      About this store
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{data.bio}</p>
                  </div>
                )}

                {/* Details */}
                <div className="rounded-2xl p-5" style={{ background: '#ECEAE6' }}>
                  <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Store details
                  </h3>
                  <div className="space-y-3">
                    {data?.location?.city && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {data.location.area && `${data.location.area}, `}{data.location.city}
                        </span>
                      </div>
                    )}
                    {data?.working_hours && (
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{data.working_hours}</span>
                      </div>
                    )}
                    {data?.phone && (
                      <div className="flex items-start gap-2.5">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{data.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reviews preview */}
                {data?.reviews?.length > 0 && (
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0eeeb' }}>
                    <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      What buyers say
                    </h3>
                    <div className="space-y-4">
                      {data.reviews.slice(0, 3).map((r) => (
                        <div key={r.id}>
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={r.reviewer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reviewer?.name || 'U')}&size=28&background=ECEAE6&color=374151`}
                              alt={r.reviewer?.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-semibold text-gray-800">{r.reviewer?.name}</span>
                            <div className="flex ml-auto">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? 'fill-current' : ''}`} style={{ color: i < r.rating ? '#f59e0b' : '#d1d5db' }} />
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="text-xs text-gray-500 leading-relaxed">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatPill({ icon, children }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
      {icon}
      {children}
    </span>
  )
}

function StoreSkeleton() {
  return (
    <div>
      <div className="w-full h-52" style={{ background: '#ECEAE6' }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl p-8 -mt-14 mb-6 bg-white">
          <div className="flex gap-5 items-start">
            <div className="w-24 h-24 rounded-2xl -mt-14 shrink-0" style={{ background: '#ECEAE6' }} />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-7 w-52 rounded-xl" style={{ background: '#ECEAE6' }} />
              <div className="h-4 w-80 rounded-xl" style={{ background: '#ECEAE6' }} />
              <div className="flex gap-3">
                <div className="h-4 w-20 rounded-xl" style={{ background: '#ECEAE6' }} />
                <div className="h-4 w-24 rounded-xl" style={{ background: '#ECEAE6' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

const MOCK_REVIEWS = [
  { id: 'r1', rating: 5, comment: 'Legit seller. Car was exactly as described. No hidden fees, quick paperwork.', reviewer: { name: 'Abena M.', avatar: 'https://i.pravatar.cc/40?img=47' } },
  { id: 'r2', rating: 5, comment: 'Bought my Corolla here. The process was smooth and transparent. Highly recommend.', reviewer: { name: 'Kofi B.', avatar: 'https://i.pravatar.cc/40?img=33' } },
  { id: 'r3', rating: 4, comment: 'Good experience overall. Quick response on WhatsApp and fair price.', reviewer: { name: 'Yaw D.', avatar: 'https://i.pravatar.cc/40?img=15' } },
]
