const router = require('express').Router()
const prisma = require('../utils/prisma')
const { optionalAuth } = require('../middleware/auth')
const { logSearch } = require('../utils/searchLogger')

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      q = '', category, region, city, min_price, max_price,
      condition, negotiable, sort = 'relevance', page = 1, limit = 24,
    } = req.query

    const take = Math.min(Number(limit), 48)
    const skip = (Number(page) - 1) * take
    const hasQuery = q.trim().length > 0

    const conditions = ["l.status = 'active'"]
    const values = []

    // ── Full-text search ──────────────────────────────────────────
    if (hasQuery) {
      values.push(q.trim())
      const qi = values.length
      conditions.push(
        `to_tsvector('english', COALESCE(l.title,'') || ' ' || COALESCE(l.description,'')) @@ plainto_tsquery('english', $${qi})`
      )
    }

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } })
      if (cat) { values.push(cat.id); conditions.push(`l.category_id = $${values.length}`) }
    }

    if (city) { values.push(city); conditions.push(`l.city ILIKE $${values.length}`) }
    else if (region) { values.push(region); conditions.push(`l.region = $${values.length}`) }

    if (condition && condition !== 'any') { values.push(condition); conditions.push(`l.condition = $${values.length}`) }
    if (negotiable === 'true') conditions.push(`l.negotiable = true`)
    if (min_price) { values.push(Number(min_price)); conditions.push(`l.price >= $${values.length}`) }
    if (max_price) { values.push(Number(max_price)); conditions.push(`l.price <= $${values.length}`) }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // ── Order by ──────────────────────────────────────────────────
    // When searching: blend text relevance (50%) + listing score (50%)
    // When browsing: pure listing score (algorithm rank), or explicit user sort
    let orderClause
    if (hasQuery && sort === 'relevance') {
      const qi = 1 // query is always $1
      orderClause = `
        ts_rank(
          to_tsvector('english', COALESCE(l.title,'') || ' ' || COALESCE(l.description,'')),
          plainto_tsquery('english', $${qi})
        ) * 0.5 + (l.score / NULLIF((SELECT MAX(score) FROM listings WHERE status='active'), 0)) * 0.5 DESC NULLS LAST,
        l.score DESC
      `
    } else {
      orderClause = {
        relevance:  'l.score DESC',
        newest:     'l.created_at DESC',
        price_asc:  'l.price ASC',
        price_desc: 'l.price DESC',
        popular:    'l.views_count DESC',
      }[sort] || 'l.score DESC'
    }

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM listings l ${whereClause}`, ...values
    )
    const total = Number(countResult[0]?.count || 0)

    values.push(take, skip)
    const listings = await prisma.$queryRawUnsafe(`
      SELECT
        l.*,
        json_build_object(
          'id', u.id, 'name', u.name, 'avatar', u.avatar,
          'id_verified', u.id_verified, 'rating_avg', u.rating_avg,
          'review_count', u.review_count, 'created_at', u.created_at
        ) AS seller,
        (SELECT json_agg(json_build_object('url', li.url, 'order', li.order) ORDER BY li.order)
         FROM listing_images li WHERE li.listing_id = l.id) AS images,
        json_build_object('id', lo.id, 'region', lo.region, 'city', lo.city, 'area', lo.area) AS location
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      LEFT JOIN locations lo ON lo.id = l.location_id
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, ...values)

    if (hasQuery) {
      logSearch(q.trim(), total, req.query.source || 'browse', req.userId || null, category || null)
    }

    res.json({ success: true, data: listings, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

module.exports = router
