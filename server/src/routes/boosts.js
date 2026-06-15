const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

const BOOST_PRICES = { featured: 30, spotlight: 60, top: 100 }
const BOOST_DAYS   = 7

// POST /api/boosts/:listingId/purchase
router.post('/:listingId/purchase', requireAuth, async (req, res, next) => {
  try {
    const { tier } = req.body
    if (!BOOST_PRICES[tier]) {
      return res.status(400).json({ success: false, message: 'Invalid boost tier. Choose featured, spotlight, or top.' })
    }

    const listing = await prisma.listing.findUnique({
      where: { id: req.params.listingId },
      select: { id: true, user_id: true, title: true, status: true, boost_tier: true, boost_ends_at: true },
    })
    if (!listing)                         return res.status(404).json({ success: false, message: 'Listing not found' })
    if (listing.user_id !== req.user.id)  return res.status(403).json({ success: false, message: 'Forbidden' })
    if (listing.status !== 'active')      return res.status(400).json({ success: false, message: 'Only active listings can be boosted' })

    if (listing.boost_tier && listing.boost_ends_at && new Date(listing.boost_ends_at) > new Date()) {
      return res.status(400).json({ success: false, message: 'This listing already has an active boost' })
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackKey) {
      return res.status(400).json({ success: false, message: 'Payment not configured — contact support.' })
    }

    const endsAt    = new Date(Date.now() + BOOST_DAYS * 24 * 60 * 60 * 1000)
    const reference = `hoova-boost-${req.user.id}-${Date.now()}`

    const boost = await prisma.boost.create({
      data: {
        listing_id:   listing.id,
        user_id:      req.user.id,
        tier,
        amount:       BOOST_PRICES[tier],
        ends_at:      endsAt,
        paid:         false,
        paystack_ref: reference,
      },
    })

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${paystackKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    req.user.email,
        amount:   BOOST_PRICES[tier] * 100, // pesewas
        reference,
        currency: 'GHS',
        metadata: {
          user_id:    req.user.id,
          listing_id: listing.id,
          boost_id:   boost.id,
          tier,
          type:       'boost',
        },
        callback_url: `${process.env.CLIENT_URL || 'https://hoova.up.railway.app'}/dashboard?tab=listings&boost=success`,
      }),
    })

    const pData = await paystackRes.json()
    if (!pData.status) {
      await prisma.boost.delete({ where: { id: boost.id } })
      return res.status(502).json({ success: false, message: 'Payment gateway error — try again.' })
    }

    res.json({ success: true, data: { payment_url: pData.data.authorization_url, reference } })
  } catch (err) { next(err) }
})

// GET /api/boosts/my — seller's boost history
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const boosts = await prisma.boost.findMany({
      where: { user_id: req.user.id },
      include: { listing: { select: { id: true, title: true, images: { take: 1, select: { url: true }, orderBy: { order: 'asc' } } } } },
      orderBy: { created_at: 'desc' },
      take: 20,
    })
    res.json({ success: true, data: boosts })
  } catch (err) { next(err) }
})

module.exports = router
