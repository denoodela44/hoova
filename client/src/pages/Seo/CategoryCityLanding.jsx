import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { MapPin, ArrowRight, ShieldCheck, Star } from 'lucide-react'
import api from '../../services/api'
import ListingCard from '../../components/listings/ListingCard'
import ListingCardSkeleton from '../../components/listings/ListingCardSkeleton'
import { filterMockListings, MOCK_CATEGORIES } from '../../mocks/data'
import { formatPrice } from '../../utils/format'

const CITY_REGIONS = {
  accra:      { city: 'Accra',      region: 'Greater Accra' },
  kumasi:     { city: 'Kumasi',     region: 'Ashanti' },
  takoradi:   { city: 'Takoradi',   region: 'Western' },
  tema:       { city: 'Tema',       region: 'Greater Accra' },
  tamale:     { city: 'Tamale',     region: 'Northern' },
  'cape-coast': { city: 'Cape Coast', region: 'Central' },
}

const CATEGORY_LABELS = {
  vehicles:     { label: 'Vehicles', keywords: 'cars, trucks, motorcycles, buses, auto parts' },
  electronics:  { label: 'Electronics', keywords: 'phones, laptops, TVs, cameras, accessories' },
  'real-estate':{ label: 'Real Estate', keywords: 'houses, apartments, land, plots, commercial property' },
  fashion:      { label: 'Fashion', keywords: "clothing, shoes, bags, accessories, men's, women's" },
  jobs:         { label: 'Jobs', keywords: 'vacancies, employment, careers, work, hiring' },
  services:     { label: 'Services', keywords: 'plumbers, electricians, cleaners, professionals' },
  furniture:    { label: 'Furniture', keywords: 'sofas, beds, tables, chairs, office furniture' },
  agriculture:  { label: 'Farm & Agriculture', keywords: 'farm produce, equipment, livestock, seeds' },
}

export default function CategoryCityLanding() {
  const { category, city: citySlug } = useParams()
  const navigate = useNavigate()

  const cityInfo = CITY_REGIONS[citySlug] || { city: citySlug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), region: '' }
  const catInfo = CATEGORY_LABELS[category] || { label: category?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), keywords: '' }
  const catObj = MOCK_CATEGORIES.find((c) => c.slug === category)

  const title = `${catInfo.label} for Sale in ${cityInfo.city}, Ghana`
  const description = `Find the best deals on ${catInfo.label.toLowerCase()} in ${cityInfo.city}, Ghana. Browse new and used ${catInfo.keywords} from verified local sellers. Free to browse — post your ad today on HOOVA Ghana.`

  const { data, isLoading } = useQuery({
    queryKey: ['seo-landing', category, citySlug],
    queryFn: async () => {
      try {
        return await api.get(`/listings?category=${category}&region=${encodeURIComponent(cityInfo.region)}&limit=12`).then((r) => r.data)
      } catch {
        return filterMockListings({ category, limit: 12 })
      }
    },
  })

  const listings = data?.data || []
  const total = data?.total || listings.length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    numberOfItems: total,
    url: `https://hoova.com.gh/buy/${category}/${citySlug}`,
    itemListElement: listings.slice(0, 10).map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://hoova.com.gh/listing/${l.id}`,
      name: l.title,
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hoova.com.gh' },
      { '@type': 'ListItem', position: 2, name: catInfo.label, item: `https://hoova.com.gh/browse?category=${category}` },
      { '@type': 'ListItem', position: 3, name: cityInfo.city, item: `https://hoova.com.gh/buy/${category}/${citySlug}` },
    ],
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Helmet>
        <title>{title} — {total.toLocaleString()} Ads | HOOVA Ghana</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://hoova.com.gh/buy/${category}/${citySlug}`} />
        <meta property="og:title" content={`${title} | HOOVA Ghana`} />
        <meta property="og:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link to={`/browse?category=${category}`} className="hover:text-brand-600">{catInfo.label}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">{cityInfo.city}</span>
      </nav>

      {/* Hero section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
          {catInfo.label} for Sale in {cityInfo.city}, Ghana
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl">
          Browse {total.toLocaleString()} listings for {catInfo.label.toLowerCase()} in {cityInfo.city}.
          Find {catInfo.keywords} from trusted, verified sellers.
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            <MapPin className="w-3 h-3" /> {cityInfo.city}, {cityInfo.region}
          </span>
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Verified sellers available
          </span>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['Newest', 'Price: Low to High', 'Price: High to Low', 'Most Viewed'].map((label, i) => {
          const sorts = ['newest', 'price_asc', 'price_desc', 'popular']
          return (
            <button
              key={label}
              onClick={() => navigate(`/browse?category=${category}&region=${encodeURIComponent(cityInfo.region)}&sort=${sorts[i]}`)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-dark-border hover:border-brand-400 hover:text-brand-700 transition-colors"
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : listings.map((l) => <ListingCard key={l.id} listing={l} />)
        }
      </div>

      <div className="text-center mb-12">
        <Link
          to={`/browse?category=${category}&region=${encodeURIComponent(cityInfo.region)}`}
          className="btn-primary"
        >
          See all {catInfo.label} in {cityInfo.city} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* SEO text block — helps Google understand the page intent */}
      <div className="card p-6 prose prose-sm dark:prose-invert max-w-none">
        <h2 className="font-bold text-base text-gray-800 dark:text-gray-200 mb-3">
          Buying {catInfo.label} in {cityInfo.city}, Ghana
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          HOOVA is Ghana's fastest-growing classifieds marketplace where you can find {catInfo.label.toLowerCase()} for sale
          in {cityInfo.city} and across all {cityInfo.region ? cityInfo.region + ' and other ' : ''}regions of Ghana.
          Whether you're looking for brand new or used {catInfo.keywords}, you'll find the best
          prices from local sellers in {cityInfo.city}.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
          All sellers on HOOVA can be verified with their Ghana Card for extra trust. You can message sellers
          directly in-app, compare prices, and get notified when new {catInfo.label.toLowerCase()} are listed
          in {cityInfo.city}. Posting an ad is completely free.
        </p>

        {/* Related city links — internal linking for SEO */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {catInfo.label} in other cities
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CITY_REGIONS)
              .filter(([slug]) => slug !== citySlug)
              .map(([slug, info]) => (
                <Link
                  key={slug}
                  to={`/buy/${category}/${slug}`}
                  className="text-xs text-brand-600 hover:underline"
                >
                  {catInfo.label} in {info.city}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
