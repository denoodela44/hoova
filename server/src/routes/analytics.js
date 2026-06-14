const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth, requireAdminToken } = require('../middleware/auth')
const { logSearch } = require('../utils/searchLogger')

// GET /api/analytics/trending — public, top searched terms (used on homepage)
router.get('/trending', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20)
    const since = new Date(Date.now() - 7 * 86400000) // last 7 days

    const trends = await prisma.searchTrend.findMany({
      where: { last_searched_at: { gte: since }, count: { gt: 1 } },
      orderBy: { count: 'desc' },
      take: limit,
      select: { display_query: true, count: true },
    })

    res.json({ success: true, data: trends.map((t) => t.display_query) })
  } catch (err) { next(err) }
})

// POST /api/analytics/search — fire-and-forget from frontend search bar
router.post('/search', async (req, res) => {
  const { query, results_count = 0, source = 'hero', category_slug } = req.body

  // Optional auth — grab user ID from token if present
  let userId = null
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken')
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'hoova-jwt-secret-default-2024-xk9mP3qRvL')
      userId = payload.sub
    } catch (_) {}
  }

  logSearch(query, Number(results_count), source, userId, category_slug)
  res.json({ success: true })
})

// GET /api/analytics/searches — search analytics (admin)
router.get('/searches', requireAdminToken, async (req, res, next) => {
  try {
    const { days = 30, category } = req.query
    const since = new Date(Date.now() - Number(days) * 86400000)

    const where = {
      last_searched_at: { gte: since },
      ...(category ? { category_slug: category } : {}),
    }

    const [topTerms, zeroResults, total, uniqueCount, dailyVolume, categoryBreakdown] = await Promise.all([

      // Top grouped searches from SearchTrend
      prisma.searchTrend.findMany({
        where,
        orderBy: { count: 'desc' },
        take: 30,
        select: { query: true, display_query: true, count: true, zero_results_count: true, category_slug: true, last_searched_at: true },
      }),

      // Searches that never found results
      prisma.searchTrend.findMany({
        where: { ...where, zero_results_count: { gt: 0 } },
        orderBy: { zero_results_count: 'desc' },
        take: 15,
        select: { display_query: true, zero_results_count: true, category_slug: true },
      }),

      // Total raw search count in period
      prisma.searchLog.count({ where: { created_at: { gte: since } } }),

      // Unique normalised queries
      prisma.searchTrend.count({ where }),

      // Daily volume
      prisma.$queryRaw`
        SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
        FROM search_logs
        WHERE created_at >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,

      // Category breakdown
      prisma.$queryRaw`
        SELECT category_slug, COUNT(*)::int AS count
        FROM search_logs
        WHERE created_at >= ${since} AND category_slug IS NOT NULL
        GROUP BY category_slug
        ORDER BY count DESC
      `,
    ])

    res.json({
      success: true,
      data: {
        total,
        unique_terms: uniqueCount,
        top_terms: topTerms.map((t) => ({
          query: t.display_query || t.query,
          count: t.count,
          zero_results_count: t.zero_results_count,
          avg_results: t.zero_results_count === t.count ? 0 : 1,
          category_slug: t.category_slug,
          last_searched_at: t.last_searched_at,
        })),
        zero_results: zeroResults.map((t) => ({
          query: t.display_query,
          count: t.zero_results_count,
          category_slug: t.category_slug,
        })),
        daily_volume: dailyVolume,
        category_breakdown: categoryBreakdown,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/analytics/admin/dashboard — platform overview stats
router.get('/admin/dashboard', requireAdminToken, async (req, res, next) => {
  try {
    const today     = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today - 86400000)
    const week      = new Date(today - 7 * 86400000)
    const month     = new Date(today - 30 * 86400000)

    const [
      totalUsers, newUsersToday, newUsersWeek,
      totalListings, activeListings, newListingsToday, newListingsWeek,
      totalSearches, searchesToday,
      topTerms,
      zeroResultsCount,
      verifiedSellers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { created_at: { gte: today } } }),
      prisma.user.count({ where: { created_at: { gte: week } } }),

      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.listing.count({ where: { created_at: { gte: today } } }),
      prisma.listing.count({ where: { created_at: { gte: week } } }),

      prisma.searchLog.count({ where: { created_at: { gte: month } } }),
      prisma.searchLog.count({ where: { created_at: { gte: today } } }),

      prisma.searchTrend.findMany({ orderBy: { count: 'desc' }, take: 5, select: { display_query: true, count: true } }),
      prisma.searchTrend.count({ where: { zero_results_count: { gt: 0 } } }),

      prisma.user.count({ where: { id_verified: true } }),
    ])

    // New users per day for the last 14 days
    const newUsersTrend = await prisma.$queryRaw`
      SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
      FROM users
      WHERE created_at >= ${week}
      GROUP BY day ORDER BY day ASC
    `

    // New listings per day for the last 14 days
    const newListingsTrend = await prisma.$queryRaw`
      SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
      FROM listings
      WHERE created_at >= ${week}
      GROUP BY day ORDER BY day ASC
    `

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, verified: verifiedSellers, trend: newUsersTrend },
        listings: { total: totalListings, active: activeListings, today: newListingsToday, week: newListingsWeek, trend: newListingsTrend },
        searches: { month: totalSearches, today: searchesToday, top: topTerms, zero_results_gaps: zeroResultsCount },
      },
    })
  } catch (err) { next(err) }
})

module.exports = router
