const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price_ghs: 0,
    listings_per_month: 5,
    photos_per_listing: 5,
    boost_credits: 0,
    store_page: false,
    badge: null,
    features: ['5 listings/month', '5 photos each', 'Basic search visibility'],
  },
  pro: {
    id: 'pro',
    name: 'Pro Seller',
    price_ghs: 50,
    listings_per_month: 50,
    photos_per_listing: 20,
    boost_credits: 3,
    store_page: true,
    badge: 'pro',
    features: [
      '50 listings/month',
      '20 photos each',
      'Store page + custom URL',
      '3 free boosts/month',
      'Pro badge on all listings',
      'Priority support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    price_ghs: 150,
    listings_per_month: -1, // unlimited
    photos_per_listing: 30,
    boost_credits: 10,
    store_page: true,
    badge: 'business',
    features: [
      'Unlimited listings',
      '30 photos each',
      'Store page + custom URL',
      '10 free boosts/month',
      'Business badge + verified priority',
      'Search analytics dashboard',
      'Dedicated account manager',
    ],
  },
}

// ── GET /api/subscriptions/plans ─────────────────────────────────────
router.get('/plans', (_req, res) => {
  res.json({ success: true, data: Object.values(PLANS) })
})

// ── GET /api/subscriptions/me ────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { user_id: req.user.id, active: true },
      orderBy: { created_at: 'desc' },
    })

    const tier = req.user.subscription_tier || 'free'
    const plan = PLANS[tier] || PLANS.free

    res.json({
      success: true,
      data: {
        subscription: sub || null,
        plan,
        tier,
        ends_at: sub?.ends_at || null,
      },
    })
  } catch (err) { next(err) }
})

// ── POST /api/subscriptions/upgrade ──────────────────────────────────
// Initialises a Paystack transaction for plan upgrade
// Returns a checkout URL — frontend redirects user to it
router.post('/upgrade', requireAuth, async (req, res, next) => {
  try {
    const { plan } = req.body
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ success: false, message: 'Invalid plan' })
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackKey) {
      // Paystack not configured yet — return placeholder
      return res.json({
        success: true,
        data: {
          payment_url: null,
          message: 'Payment not configured yet. Contact support to upgrade.',
        },
      })
    }

    const amount = PLANS[plan].price_ghs * 100 // Paystack expects pesewas
    const reference = `hoova-sub-${req.user.id}-${Date.now()}`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: req.user.email,
        amount,
        reference,
        currency: 'GHS',
        metadata: {
          user_id: req.user.id,
          plan,
          type: 'subscription',
        },
        callback_url: `${process.env.CLIENT_URL}/dashboard?upgrade=success`,
      }),
    })

    const data = await response.json()
    if (!data.status) {
      return res.status(502).json({ success: false, message: 'Payment gateway error' })
    }

    // Record pending subscription
    await prisma.subscription.create({
      data: {
        user_id: req.user.id,
        plan,
        paystack_sub_code: reference,
        active: false, // activated on webhook
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    res.json({ success: true, data: { payment_url: data.data.authorization_url, reference } })
  } catch (err) { next(err) }
})

// ── POST /api/subscriptions/webhook ──────────────────────────────────
// Paystack calls this after successful payment — activates subscription
// NOTE: register this route BEFORE express.json() in index.js for raw body access
router.post('/webhook', async (req, res, next) => {
  try {
    const crypto = require('crypto')
    const rawBody = JSON.stringify(req.body)
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(rawBody)
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature')
    }

    const event = req.body
    if (event.event !== 'charge.success') return res.sendStatus(200)

    const { user_id, plan, type } = event.data?.metadata || {}
    if (type !== 'subscription' || !user_id || !plan) return res.sendStatus(200)

    await prisma.$transaction([
      prisma.subscription.updateMany({
        where: { user_id, paystack_sub_code: event.data.reference },
        data: { active: true },
      }),
      prisma.subscription.updateMany({
        where: { user_id, active: true, NOT: { paystack_sub_code: event.data.reference } },
        data: { active: false },
      }),
      prisma.user.update({
        where: { id: user_id },
        data: { subscription_tier: plan },
      }),
    ])

    res.sendStatus(200)
  } catch (err) { next(err) }
})

module.exports = router
