const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

// GET /api/users/me/analytics
router.get('/me/analytics', requireAuth, async (req, res, next) => {
  try {
    const [activeListings, totalViews, totalSaves, totalInquiries] = await Promise.all([
      prisma.listing.count({ where: { user_id: req.user.id, status: 'active' } }),
      prisma.listing.aggregate({ where: { user_id: req.user.id }, _sum: { views_count: true } }),
      prisma.savedListing.count({ where: { listing: { user_id: req.user.id } } }),
      prisma.conversation.count({ where: { seller_id: req.user.id } }),
    ])

    res.json({
      success: true,
      data: {
        active_listings: activeListings,
        total_views: totalViews._sum.views_count || 0,
        total_saves: totalSaves,
        total_inquiries: totalInquiries,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/users/store/:slug — look up seller by store_slug
router.get('/store/:slug', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { store_slug: req.params.slug }, select: { id: true } })
    if (!user) return res.status(404).json({ success: false, message: 'Store not found' })
    // Delegate to the existing /:id handler logic by forwarding the id
    req.params.id = user.id
    next()
  } catch (err) { next(err) }
})

// GET /api/users/:id — public seller profile + paginated listings
router.get('/:id', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(24, parseInt(req.query.limit) || 12)
    const skip = (page - 1) * limit

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, store_name: true, store_slug: true,
        avatar: true, cover_banner: true, bio: true,
        id_verified: true, phone_verified: true, subscription_tier: true,
        rating_avg: true, review_count: true, created_at: true,
      },
    })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const [listings, total, reviews] = await Promise.all([
      prisma.listing.findMany({
        where: { user_id: req.params.id, status: 'active' },
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          location: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where: { user_id: req.params.id, status: 'active' } }),
      prisma.review.findMany({
        where: { seller_id: req.params.id },
        include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
    ])

    res.json({
      success: true,
      data: {
        ...user,
        listings: listings.map((l) => ({
          ...l,
          seller: { id: user.id, name: user.name, avatar: user.avatar, id_verified: user.id_verified, rating_avg: user.rating_avg, review_count: user.review_count, created_at: user.created_at },
        })),
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) { next(err) }
})

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body
    const updates = {}
    if (name) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (avatar) updates.avatar = avatar

    const user = await prisma.user.update({ where: { id: req.user.id }, data: updates })
    res.json({
      success: true,
      data: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        avatar: user.avatar, bio: user.bio, store_slug: user.store_slug,
        store_name: user.store_name, subscription_tier: user.subscription_tier,
      },
    })
  } catch (err) { next(err) }
})

module.exports = router
