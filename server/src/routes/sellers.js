const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { generateUniqueSlug } = require('../utils/slug')

// ── PATCH /api/sellers/me/store ─────────────────────────────────────
// Update store profile: store_name, bio (tagline), cover_banner, store_slug
router.patch('/me/store', requireAuth, async (req, res, next) => {
  try {
    const { store_name, bio, cover_banner, store_slug } = req.body
    const updates = {}

    if (store_name !== undefined) updates.store_name = store_name
    if (bio !== undefined) updates.bio = bio
    if (cover_banner !== undefined) updates.cover_banner = cover_banner

    if (store_slug !== undefined) {
      // Validate + ensure uniqueness (excluding self)
      const slug = store_slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60)

      if (!slug) return res.status(400).json({ success: false, message: 'Invalid slug' })

      const conflict = await prisma.user.findFirst({
        where: { store_slug: slug, NOT: { id: req.user.id } },
        select: { id: true },
      })
      if (conflict) return res.status(409).json({ success: false, message: 'That store URL is already taken' })

      updates.store_slug = slug
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true, name: true, store_name: true, store_slug: true,
        bio: true, avatar: true, cover_banner: true,
        subscription_tier: true, rating_avg: true, review_count: true,
      },
    })

    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})

// ── GET /api/sellers/me/stats ────────────────────────────────────────
// Detailed seller analytics: per-listing views, total saves, inquiries
router.get('/me/stats', requireAuth, async (req, res, next) => {
  try {
    const [totalViews, totalSaves, totalInquiries, listingCount, recentListings] = await Promise.all([
      prisma.listing.aggregate({
        where: { user_id: req.user.id },
        _sum: { views_count: true },
      }),
      prisma.savedListing.count({ where: { listing: { user_id: req.user.id } } }),
      prisma.conversation.count({ where: { seller_id: req.user.id } }),
      prisma.listing.count({ where: { user_id: req.user.id, status: 'active' } }),
      prisma.listing.findMany({
        where: { user_id: req.user.id },
        select: {
          id: true, title: true, views_count: true, status: true,
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
          _count: { select: { saves: true, conversations: true } },
        },
        orderBy: { views_count: 'desc' },
        take: 10,
      }),
    ])

    res.json({
      success: true,
      data: {
        total_views: totalViews._sum.views_count || 0,
        total_saves: totalSaves,
        total_inquiries: totalInquiries,
        active_listings: listingCount,
        top_listings: recentListings.map((l) => ({
          id: l.id,
          title: l.title,
          status: l.status,
          views: l.views_count,
          saves: l._count.saves,
          inquiries: l._count.conversations,
          image: l.images[0]?.url || null,
        })),
      },
    })
  } catch (err) { next(err) }
})

// ── GET /api/sellers/:id/reviews ─────────────────────────────────────
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(20, parseInt(req.query.limit) || 10)
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { seller_id: req.params.id },
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { seller_id: req.params.id } }),
    ])

    // Rating breakdown (1-5 stars)
    const breakdown = await prisma.review.groupBy({
      by: ['rating'],
      where: { seller_id: req.params.id },
      _count: { rating: true },
    })

    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    breakdown.forEach((b) => { ratingMap[b.rating] = b._count.rating })

    res.json({
      success: true,
      data: {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        rating_breakdown: ratingMap,
      },
    })
  } catch (err) { next(err) }
})

// ── POST /api/sellers/:id/review ─────────────────────────────────────
// Must be authenticated; can't review yourself; one review per conversation
router.post('/:id/review', requireAuth, async (req, res, next) => {
  try {
    const sellerId = req.params.id
    if (sellerId === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't review yourself" })
    }

    const { rating, comment, listing_id } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
    }

    // Check reviewer had a conversation with this seller (optional listing_id)
    const convoWhere = listing_id
      ? { buyer_id: req.user.id, seller_id: sellerId, listing_id }
      : { buyer_id: req.user.id, seller_id: sellerId }

    const hadConvo = await prisma.conversation.findFirst({ where: convoWhere, select: { id: true } })
    if (!hadConvo) {
      return res.status(403).json({ success: false, message: 'You can only review sellers you have messaged' })
    }

    // One review per buyer-seller pair — update if exists, create if not
    const existing = await prisma.review.findFirst({
      where: { reviewer_id: req.user.id, seller_id: sellerId },
    })

    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating: parseInt(rating), comment: comment?.trim() || null },
        })
      : await prisma.review.create({
          data: {
            reviewer_id: req.user.id,
            seller_id: sellerId,
            listing_id: listing_id || null,
            rating: parseInt(rating),
            comment: comment?.trim() || null,
          },
        })

    // Recalculate seller's rating_avg + review_count
    const agg = await prisma.review.aggregate({
      where: { seller_id: sellerId },
      _avg: { rating: true },
      _count: { rating: true },
    })
    await prisma.user.update({
      where: { id: sellerId },
      data: {
        rating_avg: parseFloat((agg._avg.rating || 0).toFixed(2)),
        review_count: agg._count.rating,
      },
    })

    res.status(201).json({ success: true, data: review })
  } catch (err) { next(err) }
})

module.exports = router
