import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Plus, TrendingDown, Zap, Heart, LayoutDashboard, MessageSquare } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import ListingCard from '../components/listings/ListingCard'
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton'
import CategoryNav from '../components/search/CategoryNav'
import SearchAutocomplete from '../components/search/SearchAutocomplete'
import CategorySidebar from '../components/search/CategorySidebar'
import SEO, { HomeSEO } from '../components/seo/SEO'
import { filterMockListings, MOCK_CATEGORIES } from '../mocks/data'
import { getCategoryStyle } from '../utils/categoryStyles'

async function fetchOrMock(url, mockFn) {
  try { return (await api.get(url)).data.data }
  catch { return mockFn() }
}

const FALLBACK_POPULAR = [
  'iPhone 14', 'Toyota Corolla', '2 bedroom apartment',
  'Generator', 'Samsung TV', 'Laptop', 'Land for sale', 'Motorbike',
]

const TOP_CATEGORIES = [
  { slug: 'vehicles',    label: 'Vehicles'    },
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'real-estate', label: 'Real Estate' },
  { slug: 'fashion',     label: 'Fashion'     },
  { slug: 'jobs',        label: 'Jobs'        },
  { slug: 'services',    label: 'Services'    },
  { slug: 'furniture',   label: 'Furniture'   },
  { slug: 'agriculture', label: 'Agriculture' },
]

const GHANA_CITIES = [
  { label: 'Accra',      region: 'Greater Accra', count: '18,400+', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80' },
  { label: 'Kumasi',     region: 'Ashanti',       count: '9,200+',  img: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&q=80' },
  { label: 'Takoradi',   region: 'Western',       count: '4,100+',  img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
  { label: 'Tamale',     region: 'Northern',      count: '3,500+',  img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80' },
  { label: 'Cape Coast', region: 'Central',       count: '2,800+',  img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80' },
  { label: 'Tema',       region: 'Greater Accra', count: '3,900+',  img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80' },
]

const LISTING_TABS = [
  { key: '',            label: 'All'         },
  { key: 'vehicles',    label: 'Vehicles'    },
  { key: 'electronics', label: 'Electronics' },
  { key: 'real-estate', label: 'Real Estate' },
  { key: 'fashion',     label: 'Fashion'     },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('')
  const { user, isLoggedIn } = useAuthStore()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const loggedIn = isLoggedIn()

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => fetchOrMock('/listings?boost_tier=spotlight&limit=8',
      () => filterMockListings({ sort: 'newest' }).data.filter((l) => l.boost_tier === 'spotlight')),
  })

  const { data: newest, isLoading: newestLoading } = useQuery({
    queryKey: ['listings', 'newest', activeTab],
    queryFn: () => fetchOrMock(
      `/listings?sort=newest&limit=12${activeTab ? `&category=${activeTab}` : ''}`,
      () => filterMockListings({ sort: 'newest', limit: 12, category: activeTab }).data),
  })

  const { data: trendingTerms = FALLBACK_POPULAR } = useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      try {
        const res = await api.get('/analytics/trending?limit=8')
        return res.data.data?.length > 0 ? res.data.data : FALLBACK_POPULAR
      } catch { return FALLBACK_POPULAR }
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: priceDrops, isLoading: priceDropsLoading } = useQuery({
    queryKey: ['listings', 'price-drops'],
    queryFn: () => fetchOrMock('/listings?price_dropped=true&limit=8',
      () => filterMockListings({ sort: 'newest', limit: 8 }).data.filter((l) => l.price_dropped)),
  })

  return (
    <div style={{ background: '#fff' }}>
      <SEO
        title="Buy and Sell Anything in Ghana — Cars, Electronics, Real Estate"
        description="HOOVA is Ghana's smartest classifieds marketplace."
        url="/"
      />
      <HomeSEO />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: '#B81365' }}>
        {loggedIn ? (
          <div className="max-w-2xl mx-auto px-6 py-10 sm:py-14">
            {/* Personalized greeting */}
            <div className="flex items-center gap-3 mb-6">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&size=56&background=F8C0C8&color=B81365&bold=true`}
                alt={user?.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
                style={{ border: '2px solid rgba(255,255,255,0.3)' }}
              />
              <div>
                <p className="text-pink-200 text-sm font-medium">Welcome back 👋</p>
                <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Hey, {firstName}!
                </h1>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-lg mb-5">
              <SearchAutocomplete large placeholder="What are you looking for today?" />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                to="/post"
                className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#fff', color: '#B81365' }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Post an Ad
              </Link>
              <Link
                to="/saved"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <Heart className="w-4 h-4" />
                Saved
              </Link>
              <Link
                to="/messages"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-20 text-center">
            <h1
              className="text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif", fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' }}
            >
              Buy &amp; Sell<br />
              <span style={{ color: '#fff', opacity: 0.85 }}>Anything in Ghana</span>
            </h1>
            <p className="text-pink-100 mb-8 max-w-sm mx-auto" style={{ fontSize: 16, lineHeight: 1.6 }}>
              No cap — Ghana's best deals are right here. Cars, phones, houses, fashion. Verified sellers only, fr fr.
            </p>
            <div className="max-w-lg mx-auto">
              <SearchAutocomplete large placeholder="Search for cars, phones, houses…" />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-pink-200 text-xs font-medium shrink-0">Popular right now:</span>
                {trendingTerms.map((term) => (
                  <Link
                    key={term}
                    to={`/browse?q=${encodeURIComponent(term)}`}
                    className="text-xs font-medium px-3 py-1 rounded-full transition-all duration-150 hover:bg-white hover:text-[#B81365]"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── CATEGORY NAV ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <CategoryNav />
        </div>
      </div>

      {/* ── CATEGORY GRID ─────────────────────────────────────────── */}
      <section className="py-3" style={{ background: '#ECEAE6' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TOP_CATEGORIES.map((cat) => {
              const style = getCategoryStyle(cat.slug)
              return (
                <Link
                  key={cat.slug}
                  to={`/browse?category=${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 shrink-0 rounded-xl bg-white p-2.5 text-center transition-all hover:shadow-sm"
                  style={{ minWidth: 68, border: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ti-${style.icon}`} style={{ color: style.color, fontSize: 16 }} />
                  </span>
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide leading-tight">
                    {cat.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-12">
        <div className="flex gap-8 items-start">

          <aside className="hidden lg:block w-52 shrink-0 sticky top-24">
            <CategorySidebar />
          </aside>

          <div className="flex-1 min-w-0 space-y-16">

            {/* ── SPOTLIGHT ─────────────────────────────────────── */}
            {(featuredLoading || (featured && featured.length > 0)) && (
              <section>
                <SectionHeader title="Spotlight Listings" link="/browse?boost_tier=spotlight" />
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {featuredLoading
                    ? Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
                    : featured.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}

            {/* ── JUST LISTED ───────────────────────────────────── */}
            <section>
              <SectionHeader title="Fresh Drops" link="/browse?sort=newest" />

              <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
                {LISTING_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full border transition-all duration-150"
                    style={
                      activeTab === tab.key
                        ? { background: '#B81365', borderColor: '#B81365', color: '#fff' }
                        : { background: 'transparent', borderColor: '#e5e7eb', color: '#555' }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                {newestLoading
                  ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
                  : newest?.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>

              <div className="text-center mt-8">
                <Link
                  to={`/browse${activeTab ? `?category=${activeTab}` : ''}`}
                  className="btn btn-secondary inline-flex items-center gap-2"
                >
                  Browse all listings <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* ── POST AD BANNER ────────────────────────────────── */}
            <section className="rounded-2xl overflow-hidden" style={{ background: '#B81365' }}>
              <div className="px-8 py-10 sm:flex items-center justify-between gap-8">
                <div>
                  <h2
                    className="text-white mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}
                  >
                    Got stuff collecting dust?
                  </h2>
                  <p className="text-pink-100 text-sm max-w-xs" style={{ lineHeight: 1.6 }}>
                    Post in under 2 mins. No cap. Buyers dey wait for you.
                  </p>
                </div>
                <Link
                  to="/post"
                  className="shrink-0 mt-6 sm:mt-0 inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{ background: '#fff', color: '#B81365' }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Post a Free Ad
                </Link>
              </div>
            </section>

            {/* ── PRICE DROPS ───────────────────────────────────── */}
            {(priceDropsLoading || (priceDrops && priceDrops.length > 0)) && (
              <section>
                <SectionHeader title="Bag Secured — Price Drops" link="/browse?price_dropped=true" />
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6" style={{ scrollbarWidth: 'none' }}>
                  {priceDropsLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="shrink-0 w-48"><ListingCardSkeleton /></div>
                      ))
                    : priceDrops.map((l) => (
                        <div key={l.id} className="shrink-0 w-48 sm:w-52">
                          <ListingCard listing={l} />
                        </div>
                      ))}
                </div>
              </section>
            )}

            {/* ── CITIES ────────────────────────────────────────── */}
            <section>
              <SectionHeader title="Shop Your City" link="/browse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GHANA_CITIES.map((city) => (
                  <Link
                    key={city.label}
                    to={`/browse?region=${encodeURIComponent(city.region)}`}
                    className="group relative block rounded-xl overflow-hidden"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <img
                      src={city.img}
                      alt={city.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }}
                    />
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="text-white font-bold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {city.label}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">{city.count} listings</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── STATS ─────────────────────────────────────────── */}
            <section className="rounded-2xl overflow-hidden" style={{ background: '#B81365' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {[
                  { value: '50,000+', label: 'Active Listings'  },
                  { value: '12,000+', label: 'Verified Sellers' },
                  { value: '16',      label: 'Regions Covered'  },
                  { value: 'Free',    label: 'To Post Your Ad'  },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="p-8 text-center"
                    style={{
                      borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                    }}
                  >
                    <p
                      className="text-3xl font-black text-white mb-1"
                      style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.03em' }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs text-pink-200 font-medium uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── WHY HOOVA ──────────────────────────────────────── */}
            <section className="rounded-2xl p-8" style={{ background: '#ECEAE6' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why HOOVA hits different
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'No Scam Zone',    desc: 'Ghana Card verified sellers, buyer protection tips and a community that reports sus listings fast.' },
                  { title: 'Stay on Top',     desc: 'Save your search and get pinged by SMS, email or push the second a matching deal drops.' },
                  { title: 'Slide into DMs',  desc: 'Real-time chat with read receipts. No need to share your number upfront — we got you.' },
                ].map((vp) => (
                  <div key={vp.title} className="rounded-xl p-6 bg-white">
                    <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15 }}>
                      {vp.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-500">{vp.desc}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, link }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {title}
      </h2>
      <Link to={link} className="text-sm font-medium text-gray-400 hover:text-[#B81365] transition-colors duration-150 flex items-center gap-1">
        See all <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
