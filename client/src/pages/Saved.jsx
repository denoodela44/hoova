import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import api from '../services/api'
import ListingCard from '../components/listings/ListingCard'

function SavedSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl animate-pulse"
          style={{ background: '#e5e3e0', aspectRatio: '4/5' }}
        />
      ))}
    </div>
  )
}

export default function Saved() {
  const { data, isLoading } = useQuery({
    queryKey: ['saved-listings'],
    queryFn: () => api.get('/listings/saved').then((r) => r.data),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const listings = data?.data ?? []

  return (
    <div
      className="min-h-screen"
      style={{ background: '#f5f4f2' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Saved Listings
          </h1>
          {!isLoading && listings.length > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full text-sm font-bold"
              style={{ background: '#fdf2f5', color: '#B81365' }}
            >
              {listings.length}
            </span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <SavedSkeleton />
        ) : listings.length === 0 ? (
          /* Empty state */
          <div
            className="rounded-2xl bg-white flex flex-col items-center justify-center py-20 px-6 text-center"
            style={{ border: '1px solid #f0eeeb' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: '#fdf2f5' }}
            >
              <Heart className="w-8 h-8" style={{ color: '#B81365' }} />
            </div>
            <p
              className="text-lg font-black text-gray-900 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              No saved listings yet
            </p>
            <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
              Tap the heart on any listing to save it here for later.
            </p>
            <Link
              to="/browse"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#B81365' }}
            >
              Browse listings →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
