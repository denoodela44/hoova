import { Helmet } from 'react-helmet-async'

export const SITE_NAME = 'SIKA Ghana'
export const BASE_URL  = 'https://sika.com.gh'
export const DEFAULT_IMAGE = `${BASE_URL}/og-default.jpg`
export const DEFAULT_DESCRIPTION =
  "Ghana's #1 classifieds marketplace. Buy and sell cars, phones, houses, fashion, jobs and more from verified sellers across all 16 regions. Post your free ad today on SIKA Ghana."

const CATEGORY_KEYWORDS = {
  vehicles:     'cars for sale Ghana, used cars Accra, Toyota Corolla Ghana, pickup trucks Ghana',
  electronics:  'phones for sale Ghana, laptops Ghana, Samsung phones Accra, electronics Kumasi',
  'real-estate':'houses for sale Ghana, apartments Accra, land for sale Ghana, 2 bedroom Accra',
  fashion:      'clothes Ghana, designer bags Accra, Kente fashion Ghana, shoes Ghana',
  jobs:         'jobs in Ghana, vacancies Accra, employment Ghana, part time jobs Kumasi',
  services:     'services Ghana, plumbers Accra, electricians Ghana, freelancers Ghana',
  furniture:    'furniture Ghana, sofas Accra, beds Ghana, office furniture Kumasi',
  agriculture:  'farm equipment Ghana, cocoa Ghana, seeds Ghana, tractors Ghana',
}

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  canonical,
  keywords,
  children,
}) {
  const fullTitle    = title ? `${title} | SIKA Ghana` : 'SIKA Ghana — Buy and Sell Anything in Ghana'
  const fullUrl      = url ? `${BASE_URL}${url}` : BASE_URL
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : fullUrl

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large'} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt"   content={fullTitle} />
      <meta property="og:url"         content={fullUrl} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="en_GH" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@SIKAGhana" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* Geo */}
      <meta name="geo.region"    content="GH" />
      <meta name="geo.placename" content="Ghana" />
      <meta name="ICBM"          content="7.9465, -1.0232" />

      {children}
    </Helmet>
  )
}

/* ── Listing detail SEO ──────────────────────────────────────── */
export function ListingSEO({ listing }) {
  if (!listing) return null

  const city      = listing.location?.city || 'Ghana'
  const region    = listing.location?.region || ''
  const category  = listing.category?.name || ''
  const price     = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(listing.price)
  const condition = listing.condition === 'new' ? 'Brand New' : 'Used'
  const image     = listing.images?.[0]?.url || DEFAULT_IMAGE
  const url       = `/listing/${listing.id}`

  const title = `${listing.title} for Sale in ${city} — ${price}`
  const description = `${condition} ${listing.title} for sale in ${city}${region ? ', ' + region : ''}, Ghana. Price: ${price}. ${(listing.description || '').slice(0, 120).trim()}. Contact seller on SIKA Ghana classifieds.`
  const keywords = [
    listing.title,
    `${listing.title} for sale`,
    `${listing.title} ${city}`,
    `${listing.title} Ghana`,
    `buy ${listing.title} Ghana`,
    category,
    `${category} ${city}`,
    'SIKA Ghana',
  ].filter(Boolean).join(', ')

  // JSON-LD: Product
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description || listing.title,
    image: listing.images?.map((i) => i.url).filter(Boolean) || [],
    sku: listing.id,
    brand: listing.seller?.name ? { '@type': 'Brand', name: listing.seller.name } : undefined,
    itemCondition: listing.condition === 'new'
      ? 'https://schema.org/NewCondition'
      : 'https://schema.org/UsedCondition',
    ...(listing.seller?.rating_avg > 0 && listing.seller?.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(listing.seller.rating_avg).toFixed(1),
        reviewCount: listing.seller.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'GHS',
      availability: listing.status === 'active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${BASE_URL}${url}`,
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      itemCondition: listing.condition === 'new'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
      areaServed: {
        '@type': 'Place',
        name: city,
        address: {
          '@type': 'PostalAddress',
          addressLocality: city,
          addressRegion: region,
          addressCountry: 'GH',
        },
      },
      seller: {
        '@type': 'Person',
        name: listing.seller?.name,
        ...(listing.seller?.id_verified ? { identifier: 'Ghana Card Verified' } : {}),
      },
    },
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',                  item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: category || 'Listings',  item: `${BASE_URL}/browse?category=${listing.category?.slug}` },
      { '@type': 'ListItem', position: 3, name: listing.title,           item: `${BASE_URL}${url}` },
    ],
  }

  return (
    <Helmet>
      <title>{title} | SIKA Ghana</title>
      <meta name="description"   content={description} />
      <meta name="keywords"      content={keywords} />
      <link rel="canonical"      href={`${BASE_URL}${url}`} />
      <meta name="robots"        content="index,follow,max-snippet:-1,max-image-preview:large" />

      <meta property="og:type"               content="product" />
      <meta property="og:title"              content={`${title} | SIKA Ghana`} />
      <meta property="og:description"        content={description} />
      <meta property="og:image"             content={image} />
      <meta property="og:image:width"        content="1200" />
      <meta property="og:image:height"       content="630" />
      <meta property="og:url"                content={`${BASE_URL}${url}`} />
      <meta property="og:site_name"          content={SITE_NAME} />
      <meta property="product:price:amount"  content={listing.price} />
      <meta property="product:price:currency" content="GHS" />
      <meta property="product:condition"     content={listing.condition === 'new' ? 'new' : 'used'} />

      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@SIKAGhana" />
      <meta name="twitter:title"       content={`${title} | SIKA Ghana`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
    </Helmet>
  )
}

/* ── Browse / category page SEO ─────────────────────────────── */
export function BrowseSEO({ category, region, q, total = 0 }) {
  const catName  = category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null
  const cityName = region || null

  let title, description, url, keywords

  if (catName && cityName) {
    title       = `${catName} for Sale in ${cityName}, Ghana — ${total.toLocaleString()} Ads`
    description = `Browse ${total.toLocaleString()} ${catName} listings in ${cityName}, Ghana. New and used items from verified sellers. Best prices, fast replies. SIKA Ghana classifieds.`
    url         = `/browse?category=${category}&region=${encodeURIComponent(region)}`
    keywords    = `${catName} ${cityName}, buy ${catName} ${cityName}, ${catName} for sale ${cityName} Ghana, ${CATEGORY_KEYWORDS[category] || ''}`
  } else if (catName) {
    title       = `Buy ${catName} in Ghana — ${total.toLocaleString()} Ads | SIKA Ghana`
    description = `Find the best ${catName.toLowerCase()} deals in Ghana. ${total.toLocaleString()} listings from verified sellers in Accra, Kumasi, Takoradi and all regions. SIKA Ghana classifieds.`
    url         = `/browse?category=${category}`
    keywords    = `${catName} Ghana, buy ${catName} Ghana, ${catName} for sale, ${CATEGORY_KEYWORDS[category] || ''}`
  } else if (cityName) {
    title       = `Buy and Sell in ${cityName}, Ghana — SIKA Classifieds`
    description = `Browse listings in ${cityName}, Ghana. Cars, electronics, real estate, fashion, jobs and more from local sellers near you.`
    url         = `/browse?region=${encodeURIComponent(region)}`
    keywords    = `buy sell ${cityName} Ghana, classifieds ${cityName}, online marketplace ${cityName} Ghana`
  } else if (q) {
    title       = `"${q}" for Sale in Ghana — ${total.toLocaleString()} Results | SIKA Ghana`
    description = `${total.toLocaleString()} listings matching "${q}" in Ghana. New and used from verified sellers. Find the best deal on SIKA Ghana.`
    url         = `/browse?q=${encodeURIComponent(q)}`
    keywords    = `${q} for sale Ghana, buy ${q} Ghana, ${q} price Ghana`
  } else {
    title       = 'Browse All Listings in Ghana — Cars, Electronics, Real Estate & More | SIKA'
    description = DEFAULT_DESCRIPTION
    url         = '/browse'
    keywords    = 'buy and sell Ghana, Ghana classifieds, online marketplace Ghana, free ads Ghana'
  }

  // JSON-LD: ItemList
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    url: `${BASE_URL}${url}`,
    numberOfItems: total,
  }

  // JSON-LD: BreadcrumbList
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL }]
  if (catName) crumbs.push({ '@type': 'ListItem', position: 2, name: catName, item: `${BASE_URL}${url}` })
  if (cityName && catName) crumbs.push({ '@type': 'ListItem', position: 3, name: cityName, item: `${BASE_URL}${url}` })
  const breadcrumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs }

  // FAQ schema for high-traffic category pages (boosts rich snippets)
  const faqItems = catName ? buildCategoryFAQ(catName, cityName || 'Ghana') : null
  const faqSchema = faqItems ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  } : null

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={`${BASE_URL}${url}`} />
      <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />

      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={`${BASE_URL}${url}`} />
      <meta property="og:image"       content={DEFAULT_IMAGE} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name"   content={SITE_NAME} />

      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@SIKAGhana" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />

      <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
    </Helmet>
  )
}

function buildCategoryFAQ(category, location) {
  return [
    {
      '@type': 'Question',
      name: `Where can I buy ${category.toLowerCase()} in ${location}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `You can find ${category.toLowerCase()} listings from verified sellers in ${location} on SIKA Ghana. Browse hundreds of ads, compare prices and contact sellers directly.`,
      },
    },
    {
      '@type': 'Question',
      name: `Is it safe to buy ${category.toLowerCase()} on SIKA Ghana?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `SIKA Ghana verifies sellers with Ghana Card verification and shows trust scores including reviews, account age and response rate. Always meet in a public place and inspect items before payment.`,
      },
    },
    {
      '@type': 'Question',
      name: `How do I post a ${category.toLowerCase()} ad for free?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Posting an ad on SIKA Ghana is completely free. Create an account, click "Post Free Ad", fill in your listing details, upload photos and publish. Your ad will be live within minutes.`,
      },
    },
  ]
}
