/**
 * Dynamic rendering for search-engine crawlers.
 *
 * Google recommends this pattern for JS SPAs: when a bot visits, serve a
 * lightweight HTML shell with all meta/LD+JSON already in <head>.  The bot
 * indexes it instantly (no JS execution needed).  Real users still get the
 * normal React SPA — no change to their experience.
 *
 * Covered routes:
 *   /listing/:id   → Product + Offer + BreadcrumbList schema
 *   /seller/:id    → Person + ItemList schema
 *   /buy/:cat/:city → ItemList + BreadcrumbList schema (already static via sitemap)
 *   everything else → site-level defaults
 */

const prisma = require('../utils/prisma')

const BASE_URL = process.env.SITE_URL || 'https://hoova.com.gh'

const BOT_RE = /googlebot|google-inspectiontool|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|embedly|pinterest/i

function escape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shell({ title, description, canonical, image, ldJson = [] }) {
  const ld = ldJson.map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`).join('\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}"/>
  <link rel="canonical" href="${escape(canonical)}"/>
  <meta property="og:title" content="${escape(title)}"/>
  <meta property="og:description" content="${escape(description)}"/>
  <meta property="og:url" content="${escape(canonical)}"/>
  <meta property="og:type" content="website"/>
  ${image ? `<meta property="og:image" content="${escape(image)}"/>` : ''}
  <meta name="robots" content="index,follow"/>
  ${ld}
</head>
<body>
  <h1>${escape(title)}</h1>
  <p>${escape(description)}</p>
</body>
</html>`
}

async function renderListing(id) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      seller: { select: { id: true, name: true, rating_avg: true, review_count: true } },
      category: true,
      location: true,
    },
  })
  if (!listing) return null

  const title = `${listing.title} — GHS ${Number(listing.price).toLocaleString()} | HOOVA Ghana`
  const description = `${listing.title} for sale in ${listing.location?.city || 'Ghana'}. Price: GHS ${Number(listing.price).toLocaleString()}. ${(listing.description || '').slice(0, 120)}`
  const image = listing.images?.[0]?.url || null
  const url = `${BASE_URL}/listing/${listing.id}`

  const ldJson = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing.title,
      description: listing.description || '',
      image: image ? [image] : [],
      url,
      offers: {
        '@type': 'Offer',
        price: Number(listing.price),
        priceCurrency: 'GHS',
        availability: 'https://schema.org/InStock',
        url,
        seller: {
          '@type': 'Person',
          name: listing.seller?.name || 'HOOVA Seller',
          url: `${BASE_URL}/seller/${listing.seller?.id}`,
        },
      },
      ...(listing.seller?.rating_avg > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(listing.seller.rating_avg).toFixed(1),
          reviewCount: listing.seller.review_count || 1,
        },
      } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: listing.category?.name || 'Browse', item: `${BASE_URL}/browse?category=${listing.category?.slug}` },
        { '@type': 'ListItem', position: 3, name: listing.title, item: url },
      ],
    },
  ]

  return shell({ title, description, canonical: url, image, ldJson })
}

async function renderSeller(id) {
  const seller = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, avatar: true, bio: true, rating_avg: true, review_count: true, id_verified: true, created_at: true },
  })
  if (!seller) return null

  const listings = await prisma.listing.findMany({
    where: { user_id: id, status: 'active' },
    select: { id: true, title: true, price: true },
    orderBy: { created_at: 'desc' },
    take: 10,
  })

  const url = `${BASE_URL}/seller/${id}`
  const title = `${seller.name}'s Store on HOOVA Ghana — ${listings.length} Active Listings`
  const description = seller.bio
    ? `${seller.bio.slice(0, 150)} — Browse all listings from ${seller.name} on HOOVA Ghana.`
    : `Browse all ${listings.length} listings from ${seller.name} on HOOVA Ghana. Verified seller with ${seller.review_count || 0} reviews.`

  const ldJson = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: seller.name,
      url,
      image: seller.avatar || undefined,
      description: seller.bio || undefined,
      ...(seller.rating_avg > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(seller.rating_avg).toFixed(1),
          reviewCount: seller.review_count || 1,
        },
      } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Listings by ${seller.name}`,
      url,
      numberOfItems: listings.length,
      itemListElement: listings.map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}/listing/${l.id}`,
        name: l.title,
      })),
    },
  ]

  return shell({ title, description, canonical: url, image: seller.avatar, ldJson })
}

module.exports = async function botRenderer(req, res, next) {
  if (!BOT_RE.test(req.headers['user-agent'] || '')) return next()

  try {
    const listingMatch = req.path.match(/^\/listing\/([^/]+)$/)
    const sellerMatch = req.path.match(/^\/seller\/([^/]+)$/)

    let html = null

    if (listingMatch) html = await renderListing(listingMatch[1])
    else if (sellerMatch) html = await renderSeller(sellerMatch[1])

    if (!html) {
      // Generic fallback for all other routes bots may hit
      html = shell({
        title: 'HOOVA Ghana — Buy and Sell Anything in Ghana',
        description: 'Ghana\'s fastest-growing classifieds marketplace. Find cars, electronics, real estate, fashion and more from verified local sellers.',
        canonical: `${BASE_URL}${req.path}`,
        ldJson: [],
      })
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Robots-Tag', 'index, follow')
    return res.send(html)
  } catch (err) {
    next(err)
  }
}
