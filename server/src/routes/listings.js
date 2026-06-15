const router = require('express').Router()
const { body, query, validationResult } = require('express-validator')
const prisma = require('../utils/prisma')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { pingIndexNow } = require('../utils/indexNow')
const { moderateListing } = require('../utils/listingModerator')
const { updateOneScore } = require('../utils/scoreEngine')
const Anthropic = require('@anthropic-ai/sdk')

const BASE_URL = process.env.SITE_URL || 'https://hoova.com.gh'

const LISTING_INCLUDE = {
  images: { orderBy: { order: 'asc' } },
  // phone intentionally excluded — use GET /:id/contact (auth required) to reveal
  seller: { select: { id: true, name: true, store_name: true, avatar: true, phone: true, phone_verified: true, id_verified: true, rating_avg: true, review_count: true, created_at: true } },
  category: { select: { id: true, name: true, slug: true } },
  location: true,
}

// Strip phone from a listing object before sending to non-auth or public endpoints
function publicListing(listing) {
  if (!listing) return listing
  const { seller, ...rest } = listing
  const { phone, ...sellerPublic } = seller || {}
  return { ...rest, seller: { ...sellerPublic, phone_exists: !!phone }, _phone: phone }
}

// GET /api/listings — browse with filters
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category, boost_tier, sort = 'relevance',
      min_price, max_price, condition, region, city, negotiable, limit = 24, page = 1,
      exclude, mine, verified_seller, seller_id, exclude_seller,
    } = req.query

    const where = { status: 'active' }

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } })
      if (cat) where.category_id = cat.id
    }

    if (boost_tier) where.boost_tier = boost_tier
    if (condition && condition !== 'any') where.condition = condition
    if (city) where.city = city
    else if (region) where.region = region
    if (negotiable === 'true') where.negotiable = true
    if (min_price) where.price = { ...(where.price || {}), gte: Number(min_price) }
    if (max_price) where.price = { ...(where.price || {}), lte: Number(max_price) }
    if (exclude) where.id = { not: exclude }
    if (verified_seller === 'true') where.seller = { id_verified: true }
    if (seller_id) where.user_id = seller_id
    if (exclude_seller) where.user_id = { not: exclude_seller }

    const orderBy = {
      relevance:  { score: 'desc' },
      newest:     { created_at: 'desc' },
      price_asc:  { price: 'asc' },
      price_desc: { price: 'desc' },
      popular:    { views_count: 'desc' },
    }[sort] || { score: 'desc' }

    const take = Math.min(Number(limit), 48)
    const skip = (Number(page) - 1) * take

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, include: LISTING_INCLUDE, orderBy, take, skip }),
      prisma.listing.count({ where }),
    ])

    // Attach is_saved for logged-in users
    let savedIds = new Set()
    if (req.userId) {
      const saves = await prisma.savedListing.findMany({
        where: { user_id: req.userId, listing_id: { in: listings.map((l) => l.id) } },
        select: { listing_id: true },
      })
      savedIds = new Set(saves.map((s) => s.listing_id))
    }

    const data = listings.map((l) => ({
      ...l,
      is_saved: savedIds.has(l.id),
      price_dropped: l.price_history?.length > 1,
    }))

    res.json({ success: true, data, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

// GET /api/listings/mine
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { user_id: req.user.id },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
      orderBy: { created_at: 'desc' },
    })
    res.json({ success: true, data: listings })
  } catch (err) { next(err) }
})

// GET /api/listings/saved
router.get('/saved', requireAuth, async (req, res, next) => {
  try {
    const saves = await prisma.savedListing.findMany({
      where: { user_id: req.user.id },
      include: { listing: { include: { images: { take: 1, orderBy: { order: 'asc' } }, seller: { select: { id: true, name: true } } } } },
      orderBy: { created_at: 'desc' },
    })
    res.json({ success: true, data: saves.map((s) => s.listing).filter(Boolean) })
  } catch (err) { next(err) }
})

// GET /api/listings/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { ...LISTING_INCLUDE, price_history: { orderBy: { changed_at: 'asc' }, take: 10 } },
    })
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' })

    // Deduplicated view tracking: user-based for logged-in, IP-based for guests (24h cooldown)
    ;(async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const alreadyViewed = await prisma.listingView.findFirst({
        where: {
          listing_id: listing.id,
          viewed_at: { gte: since },
          ...(req.userId ? { user_id: req.userId } : { ip: req.ip }),
        },
      })
      if (!alreadyViewed) {
        await prisma.listing.update({ where: { id: listing.id }, data: { views_count: { increment: 1 } } })
        await prisma.listingView.create({ data: { listing_id: listing.id, user_id: req.userId || null, ip: req.ip } })
      }
    })().catch(() => {})

    let is_saved = false
    if (req.userId) {
      const save = await prisma.savedListing.findUnique({ where: { user_id_listing_id: { user_id: req.userId, listing_id: listing.id } } })
      is_saved = !!save
    }

    // Fetch offers for this listing (scoped by role)
    let offers = []
    if (req.userId) {
      const isOwner = listing.user_id === req.userId
      offers = await prisma.offer.findMany({
        where: isOwner
          ? { listing_id: listing.id }
          : { listing_id: listing.id, buyer_id: req.userId },
        include: { buyer: { select: { id: true, name: true, avatar: true } } },
        orderBy: { created_at: 'desc' },
      })
    }

    const { _phone, ...pub } = publicListing({ ...listing, is_saved })
    res.json({ success: true, data: { ...pub, offers } })
  } catch (err) { next(err) }
})

// GET /api/listings/:id/contact — auth-only, returns seller phone
router.get('/:id/contact', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, seller: { select: { id: true, phone: true, phone_verified: true } } },
    })
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' })
    if (!listing.seller?.phone) return res.status(404).json({ success: false, message: 'Seller has no phone on file' })

    // Fire-and-forget contact reveal log
    prisma.listingView.create({
      data: { listing_id: listing.id, user_id: req.user.id, ip: req.ip },
    }).catch(() => {})

    res.json({ success: true, data: { phone: listing.seller.phone, phone_verified: listing.seller.phone_verified } })
  } catch (err) { next(err) }
})

// POST /api/listings/impressions — batch impression tracking (fire-and-forget from frontend)
router.post('/impressions', async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true })
  const validIds = ids.filter((id) => typeof id === 'string').slice(0, 50)
  prisma.listing.updateMany({
    where: { id: { in: validIds } },
    data: { impressions_count: { increment: 1 } },
  }).catch(() => {})
  res.json({ success: true })
})

const PLAN_LIMITS = { free: 5, pro: 50, business: -1 }

// POST /api/listings
router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 5, max: 100 }),
  body('price').isNumeric(),
  body('category_id').optional().isUUID(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg })

    // Enforce monthly listing quota — sold listings count toward the limit
    const tier = req.user.subscription_tier || 'free'
    const limit = PLAN_LIMITS[tier] ?? PLAN_LIMITS.free
    if (limit !== -1) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const monthCount = await prisma.listing.count({
        where: { user_id: req.user.id, created_at: { gte: startOfMonth } },
      })
      if (monthCount >= limit) {
        return res.status(403).json({
          success: false,
          message: `You've reached your ${limit}-listing limit for this month. Upgrade your plan to post more.`,
        })
      }
    }

    const { title, description, price, category_id, subcategory_id, condition, negotiable, region, city, area, images = [] } = req.body

    // Find or create location
    let location_id = null
    if (region || city) {
      let location = await prisma.location.findFirst({ where: { region: region || undefined, city: city || undefined, area: area || null } })
      if (!location) location = await prisma.location.create({ data: { region: region || 'Ghana', city: city || 'Unknown', area: area || null } })
      location_id = location.id
    }

    // Run moderation before saving
    const { is_flagged, flag_reasons, auto_approve_at } = await moderateListing({
      title,
      description,
      price: Number(price),
      category_slug: null, // resolved below if category exists
      images,
      user_id: req.user.id,
      created_at: req.user.created_at,
    })

    const listing = await prisma.listing.create({
      data: {
        user_id: req.user.id,
        title,
        description,
        price: Number(price),
        category_id: category_id || null,
        subcategory_id: subcategory_id || null,
        location_id,
        region,
        city,
        area,
        condition:      condition || 'used',
        negotiable:     negotiable === true || negotiable === 'true',
        status:         'pending',
        is_flagged,
        flag_reasons,
        auto_approve_at,
        images: {
          create: images.map((img, i) => ({
            url:        img.url,
            public_id:  img.public_id || null,
            order:      i,
            is_primary: i === 0,
          })),
        },
      },
      include: LISTING_INCLUDE,
    })

    // Record initial price
    await prisma.priceHistory.create({ data: { listing_id: listing.id, price: Number(price) } })

    // Update category listing count
    if (category_id) {
      prisma.category.update({ where: { id: category_id }, data: { listing_count: { increment: 1 } } }).catch(() => {})
    }

    // Notify seller that listing is under review
    prisma.notification.create({
      data: {
        user_id: req.user.id,
        type:    'system',
        title:   is_flagged ? 'Your listing is under review' : 'Listing submitted — pending approval',
        body:    is_flagged
          ? `"${title}" has been flagged for review. Our team will assess it shortly.`
          : `"${title}" is in the approval queue. It'll go live soon — usually within 30 minutes.`,
        data:    { listing_id: listing.id },
      },
    }).catch(() => {})

    // Only ping IndexNow once approved (not on pending)
    res.status(201).json({ success: true, data: listing })
  } catch (err) { next(err) }
})

// PATCH /api/listings/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } })
    if (!listing) return res.status(404).json({ success: false, message: 'Not found' })
    if (listing.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })

    const { title, description, price, condition, status, region, city, area } = req.body
    const updates = {}

    if (title) updates.title = title
    if (description !== undefined) updates.description = description
    if (condition) updates.condition = condition
    if (status) {
      if (listing.status === 'sold' && status === 'active') {
        return res.status(400).json({ success: false, message: 'Sold listings cannot be reactivated.' })
      }
      updates.status = status
    }
    if (region) updates.region = region
    if (city) updates.city = city
    if (area !== undefined) updates.area = area

    if (price !== undefined && Number(price) !== listing.price) {
      updates.price = Number(price)
      await prisma.priceHistory.create({ data: { listing_id: listing.id, price: Number(price) } })
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: updates,
      include: LISTING_INCLUDE,
    })

    // Recalculate score immediately when a listing goes active
    if (updates.status === 'active') updateOneScore(updated.id).catch(() => {})

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// DELETE /api/listings/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } })
    if (!listing) return res.status(404).json({ success: false, message: 'Not found' })
    if (listing.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })
    await prisma.listing.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/listings/:id/offers — buyer submits a price offer
router.post('/:id/offers', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { id: true, user_id: true, title: true, price: true, negotiable: true, status: true },
    })
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' })
    if (listing.status !== 'active') return res.status(400).json({ success: false, message: 'Listing is not active' })
    if (!listing.negotiable) return res.status(400).json({ success: false, message: 'This listing is not accepting offers' })
    if (listing.user_id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot make an offer on your own listing' })

    const num = Number(req.body.amount)
    if (!num || num <= 0) return res.status(400).json({ success: false, message: 'Enter a valid offer amount' })
    if (num > listing.price) return res.status(400).json({ success: false, message: 'Offer cannot exceed asking price' })

    const existing = await prisma.offer.findFirst({
      where: { listing_id: listing.id, buyer_id: req.user.id, status: 'pending' },
    })
    if (existing) return res.status(400).json({ success: false, message: 'You already have a pending offer on this listing' })

    const offer = await prisma.offer.create({
      data: {
        listing_id: listing.id,
        buyer_id:   req.user.id,
        amount:     num,
        message:    req.body.message?.trim() || null,
      },
      include: { buyer: { select: { id: true, name: true, avatar: true } } },
    })

    prisma.notification.create({
      data: {
        user_id: listing.user_id,
        type:    'offer',
        title:   'New offer received',
        body:    `${req.user.name} offered GHS ${num.toLocaleString()} on "${listing.title}"`,
        data:    { listing_id: listing.id, offer_id: offer.id },
      },
    }).catch(() => {})

    res.status(201).json({ success: true, data: offer })
  } catch (err) { next(err) }
})

// POST /api/listings/:id/save
router.post('/:id/save', requireAuth, async (req, res, next) => {
  try {
    await prisma.savedListing.upsert({
      where: { user_id_listing_id: { user_id: req.user.id, listing_id: req.params.id } },
      create: { user_id: req.user.id, listing_id: req.params.id },
      update: {},
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// DELETE /api/listings/:id/save
router.delete('/:id/save', requireAuth, async (req, res, next) => {
  try {
    await prisma.savedListing.deleteMany({ where: { user_id: req.user.id, listing_id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/listings/ai-assist — generate listing fields from plain-English description
router.post('/ai-assist', requireAuth, async (req, res, next) => {
  try {
    const { prompt } = req.body
    if (!prompt || String(prompt).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please describe your item' })
    }

    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `You are a marketplace listing assistant for HOOVA Ghana (hoovagh.com), a buy-and-sell marketplace in Ghana.

A seller described their item in plain English: "${String(prompt).trim().slice(0, 600)}"

Generate a marketplace listing optimised for search. Reply with ONLY valid JSON, no other text:
{
  "title": "specific descriptive title under 80 chars — include brand, model, key spec if known",
  "description": "3 short paragraphs: (1) what the item is and key features, (2) current condition and what is included, (3) reason for selling and any extras. Use plain English, Ghana context.",
  "price_suggestion": estimated fair market price in Ghana Cedis as a plain number,
  "category_slug": exactly one of: vehicles, phones-tablets, electronics, home-appliances, furniture, real-estate, fashion, health-beauty, babies-kids, building-construction, agriculture, services, jobs, sports, pets, food, adults, other,
  "condition": "new" or "used"
}`,
      }],
    })

    const text = message.content[0]?.text?.trim() || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return res.status(500).json({ success: false, message: 'AI could not generate listing — please fill in manually' })

    const data = JSON.parse(match[0])
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

module.exports = router
