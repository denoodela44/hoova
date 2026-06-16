import { Helmet } from 'react-helmet-async'

export const SITE_NAME = 'HOOVA Ghana'
export const BASE_URL  = 'https://hoova.com.gh'
export const DEFAULT_IMAGE = `${BASE_URL}/og-default.jpg`
export const DEFAULT_DESCRIPTION =
  "Ghana's #1 classifieds marketplace. Buy and sell cars, phones, houses, fashion, jobs and more from verified sellers across all 16 regions. Post your free ad today on HOOVA Ghana."

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
  const fullTitle    = title ? `${title} | HOOVA Ghana` : 'HOOVA Ghana — Buy and Sell Anything in Ghana'
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
      <meta name="twitter:site"        content="@HoovaGhana" />
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
  const description = `${condition} ${listing.title} for sale in ${city}${region ? ', ' + region : ''}, Ghana. Price: ${price}. ${(listing.description || '').slice(0, 120).trim()}. Contact seller on HOOVA Ghana classifieds.`
  const keywords = [
    listing.title,
    `${listing.title} for sale`,
    `${listing.title} ${city}`,
    `${listing.title} Ghana`,
    `buy ${listing.title} Ghana`,
    category,
    `${category} ${city}`,
    'HOOVA Ghana',
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
        ...(listing.seller?.id_verified ? { identifier: 'Verified Seller' } : {}),
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the price of ${listing.title} in ${city}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The listed price for ${listing.title} in ${city}, Ghana is ${price}. The seller ${listing.negotiable ? 'is open to negotiation on price' : 'has set a fixed price'}. Contact the seller directly on HOOVA Ghana for more details.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where can I buy ${listing.title} in Ghana?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can buy ${listing.title} in ${city}${region ? ', ' + region : ''}, Ghana. This listing is available on HOOVA Ghana classifieds — browse the listing, check seller reviews and contact them directly through the platform.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is it safe to buy ${listing.title} on HOOVA Ghana?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `HOOVA Ghana verifies sellers using ID verification and displays trust signals including ratings, reviews, account age and response rate. Always inspect items before paying and prefer meeting in a safe public place in ${city}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What should I check before buying ${listing.condition === 'used' ? 'a used' : 'a new'} ${listing.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Before buying ${listing.title}, verify the item matches the listing photos, check for damage or defects, confirm the price, and ask the seller for any receipts or warranty documentation. ${listing.condition === 'used' ? 'For used items, test all functions thoroughly before payment.' : 'For new items, ensure original sealed packaging is intact.'}`,
        },
      },
    ],
  }

  return (
    <Helmet>
      <title>{title} | HOOVA Ghana</title>
      <meta name="description"   content={description} />
      <meta name="keywords"      content={keywords} />
      <link rel="canonical"      href={`${BASE_URL}${url}`} />
      <meta name="robots"        content="index,follow,max-snippet:-1,max-image-preview:large" />

      <meta property="og:type"               content="product" />
      <meta property="og:title"              content={`${title} | HOOVA Ghana`} />
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
      <meta name="twitter:site"        content="@HoovaGhana" />
      <meta name="twitter:title"       content={`${title} | HOOVA Ghana`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
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
    description = `Browse ${total.toLocaleString()} ${catName} listings in ${cityName}, Ghana. New and used items from verified sellers. Best prices, fast replies. HOOVA Ghana classifieds.`
    url         = `/browse?category=${category}&region=${encodeURIComponent(region)}`
    keywords    = `${catName} ${cityName}, buy ${catName} ${cityName}, ${catName} for sale ${cityName} Ghana, ${CATEGORY_KEYWORDS[category] || ''}`
  } else if (catName) {
    title       = `Buy ${catName} in Ghana — ${total.toLocaleString()} Ads | HOOVA Ghana`
    description = `Find the best ${catName.toLowerCase()} deals in Ghana. ${total.toLocaleString()} listings from verified sellers in Accra, Kumasi, Takoradi and all regions. HOOVA Ghana classifieds.`
    url         = `/browse?category=${category}`
    keywords    = `${catName} Ghana, buy ${catName} Ghana, ${catName} for sale, ${CATEGORY_KEYWORDS[category] || ''}`
  } else if (cityName) {
    title       = `Buy and Sell in ${cityName}, Ghana — HOOVA Classifieds`
    description = `Browse listings in ${cityName}, Ghana. Cars, electronics, real estate, fashion, jobs and more from local sellers near you.`
    url         = `/browse?region=${encodeURIComponent(region)}`
    keywords    = `buy sell ${cityName} Ghana, classifieds ${cityName}, online marketplace ${cityName} Ghana`
  } else if (q) {
    title       = `"${q}" for Sale in Ghana — ${total.toLocaleString()} Results | HOOVA Ghana`
    description = `${total.toLocaleString()} listings matching "${q}" in Ghana. New and used from verified sellers. Find the best deal on HOOVA Ghana.`
    url         = `/browse?q=${encodeURIComponent(q)}`
    keywords    = `${q} for sale Ghana, buy ${q} Ghana, ${q} price Ghana`
  } else {
    title       = 'Browse All Listings in Ghana — Cars, Electronics, Real Estate & More | HOOVA'
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
      <meta name="twitter:site"        content="@HoovaGhana" />
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
        text: `You can find ${category.toLowerCase()} listings from verified sellers in ${location} on HOOVA Ghana. Browse hundreds of ads, compare prices and contact sellers directly.`,
      },
    },
    {
      '@type': 'Question',
      name: `Is it safe to buy ${category.toLowerCase()} on HOOVA Ghana?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `HOOVA Ghana verifies sellers with ID verification and shows trust scores including reviews, account age and response rate. Always meet in a public place and inspect items before payment.`,
      },
    },
    {
      '@type': 'Question',
      name: `How do I post a ${category.toLowerCase()} ad for free?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Posting an ad on HOOVA Ghana is completely free. Create an account, click "Post Free Ad", fill in your listing details, upload photos and publish. Your ad will be live within minutes.`,
      },
    },
  ]
}

/* ── Home page structured data ───────────────────────────────── */
export function HomeSEO() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HOOVA Ghana',
    alternateName: 'Hoova',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/browse?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HOOVA Ghana',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'Ghana' },
    sameAs: [
      'https://www.facebook.com/hoovaghana',
      'https://www.instagram.com/hoovaghana',
      'https://twitter.com/HoovaGhana',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      areaServed: 'GH',
      availableLanguage: 'English',
    },
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'HOOVA Ghana Classifieds',
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    priceRange: 'Free',
    areaServed: { '@type': 'Country', name: 'Ghana' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      addressCountry: 'GH',
    },
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
    </Helmet>
  )
}
