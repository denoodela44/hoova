const router = require('express').Router()
const prisma = require('../utils/prisma')
const jwt = require('jsonwebtoken')
const { requireAdminToken, ADMIN_JWT_SECRET } = require('../middleware/auth')
const { moderateListing } = require('../utils/listingModerator')

// POST /api/admin/login — standalone admin login
router.post('/login', (req, res) => {
  const { email, password, accessKey } = req.body
  const adminAccessKey = process.env.ADMIN_ACCESS_KEY
  const adminEmail     = process.env.ADMIN_EMAIL
  const adminPassword  = process.env.ADMIN_PASSWORD

  if (!adminAccessKey || !adminEmail || !adminPassword) {
    return res.status(500).json({ success: false, message: 'Admin credentials not configured' })
  }

  // Wrong access key → 404, not 401 (don't reveal admin exists)
  if (accessKey !== adminAccessKey) {
    return res.status(404).json({ success: false, message: 'Not found' })
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const token = jwt.sign({ role: 'admin', email }, ADMIN_JWT_SECRET, { expiresIn: '12h' })
  res.json({ success: true, data: { token, email } })
})

router.use(requireAdminToken)

// ══════════════════════════════════════════════════════════════════
//  LISTINGS
// ══════════════════════════════════════════════════════════════════

// GET /api/admin/listings
router.get('/listings', async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1)
    const limit   = Math.min(50, parseInt(req.query.limit) || 20)
    const skip    = (page - 1) * limit
    const { status, category, q, sort } = req.query

    const where = {}
    if (status)   where.status = status
    if (category) where.category = { slug: category }
    if (q) {
      where.OR = [
        { title:           { contains: q, mode: 'insensitive' } },
        { seller: { name: { contains: q, mode: 'insensitive' } } },
        { seller: { email:{ contains: q, mode: 'insensitive' } } },
      ]
    }

    const ORDER = {
      newest:     { created_at: 'desc' },
      oldest:     { created_at: 'asc' },
      views_desc: { views_count: 'desc' },
      price_desc: { price: 'desc' },
      price_asc:  { price: 'asc' },
    }
    const orderBy = ORDER[sort] || ORDER.newest

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller:   { select: { id: true, name: true, email: true, avatar: true, subscription_tier: true } },
          category: { select: { id: true, name: true, slug: true } },
          images:   { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
          _count:   { select: { saves: true, conversations: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ])

    // Summary stats (ignoring filters for totals)
    const [totalCount, activeCount, pendingCount, soldCount] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.listing.count({ where: { status: 'pending' } }),
      prisma.listing.count({ where: { status: 'sold' } }),
    ])

    res.json({
      success: true,
      data: {
        listings: listings.map((l) => ({
          id:           l.id,
          title:        l.title,
          price:        l.price,
          currency:     l.currency,
          status:       l.status,
          boost_tier:   l.boost_tier,
          views_count:  l.views_count,
          saves:        l._count.saves,
          inquiries:    l._count.conversations,
          created_at:   l.created_at,
          image:        l.images[0]?.url || null,
          category:     l.category,
          seller:       l.seller,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: { total: totalCount, active: activeCount, pending: pendingCount, sold: soldCount },
      },
    })
  } catch (err) { next(err) }
})

// PATCH /api/admin/listings/:id
router.patch('/listings/:id', async (req, res, next) => {
  try {
    const { status, boost_tier } = req.body
    const data = {}
    if (status)     data.status     = status
    if (boost_tier !== undefined) data.boost_tier = boost_tier || null

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data,
      select: { id: true, status: true, boost_tier: true },
    })
    res.json({ success: true, data: listing })
  } catch (err) { next(err) }
})

// DELETE /api/admin/listings/:id
router.delete('/listings/:id', async (req, res, next) => {
  try {
    await prisma.listing.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════════════════
//  MODERATION
// ══════════════════════════════════════════════════════════════════

const MOD_INCLUDE = {
  seller:   { select: { id: true, name: true, email: true, avatar: true, subscription_tier: true, created_at: true, review_count: true } },
  category: { select: { id: true, name: true, slug: true } },
  images:   { take: 3, orderBy: { order: 'asc' }, select: { url: true } },
}

// GET /api/admin/moderation/counts — badge numbers for sidebar
router.get('/moderation/counts', async (_req, res, next) => {
  try {
    const [pending, flagged, soft_live] = await Promise.all([
      prisma.listing.count({ where: { status: 'pending', is_flagged: false } }),
      prisma.listing.count({ where: { is_flagged: true } }),
      prisma.listing.count({ where: { status: 'soft_live' } }),
    ])
    res.json({ success: true, data: { pending, flagged, soft_live } })
  } catch (err) { next(err) }
})

// GET /api/admin/moderation/pending
router.get('/moderation/pending', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where:   { status: 'pending', is_flagged: false },
        include: MOD_INCLUDE,
        orderBy: { created_at: 'asc' }, // oldest first
        skip, take: limit,
      }),
      prisma.listing.count({ where: { status: 'pending', is_flagged: false } }),
    ])

    res.json({ success: true, data: { listings, total, page, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

// GET /api/admin/moderation/flagged
router.get('/moderation/flagged', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit
    const { severity } = req.query

    const listings = await prisma.listing.findMany({
      where:   { is_flagged: true, status: { not: 'rejected' } },
      include: MOD_INCLUDE,
      orderBy: { created_at: 'desc' },
      skip, take: limit,
    })

    // Filter by severity in JS (flag_reasons is JSON)
    const filtered = severity
      ? listings.filter((l) =>
          Array.isArray(l.flag_reasons) &&
          l.flag_reasons.some((f) => f.severity === severity)
        )
      : listings

    const total = await prisma.listing.count({ where: { is_flagged: true, status: { not: 'rejected' } } })

    res.json({ success: true, data: { listings: filtered, total, page, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

// GET /api/admin/moderation/soft-live
router.get('/moderation/soft-live', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where:   { status: 'soft_live' },
        include: MOD_INCLUDE,
        orderBy: { auto_approve_at: 'asc' },
        skip, take: limit,
      }),
      prisma.listing.count({ where: { status: 'soft_live' } }),
    ])

    res.json({ success: true, data: { listings, total, page, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

// POST /api/admin/moderation/:id/approve — promote to active
router.post('/moderation/:id/approve', async (req, res, next) => {
  try {
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data:  {
        status:      'active',
        is_flagged:  false,
        reviewed_at: new Date(),
      },
      select: { id: true, title: true, user_id: true },
    })

    // Notify seller
    await prisma.notification.create({
      data: {
        user_id: listing.user_id,
        type:    'system',
        title:   'Listing approved!',
        body:    `"${listing.title}" has been approved and is now fully live on HOOVA.`,
        data:    { listing_id: listing.id, status: 'active' },
      },
    })

    // Now safe to ping IndexNow
    const { pingIndexNow } = require('../utils/indexNow')
    const BASE_URL = process.env.SITE_URL || 'https://hoova.com.gh'
    pingIndexNow(`${BASE_URL}/listing/${listing.id}`)

    res.json({ success: true, data: listing })
  } catch (err) { next(err) }
})

// POST /api/admin/moderation/:id/reject — reject with a reason
router.post('/moderation/:id/reject', async (req, res, next) => {
  try {
    const { reason = 'Your listing did not meet our community guidelines.' } = req.body

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data:  {
        status:      'rejected',
        flag_note:   reason,
        reviewed_at: new Date(),
      },
      select: { id: true, title: true, user_id: true },
    })

    await prisma.notification.create({
      data: {
        user_id: listing.user_id,
        type:    'system',
        title:   'Listing not approved',
        body:    `"${listing.title}" was not approved. Reason: ${reason}`,
        data:    { listing_id: listing.id, status: 'rejected' },
      },
    })

    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/admin/moderation/:id/unflag — clear flags and put back in pending
router.post('/moderation/:id/unflag', async (req, res, next) => {
  try {
    await prisma.listing.update({
      where: { id: req.params.id },
      data:  { is_flagged: false, flag_reasons: null, status: 'pending' },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/admin/moderation/bulk-approve — approve multiple at once
router.post('/moderation/bulk-approve', async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'ids array required' })
    }

    await prisma.listing.updateMany({
      where: { id: { in: ids }, status: { in: ['pending', 'soft_live'] } },
      data:  { status: 'active', is_flagged: false, reviewed_at: new Date() },
    })

    // Notify sellers in batch
    const approved = await prisma.listing.findMany({
      where:  { id: { in: ids } },
      select: { id: true, title: true, user_id: true },
    })
    await Promise.all(
      approved.map((l) =>
        prisma.notification.create({
          data: {
            user_id: l.user_id,
            type:    'system',
            title:   'Listing approved!',
            body:    `"${l.title}" is now fully live on HOOVA.`,
            data:    { listing_id: l.id, status: 'active' },
          },
        })
      )
    )

    res.json({ success: true, approved: ids.length })
  } catch (err) { next(err) }
})

// POST /api/admin/moderation/:id/rescan — re-run flagging rules on a listing
router.post('/moderation/:id/rescan', async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where:   { id: req.params.id },
      include: { images: { select: { url: true } }, seller: { select: { created_at: true } } },
    })
    if (!listing) return res.status(404).json({ success: false, message: 'Not found' })

    const { is_flagged, flag_reasons } = await moderateListing({
      title:         listing.title,
      description:   listing.description,
      price:         listing.price,
      category_slug: null,
      images:        listing.images,
      user_id:       listing.user_id,
      created_at:    listing.seller?.created_at,
    })

    await prisma.listing.update({
      where: { id: req.params.id },
      data:  { is_flagged, flag_reasons: is_flagged ? flag_reasons : null },
    })

    res.json({ success: true, data: { is_flagged, flag_reasons } })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit
    const { tier, verified, q } = req.query

    const where = {}
    if (tier)     where.subscription_tier = tier
    if (verified === 'true')  where.id_verified = true
    if (verified === 'false') where.id_verified = false
    if (q) {
      where.OR = [
        { name:  { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true,
          avatar: true, subscription_tier: true,
          id_verified: true, email_verified: true, phone_verified: true,
          rating_avg: true, review_count: true, created_at: true,
          store_slug: true, store_name: true,
          _count: { select: { listings: true, reviews_received: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const [totalCount, verifiedCount, proCount, newToday] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { id_verified: true } }),
      prisma.user.count({ where: { subscription_tier: { in: ['pro', 'business'] } } }),
      prisma.user.count({ where: { created_at: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    ])

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          listing_count: u._count.listings,
          review_count:  u._count.reviews_received,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: { total: totalCount, verified: verifiedCount, pro_plus: proCount, new_today: newToday },
      },
    })
  } catch (err) { next(err) }
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    // Prevent demoting or promoting the requesting admin to/from admin via this route
    const { subscription_tier, id_verified, email_verified, phone_verified } = req.body
    const data = {}
    if (subscription_tier && subscription_tier !== 'admin') data.subscription_tier = subscription_tier
    if (id_verified    !== undefined) data.id_verified    = Boolean(id_verified)
    if (email_verified !== undefined) data.email_verified = Boolean(email_verified)
    if (phone_verified !== undefined) data.phone_verified = Boolean(phone_verified)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, subscription_tier: true, id_verified: true, email_verified: true },
    })
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})

// DELETE /api/admin/users/:id  (can't delete yourself)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { email: true } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (user.email === req.adminEmail) {
      return res.status(400).json({ success: false, message: "Can't delete the admin account" })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════════════════
//  INTELLIGENCE
// ══════════════════════════════════════════════════════════════════

// GET /api/admin/intelligence
router.get('/intelligence', async (req, res, next) => {
  try {
    const [
      topSellers,
      tierBreakdown,
      categoryPerformance,
      recentSubscriptions,
      upsellTargets,
    ] = await Promise.all([

      // Top sellers by listing views
      prisma.user.findMany({
        where: { listings: { some: {} } },
        select: {
          id: true, name: true, avatar: true, store_slug: true,
          subscription_tier: true, rating_avg: true, review_count: true,
          id_verified: true, created_at: true,
          _count: { select: { listings: true } },
          listings: {
            select: { views_count: true, status: true },
          },
        },
        orderBy: { review_count: 'desc' },
        take: 20,
      }),

      // Users per subscription tier
      prisma.user.groupBy({
        by: ['subscription_tier'],
        _count: { subscription_tier: true },
      }),

      // Top categories by active listing count
      prisma.category.findMany({
        where: { listings: { some: { status: 'active' } } },
        select: {
          id: true, name: true, slug: true,
          _count: { select: { listings: true } },
        },
        orderBy: { listing_count: 'desc' },
        take: 10,
      }),

      // Recent paid subscriptions
      prisma.subscription.findMany({
        where: { active: true, plan: { not: 'free' } },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),

      // Free users with high listing activity (upgrade targets)
      prisma.user.findMany({
        where: { subscription_tier: 'free' },
        select: {
          id: true, name: true, email: true, avatar: true, created_at: true,
          _count: { select: { listings: true } },
        },
        orderBy: { listings: { _count: 'desc' } },
        take: 10,
      }),
    ])

    // Compute total views per seller
    const enrichedSellers = topSellers.map((u) => ({
      id:                u.id,
      name:              u.name,
      avatar:            u.avatar,
      store_slug:        u.store_slug,
      subscription_tier: u.subscription_tier,
      rating_avg:        u.rating_avg,
      review_count:      u.review_count,
      id_verified:       u.id_verified,
      listing_count:     u._count.listings,
      active_listings:   u.listings.filter((l) => l.status === 'active').length,
      total_views:       u.listings.reduce((s, l) => s + (l.views_count || 0), 0),
      joined:            u.created_at,
    })).sort((a, b) => b.total_views - a.total_views)

    res.json({
      success: true,
      data: {
        top_sellers:         enrichedSellers.slice(0, 10),
        tier_breakdown:      tierBreakdown.map((t) => ({ tier: t.subscription_tier, count: t._count.subscription_tier })),
        category_performance: categoryPerformance.map((c) => ({ ...c, listing_count: c._count.listings })),
        recent_subscriptions: recentSubscriptions,
        upsell_targets:       upsellTargets.map((u) => ({ ...u, listing_count: u._count.listings })),
      },
    })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════════════════
//  REVENUE
// ══════════════════════════════════════════════════════════════════

router.get('/revenue', async (_req, res, next) => {
  try {
    const now   = new Date()
    const month = new Date(now.getFullYear(), now.getMonth(), 1)
    const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const PLAN_PRICES = { free: 0, pro: 50, business: 150 }

    const [tierBreakdown, boostRevenue, boostRevenueMonth, recentSubs, monthlyTrend] = await Promise.all([
      prisma.user.groupBy({ by: ['subscription_tier'], _count: { subscription_tier: true } }),
      prisma.boost.aggregate({ where: { paid: true }, _sum: { amount: true } }),
      prisma.boost.aggregate({ where: { paid: true, created_at: { gte: month } }, _sum: { amount: true } }),
      prisma.subscription.findMany({
        where:   { active: true, plan: { not: 'free' } },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { created_at: 'desc' },
        take:    10,
      }),
      // Monthly subscription revenue for last 6 months
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', s.created_at), 'Mon YY') AS month,
          SUM(CASE WHEN s.plan = 'pro' THEN 50 WHEN s.plan = 'business' THEN 150 ELSE 0 END)::int AS amount
        FROM subscriptions s
        WHERE s.active = true AND s.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', s.created_at)
        ORDER BY DATE_TRUNC('month', s.created_at) ASC
      `,
    ])

    const mrr = tierBreakdown.reduce((sum, t) => {
      return sum + (PLAN_PRICES[t.subscription_tier] || 0) * t._count.subscription_tier
    }, 0)

    res.json({
      success: true,
      data: {
        mrr,
        arr: mrr * 12,
        boost_revenue_total: boostRevenue._sum.amount || 0,
        boost_revenue_month: boostRevenueMonth._sum.amount || 0,
        tier_breakdown: tierBreakdown.map((t) => ({
          tier:     t.subscription_tier,
          count:    t._count.subscription_tier,
          revenue:  (PLAN_PRICES[t.subscription_tier] || 0) * t._count.subscription_tier,
        })),
        recent_subscriptions: recentSubs,
        monthly_trend: monthlyTrend,
      },
    })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════════════════
//  BOOSTS
// ══════════════════════════════════════════════════════════════════

router.get('/boosts', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit
    const { tier, paid } = req.query

    const where = {}
    if (tier) where.tier = tier
    if (paid === 'true')  where.paid = true
    if (paid === 'false') where.paid = false

    const [boosts, total, stats] = await Promise.all([
      prisma.boost.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true, title: true, status: true,
              images: { take: 1, select: { url: true } },
              seller: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip, take: limit,
      }),
      prisma.boost.count({ where }),
      prisma.boost.groupBy({
        by:     ['tier'],
        _count: { tier: true },
        _sum:   { amount: true },
        where:  { paid: true },
      }),
    ])

    const activeNow = await prisma.boost.count({
      where: { paid: true, ends_at: { gte: new Date() } },
    })

    res.json({
      success: true,
      data: {
        boosts: boosts.map((b) => ({
          id:         b.id,
          tier:       b.tier,
          paid:       b.paid,
          amount:     b.amount,
          starts_at:  b.starts_at,
          ends_at:    b.ends_at,
          created_at: b.created_at,
          listing:    b.listing,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: {
          active_now: activeNow,
          by_tier:    stats.map((s) => ({ tier: s.tier, count: s._count.tier, revenue: s._sum.amount || 0 })),
        },
      },
    })
  } catch (err) { next(err) }
})

router.patch('/boosts/:id', async (req, res, next) => {
  try {
    const { paid } = req.body
    const boost = await prisma.boost.update({
      where: { id: req.params.id },
      data:  { paid: Boolean(paid) },
    })

    // Update listing boost_tier if approved
    if (paid) {
      await prisma.listing.update({
        where: { id: boost.listing_id },
        data:  { boost_tier: boost.tier, boost_ends_at: boost.ends_at },
      })
    }

    res.json({ success: true, data: boost })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════════

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where:   { parent_id: null },
      include: {
        children: {
          include: { _count: { select: { listings: true } } },
          orderBy: { name: 'asc' },
        },
        _count: { select: { listings: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: categories })
  } catch (err) { next(err) }
})

router.post('/categories', async (req, res, next) => {
  try {
    const { name, slug, parent_id, icon_name } = req.body
    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and slug required' })
    }
    const category = await prisma.category.create({
      data: {
        name:      name.trim(),
        slug:      slug.trim().toLowerCase().replace(/\s+/g, '-'),
        parent_id: parent_id || null,
        icon_name: icon_name || null,
      },
    })
    res.status(201).json({ success: true, data: category })
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Slug already exists' })
    next(err)
  }
})

router.patch('/categories/:id', async (req, res, next) => {
  try {
    const { name, slug, icon_name } = req.body
    const data = {}
    if (name)      data.name      = name.trim()
    if (slug)      data.slug      = slug.trim().toLowerCase().replace(/\s+/g, '-')
    if (icon_name !== undefined) data.icon_name = icon_name || null

    const category = await prisma.category.update({ where: { id: req.params.id }, data })
    res.json({ success: true, data: category })
  } catch (err) { next(err) }
})

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const count = await prisma.listing.count({ where: { category_id: req.params.id } })
    if (count > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete — ${count} listings use this category` })
    }
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

module.exports = router
