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

    // ── Search filter: each word must appear in title OR description (AND logic) ──
    let phraseIdx = null
    const wordIndices = []
    if (hasQuery) {
      const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 8)

      // Full phrase param for ranking boost
      values.push(`%${q.trim()}%`)
      phraseIdx = values.length

      // Each word must match
      for (const word of words) {
        values.push(`%${word}%`)
        wordIndices.push(values.length)
        conditions.push(`(l.title ILIKE $${values.length} OR l.description ILIKE $${values.length})`)
      }
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
      const allWordsInTitle = wordIndices.map((i) => `l.title ILIKE $${i}`).join(' AND ')
      orderClause = `
        CASE
          WHEN l.title ILIKE $${phraseIdx} THEN 3
          WHEN ${allWordsInTitle} THEN 2
          WHEN l.title ILIKE $${wordIndices[0] || phraseIdx} THEN 1
          ELSE 0
        END DESC,
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

    // Only log on the first page and never for autocomplete keystrokes
    if (hasQuery && req.query.source !== 'autocomplete' && Number(req.query.page || 1) <= 1) {
      logSearch(q.trim(), total, req.query.source || 'browse', req.userId || null, category || null)
    }

    res.json({ success: true, data: listings, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

// GET /api/search/similar — fuzzy fallback when main search returns 0 results
router.get('/similar', optionalAuth, async (req, res, next) => {
  try {
    const { q = '', limit = 8 } = req.query
    const query = q.trim()
    if (!query) return res.json({ success: true, data: [] })

    const take = Math.min(Number(limit), 16)

    // Use trigram similarity for typo tolerance (e.g. "corola" → "corolla")
    // word_similarity checks if query words appear similarly in the title
    const listings = await prisma.$queryRawUnsafe(`
      SELECT
        l.*,
        word_similarity($1, l.title) AS _sim,
        json_build_object(
          'id', u.id, 'name', u.name, 'avatar', u.avatar,
          'id_verified', u.id_verified, 'rating_avg', u.rating_avg
        ) AS seller,
        (SELECT json_agg(json_build_object('url', li.url, 'order', li.order) ORDER BY li.order)
         FROM listing_images li WHERE li.listing_id = l.id) AS images,
        json_build_object('id', lo.id, 'region', lo.region, 'city', lo.city, 'area', lo.area) AS location
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      LEFT JOIN locations lo ON lo.id = l.location_id
      WHERE l.status = 'active'
        AND (
          word_similarity($1, l.title) > 0.15
          OR word_similarity($1, l.description) > 0.15
          OR l.title ILIKE $2
          OR l.description ILIKE $2
        )
      ORDER BY word_similarity($1, l.title) DESC, l.score DESC
      LIMIT $3
    `, query, `%${query}%`, take)

    res.json({ success: true, data: listings })
  } catch (err) { next(err) }
})

module.exports = router
