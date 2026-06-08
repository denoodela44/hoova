const router = require('express').Router()
const prisma = require('../utils/prisma')

const BASE_URL    = process.env.SITE_URL     || 'https://sika.com.gh'
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || ''

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti',
]

const CATEGORIES = [
  'vehicles', 'electronics', 'real-estate', 'fashion', 'jobs',
  'services', 'furniture', 'agriculture', 'sports', 'health',
  'pets', 'food', 'other',
]

// Pre-computed high-value keyword landing pages
const SEO_LANDING_PAGES = [
  // Category + Ghana
  ...CATEGORIES.map((c) => ({ path: `/browse?category=${c}`, priority: '0.8', changefreq: 'hourly' })),
  // Category + top cities
  ...['accra', 'kumasi', 'takoradi', 'tema', 'tamale', 'cape-coast'].flatMap((city) =>
    CATEGORIES.map((c) => ({ path: `/buy/${c}/${city}`, priority: '0.7', changefreq: 'daily' }))
  ),
  // Region browse
  ...GHANA_REGIONS.map((r) => ({ path: `/browse?region=${encodeURIComponent(r)}`, priority: '0.6', changefreq: 'daily' })),
]

function xmlEscape(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function urlEntry({ loc, lastmod, changefreq = 'weekly', priority = '0.5', images = [] }) {
  const imageXml = images.slice(0, 5).map((img) => `    <image:image>
      <image:loc>${xmlEscape(img.url)}</image:loc>
      ${img.title ? `<image:title>${xmlEscape(img.title)}</image:title>` : ''}
    </image:image>`).join('\n')

  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${imageXml}
  </url>`
}

// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    res.header('Content-Type', 'application/xml')
    res.header('Cache-Control', 'public, max-age=3600')

    const today = new Date().toISOString().split('T')[0]

    // Fetch active listings and active sellers in parallel
    let listings = []
    let sellers = []
    try {
      ;[listings, sellers] = await Promise.all([
        prisma.listing.findMany({
          where: { status: 'active' },
          select: {
            id: true,
            title: true,
            updated_at: true,
            images: { select: { url: true }, take: 3, orderBy: { order: 'asc' } },
          },
          orderBy: { updated_at: 'desc' },
          take: 50000,
        }),
        prisma.user.findMany({
          where: { listings: { some: { status: 'active' } } },
          select: { id: true, store_slug: true, updated_at: true },
          take: 10000,
        }),
      ])
    } catch (_) {}

    const staticPages = [
      { loc: BASE_URL, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/browse`, lastmod: today, changefreq: 'hourly', priority: '0.9' },
      { loc: `${BASE_URL}/post`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/about`, lastmod: today, changefreq: 'monthly', priority: '0.4' },
      { loc: `${BASE_URL}/safety`, lastmod: today, changefreq: 'monthly', priority: '0.3' },
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages.map(urlEntry).join('\n')}
${SEO_LANDING_PAGES.map((p) => urlEntry({ loc: `${BASE_URL}${p.path}`, lastmod: today, changefreq: p.changefreq, priority: p.priority })).join('\n')}
${sellers.map((s) => urlEntry({
      loc: s.store_slug ? `${BASE_URL}/store/${s.store_slug}` : `${BASE_URL}/seller/${s.id}`,
      lastmod: s.updated_at ? s.updated_at.toISOString().split('T')[0] : today,
      changefreq: 'weekly',
      priority: '0.6',
    })).join('\n')}
${listings.map((l) => urlEntry({
      loc: `${BASE_URL}/listing/${l.id}`,
      lastmod: l.updated_at.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
      images: (l.images || []).map((img) => ({ url: img.url, title: l.title })),
    })).join('\n')}
</urlset>`

    res.send(xml)
  } catch (err) { next(err) }
})

// GET /{key}.txt — IndexNow key verification file
// IndexNow requires a text file at /{key}.txt containing just the key
router.get('/:key.txt', (req, res, next) => {
  if (!INDEXNOW_KEY || req.params.key !== INDEXNOW_KEY) return next()
  res.setHeader('Content-Type', 'text/plain')
  res.send(INDEXNOW_KEY)
})

// GET /robots.txt
router.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain')
  res.send(`User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /messages
Disallow: /notifications
Disallow: /admin
Disallow: /api/
Disallow: /post

# Crawl-delay for bots that respect it
Crawl-delay: 1

Sitemap: ${BASE_URL}/sitemap.xml
`)
})

module.exports = router
