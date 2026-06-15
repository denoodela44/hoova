const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

// GET /api/market-intelligence  — requires pro or business plan
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const tier = req.user.subscription_tier
    if (tier === 'free') {
      return res.status(403).json({ success: false, message: 'Upgrade to Seller plan to access Market Intelligence' })
    }

    const now = new Date()
    const startOfToday  = new Date(now); startOfToday.setHours(0, 0, 0, 0)
    const sevenDaysAgo  = new Date(now - 7  * 24 * 3600 * 1000)
    const fourteenDaysAgo = new Date(now - 14 * 24 * 3600 * 1000)
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000)

    // ── Platform stats ────────────────────────────────────────────────────────
    const [activeListingsCount, priceAgg, searchesToday, totalUsers] = await Promise.all([
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.listing.aggregate({
        where: { status: 'active', price: { gt: 0 } },
        _avg: { price: true },
      }),
      prisma.searchLog.count({ where: { created_at: { gte: startOfToday } } }),
      prisma.user.count(),
    ])

    // ── Hot searches (last 7 days) ────────────────────────────────────────────
    const recentSearches = await prisma.searchTrend.findMany({
      where: { last_searched_at: { gte: sevenDaysAgo } },
      orderBy: { count: 'desc' },
      take: 10,
    })

    // For each, compare count to 7-14 days ago window to get % change
    const hotSearches = await Promise.all(recentSearches.map(async (s) => {
      const older = await prisma.searchLog.count({
        where: {
          query: { contains: s.query, mode: 'insensitive' },
          created_at: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      })
      const recent = await prisma.searchLog.count({
        where: {
          query: { contains: s.query, mode: 'insensitive' },
          created_at: { gte: sevenDaysAgo },
        },
      })
      const change = older === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - older) / older) * 100)
      return { query: s.display_query, volume: s.count, change }
    }))

    // ── Category niches ───────────────────────────────────────────────────────
    // Get all top-level categories
    const topCategories = await prisma.category.findMany({
      where: { parent_id: null },
    })

    // Active listing counts + avg price per category
    const listingsByCategory = await prisma.listing.groupBy({
      by: ['category_id'],
      where: { status: 'active' },
      _count: { id: true },
      _avg: { price: true },
    })
    const listingMap = Object.fromEntries(
      listingsByCategory.map((r) => [r.category_id, { count: r._count.id, avgPrice: r._avg.price || 0 }])
    )

    // Search volumes per category slug (last 7 days)
    const categorySearches = await prisma.searchTrend.groupBy({
      by: ['category_slug'],
      where: { category_slug: { not: null }, last_searched_at: { gte: sevenDaysAgo } },
      _sum: { count: true },
    })
    const searchMap = Object.fromEntries(
      categorySearches.map((r) => [r.category_slug, r._sum.count || 0])
    )

    // 7-day trend per category (daily search counts)
    const trendRows = await prisma.$queryRaw`
      SELECT
        category_slug,
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*)::int AS cnt
      FROM search_logs
      WHERE created_at >= ${sevenDaysAgo} AND category_slug IS NOT NULL
      GROUP BY category_slug, DATE_TRUNC('day', created_at)
      ORDER BY day ASC
    `
    // Build a day-by-day map per slug
    const trendMap = {}
    for (const row of trendRows) {
      if (!trendMap[row.category_slug]) trendMap[row.category_slug] = []
      trendMap[row.category_slug].push(Number(row.cnt))
    }

    // Max values for normalisation
    const maxSearches  = Math.max(1, ...Object.values(searchMap))
    const maxListings  = Math.max(1, ...listingsByCategory.map((r) => r._count.id))

    const CATEGORY_ICONS = {
      'vehicles':             '🚗',
      'phones-tablets':       '📱',
      'electronics':          '💻',
      'home-appliances':      '🏠',
      'furniture':            '🛋️',
      'real-estate':          '🏘️',
      'fashion':              '👗',
      'health-beauty':        '💊',
      'babies-kids':          '👶',
      'building-construction':'🏗️',
      'agriculture':          '🌾',
      'services':             '🔧',
      'jobs':                 '💼',
      'sports':               '⚽',
      'pets':                 '🐾',
      'food':                 '🍲',
      'adults':               '🔞',
      'other':                '📦',
    }

    const niches = topCategories.map((cat) => {
      const listing = listingMap[cat.id] || { count: 0, avgPrice: 0 }
      const weekSearches = searchMap[cat.slug] || 0
      const demandVal    = Math.round((weekSearches / maxSearches) * 100)
      const compVal      = Math.round((listing.count  / maxListings)  * 100)
      const score        = Math.round(((demandVal * 0.6 + (100 - compVal) * 0.4) / 10) * 10) / 10
      const trend        = trendMap[cat.slug] || [0, 0, 0, 0, 0, 0, 0]
      const isTrending   = trend.length >= 2 && trend[trend.length - 1] > trend[0]
      const isOpportunity = demandVal > 50 && compVal < 40

      let competition = 'Low'
      if (compVal > 65) competition = 'High'
      else if (compVal > 35) competition = 'Medium'

      let demand = 'Low'
      if (demandVal > 75) demand = 'Very High'
      else if (demandVal > 50) demand = 'High'
      else if (demandVal > 25) demand = 'Medium'

      return {
        slug:          cat.slug,
        name:          cat.name,
        icon:          CATEGORY_ICONS[cat.slug] || '📦',
        score:         Math.min(10, Math.max(0, score)),
        demand,
        demand_val:    demandVal,
        competition,
        comp_val:      compVal,
        avg_price:     Math.round(listing.avgPrice),
        listings:      listing.count,
        searches_week: weekSearches,
        trend,
        trending:      isTrending,
        opportunity:   isOpportunity,
      }
    })

    // ── Regional demand ───────────────────────────────────────────────────────
    const regionRows = await prisma.listing.groupBy({
      by: ['region'],
      where: { status: 'active', region: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    })
    const maxRegion = Math.max(1, ...regionRows.map((r) => r._count.id))
    const regionalDemand = regionRows.map((r) => ({
      region:   r.region,
      score:    Math.round((r._count.id / maxRegion) * 100),
      listings: r._count.id,
    }))

    // ── Post timing heatmap (from search_logs last 30 days) ───────────────────
    const heatRows = await prisma.$queryRaw`
      SELECT
        EXTRACT(DOW FROM created_at)::int  AS dow,
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*)::int AS cnt
      FROM search_logs
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY dow, hour
    `
    const days  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const maxHeat = Math.max(1, ...heatRows.map((r) => Number(r.cnt)))
    const heatGrid = days.map((_, di) => {
      return Array.from({ length: 24 }, (_, hi) => {
        const row = heatRows.find((r) => Number(r.dow) === di && Number(r.hour) === hi)
        return row ? Math.round((Number(row.cnt) / maxHeat) * 10) : 0
      })
    })

    // Reorder so Mon is first (Sun=0 in DOW → move to end)
    const heatmap = {
      hours: Array.from({ length: 24 }, (_, i) => i),
      days:  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data:  [...heatGrid.slice(1), heatGrid[0]],
    }

    // ── Opportunity count ──────────────────────────────────────────────────────
    const opportunityZones = niches.filter((n) => n.opportunity).length

    res.json({
      success: true,
      data: {
        updated_at: now.toISOString(),
        platform_stats: {
          searches_today:    searchesToday,
          active_listings:   activeListingsCount,
          avg_price_ghs:     Math.round(priceAgg._avg.price || 0),
          opportunity_zones: opportunityZones,
          total_users:       totalUsers,
        },
        niches:          niches.sort((a, b) => b.score - a.score),
        hot_searches:    hotSearches,
        regional_demand: regionalDemand,
        post_heatmap:    heatmap,
      },
    })
  } catch (err) { next(err) }
})

module.exports = router
