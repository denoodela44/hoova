const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth, requireAdminToken } = require('../middleware/auth')

const VALID_REASONS = ['spam', 'scam', 'inappropriate', 'prohibited', 'wrong_category', 'duplicate', 'other']

// ── POST /api/reports — submit a report ──────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { listing_id, seller_id, reason, description } = req.body
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Invalid reason' })
    }
    if (!listing_id && !seller_id) {
      return res.status(400).json({ success: false, message: 'listing_id or seller_id required' })
    }
    // Prevent duplicate reports from same user
    const existing = await prisma.report.findFirst({
      where: {
        reporter_id: req.user.id,
        ...(listing_id ? { listing_id } : {}),
        ...(seller_id  ? { seller_id  } : {}),
      },
    })
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already reported this' })
    }

    const report = await prisma.report.create({
      data: {
        reporter_id: req.user.id,
        listing_id:  listing_id || null,
        seller_id:   seller_id  || null,
        reason,
        description: description?.trim() || null,
      },
    })
    res.status(201).json({ success: true, data: report })
  } catch (err) { next(err) }
})

// ── GET /api/reports — admin: list all reports ───────────────────────
router.get('/', requireAdminToken, async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.min(50, parseInt(req.query.limit) || 20)
    const skip   = (page - 1) * limit
    const { status, reason } = req.query

    const where = {}
    if (status) where.status = status
    if (reason) where.reason = reason

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ])

    // Enrich with listing/seller info
    const listingIds = [...new Set(reports.filter((r) => r.listing_id).map((r) => r.listing_id))]
    const sellerIds  = [...new Set(reports.filter((r) => r.seller_id).map((r) => r.seller_id))]

    const [listings, sellers] = await Promise.all([
      listingIds.length
        ? prisma.listing.findMany({
            where: { id: { in: listingIds } },
            select: { id: true, title: true, status: true, images: { take: 1, select: { url: true } } },
          })
        : [],
      sellerIds.length
        ? prisma.user.findMany({
            where: { id: { in: sellerIds } },
            select: { id: true, name: true, avatar: true, email: true },
          })
        : [],
    ])

    const listingMap = Object.fromEntries(listings.map((l) => [l.id, l]))
    const sellerMap  = Object.fromEntries(sellers.map((s)  => [s.id, s]))

    // Summary stats
    const [pending, reviewed, dismissed, actioned] = await Promise.all([
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.report.count({ where: { status: 'reviewed' } }),
      prisma.report.count({ where: { status: 'dismissed' } }),
      prisma.report.count({ where: { status: 'actioned' } }),
    ])

    res.json({
      success: true,
      data: {
        reports: reports.map((r) => ({
          ...r,
          listing: r.listing_id ? listingMap[r.listing_id] : null,
          seller:  r.seller_id  ? sellerMap[r.seller_id]   : null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: { pending, reviewed, dismissed, actioned },
      },
    })
  } catch (err) { next(err) }
})

// ── PATCH /api/reports/:id — admin: update status ────────────────────
router.patch('/:id', requireAdminToken, async (req, res, next) => {
  try {
    const { status, action_taken } = req.body
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status,
        action_taken: action_taken || null,
        reviewed_by:  req.user.id,
        reviewed_at:  new Date(),
      },
    })

    // If actioned — optionally remove the listing
    if (status === 'actioned' && report.listing_id && req.body.remove_listing) {
      await prisma.listing.update({
        where: { id: report.listing_id },
        data:  { status: 'rejected' },
      }).catch(() => {})
    }

    res.json({ success: true, data: report })
  } catch (err) { next(err) }
})

module.exports = router
