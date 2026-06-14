import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, Bell, Loader2 } from 'lucide-react'
import api from '../services/api'
import ListingCard from '../components/listings/ListingCard'
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton'
import CategoryNav from '../components/search/CategoryNav'
import FilterPanel from '../components/search/FilterPanel'
import useAuthStore from '../store/authStore'
import { filterMockListings } from '../mocks/data'
import { BrowseSEO } from '../components/seo/SEO'
import EmptyState from '../components/common/EmptyState'

const PAGE_SIZE = 24

export default function Browse() {
  const [params] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const { isLoggedIn } = useAuthStore()
  const sentinelRef = useRef(null)

  const paramsKey = params.toString()

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['listings', 'browse', paramsKey],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams(params)
      p.set('page', pageParam)
      p.set('limit', PAGE_SIZE)
      try {
        const endpoint = params.get('q') ? '/search' : '/listings'
        return await api.get(`${endpoint}?${p.toString()}`).then((r) => r.data)
      } catch {
        return filterMockListings({
          q:         params.get('q')         || '',
          category:  params.get('category')  || '',
          region:    params.get('region')    || '',
          city:      params.get('city')      || '',
          min_price: params.get('min_price') || '',
          max_price: params.get('max_price') || '',
          condition: params.get('condition') || '',
          sort:      params.get('sort')      || 'newest',
          limit: PAGE_SIZE,
          page: pageParam,
        })
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const total      = lastPage?.total || 0
      const totalPages = Math.ceil(total / PAGE_SIZE)
      return allPages.length < totalPages ? allPages.length + 1 : undefined
    },
  })

  // IntersectionObserver — fires fetchNextPage when sentinel enters the viewport
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }  // start loading 200px before the bottom
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const listings = data?.pages.flatMap((p) => p?.data ?? []) ?? []
  const total    = data?.pages[0]?.total ?? 0
  const noResults = !isLoading && total === 0 && !!params.get('q')

  const { data: similarData } = useQuery({
    queryKey: ['search-similar', params.get('q')],
    queryFn: () => api.get(`/search/similar?q=${encodeURIComponent(params.get('q'))}&limit=8`).then((r) => r.data.data || []),
    enabled: noResults,
  })

  const q        = params.get('q')
  const category = params.get('category')
  const heading  = q
    ? `Results for "${q}"`
    : category
    ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'All Listings'

  const handleSaveSearch = async () => {
    if (!isLoggedIn()) { window.location.href = '/login'; return }
    try {
      await api.post('/saved-searches', {
        query: q,
        filters: Object.fromEntries(params),
        notif_email: true,
        notif_push: true,
      })
      alert('Search saved! You\'ll get notified when new matching listings appear.')
    } catch {
      alert('Could not save search. Try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      <BrowseSEO
        category={params.get('category')}
        region={params.get('region')}
        q={q}
        total={total}
      />

      {/* Category nav */}
      <div className="mb-4">
        <CategoryNav />
      </div>

      {/* Heading row */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-gray-900">{heading}</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {total.toLocaleString()} {total === 1 ? 'listing' : 'listings'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(q || category) && (
            <button onClick={handleSaveSearch} className="btn-secondary text-xs gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Save search
            </button>
          )}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`btn-secondary text-xs gap-1.5 ${showFilters ? 'border-[#B81365] text-[#B81365]' : ''}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Filter sidebar (desktop) */}
        <aside className="hidden md:block w-56 shrink-0">
          <FilterPanel />
        </aside>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/40 flex items-end">
            <div className="w-full bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto animate-slide-up">
              <FilterPanel onClose={() => setShowFilters(false)} />
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={`grid grid-cols-2 sm:grid-cols-3 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-2 sm:gap-4`}>
              {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div>
              <EmptyState
                title={q ? `No results for "${q}"` : 'Nothing found here'}
                subtitle="Looks like this one stumped us. Try different filters or a new search term."
              />
              {similarData?.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    Similar listings you might like
                  </h2>
                  <div className={`grid grid-cols-2 sm:grid-cols-3 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-2 sm:gap-4`}>
                    {similarData.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-2 sm:grid-cols-3 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-2 sm:gap-4`}>
                {listings.map((l) => (
                  <ListingCard key={`${l.id}-${l.created_at}`} listing={l} />
                ))}

                {/* Skeleton cards appended inline while fetching next page */}
                {isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => (
                  <ListingCardSkeleton key={`skel-${i}`} />
                ))}
              </div>

              {/* Invisible sentinel — IntersectionObserver watches this */}
              <div ref={sentinelRef} className="h-4" />

              {/* End-of-results message */}
              {!hasNextPage && listings.length > 0 && (
                <p className="text-center text-sm text-gray-400 mt-10 pb-4">
                  You've seen all {listings.length.toLocaleString()} listings — try a different search to find more.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

