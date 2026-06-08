const router = require('express').Router()
const prisma = require('../utils/prisma')
const { optionalAuth } = require('../middleware/auth')
const { logSearch } = require('../utils/searchLogger')

// GET /api/search?q=...&category=...&region=...&min_price=...&max_price=...&condition=...&sort=...
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      q = '',
      category,
      region,
      min_price,
      max_price,
      condition,
      sort = 'newest',
      page = 1,
      limit = 24,
    } = req.query

    const take = Math.min(Number(limit), 48)
    const skip = (Number(page) - 1) * take

    // Build WHERE clause for raw SQL (full-text + filters)
    const conditions = ["l.status = 'active'"]
    const values = []

    if (q.trim()) {
      values.push(`%${q.trim()}%`)
      // Simple ILIKE search across title + description
      conditions.push(`(l.title ILIKE $${values.length} OR l.description ILIKE $${values.length})`)
    }

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } })
      if (cat) {
        values.push(cat.id)
        conditions.push(`l.category_id = $${values.length}`)
      }
    }

    if (region) {
      values.push(region)
      conditions.push(`l.region = $${values.length}`)
    }

    if (condition && condition !== 'any') {
      values.push(condition)
      conditions.push(`l.condition = $${values.length}`)
    }

    if (min_price) {
      values.push(Number(min_price))
      conditions.push(`l.price >= $${values.length}`)
    }

    if (max_price) {
      values.push(Number(max_price))
      conditions.push(`l.price <= $${values.length}`)
    }

    const orderClause = {
      newest:     'l.created_at DESC',
      price_asc:  'l.price ASC',
      price_desc: 'l.price DESC',
      popular:    'l.views_count DESC',
    }[sort] || 'l.created_at DESC'

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM listings l ${whereClause}`,
      ...values
    )
    const total = Number(countResult[0]?.count || 0)

    values.push(take, skip)
    const listings = await prisma.$queryRawUnsafe(`
      SELECT
        l.*,
        json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar, 'id_verified', u.id_verified, 'rating_avg', u.rating_avg) AS seller,
        (SELECT json_agg(json_build_object('url', li.url, 'order', li.order) ORDER BY li.order)
         FROM listing_images li WHERE li.listing_id = l.id) AS images,
        json_build_object('id', lo.id, 'region', lo.region, 'city', lo.city, 'area', lo.area) AS location
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      LEFT JOIN locations lo ON lo.id = l.location_id
      ${whereClause}
      ORDER BY
        CASE WHEN l.boost_tier = 'top' THEN 0
             WHEN l.boost_tier = 'spotlight' THEN 1
             WHEN l.boost_tier = 'featured' THEN 2
             ELSE 3 END,
        ${orderClause}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, ...values)

    // Log every search — fire and forget, never blocks response
    if (q.trim()) {
      logSearch(q.trim(), total, req.query.source || 'browse', req.userId || null, category || null)
    }

    res.json({ success: true, data: listings, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

module.exports = router
