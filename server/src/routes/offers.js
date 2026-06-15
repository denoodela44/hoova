const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

const BUYER_SELECT = { id: true, name: true, avatar: true }

// PATCH /api/offers/:id — seller accepts/declines/counters; buyer accepts/declines a counter
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { listing: { select: { id: true, title: true, user_id: true } } },
    })
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' })

    const isSeller = offer.listing.user_id === req.user.id
    const isBuyer  = offer.buyer_id === req.user.id
    if (!isSeller && !isBuyer) return res.status(403).json({ success: false, message: 'Forbidden' })

    const { action, counter_amount } = req.body
    let updateData   = {}
    let notifyUserId = null
    let notifyTitle  = ''
    let notifyBody   = ''

    if (isSeller && offer.status === 'pending') {
      if (action === 'accept') {
        updateData   = { status: 'accepted' }
        notifyUserId = offer.buyer_id
        notifyTitle  = 'Offer accepted!'
        notifyBody   = `Your offer of GHS ${offer.amount.toLocaleString()} on "${offer.listing.title}" was accepted.`
      } else if (action === 'decline') {
        updateData   = { status: 'declined' }
        notifyUserId = offer.buyer_id
        notifyTitle  = 'Offer declined'
        notifyBody   = `Your offer on "${offer.listing.title}" was declined by the seller.`
      } else if (action === 'counter') {
        const num = Number(counter_amount)
        if (!num || num <= 0) return res.status(400).json({ success: false, message: 'Invalid counter amount' })
        updateData   = { status: 'countered', counter_amount: num }
        notifyUserId = offer.buyer_id
        notifyTitle  = 'Counter offer received'
        notifyBody   = `The seller countered with GHS ${num.toLocaleString()} for "${offer.listing.title}".`
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' })
      }
    } else if (isBuyer && offer.status === 'countered') {
      if (action === 'accept') {
        updateData   = { status: 'accepted' }
        notifyUserId = offer.listing.user_id
        notifyTitle  = 'Counter offer accepted'
        notifyBody   = `Buyer accepted your counter of GHS ${offer.counter_amount?.toLocaleString()} on "${offer.listing.title}".`
      } else if (action === 'decline') {
        updateData   = { status: 'declined' }
        notifyUserId = offer.listing.user_id
        notifyTitle  = 'Counter offer declined'
        notifyBody   = `Buyer declined your counter offer on "${offer.listing.title}".`
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' })
      }
    } else {
      return res.status(400).json({ success: false, message: 'Cannot perform this action on the current offer status' })
    }

    const updated = await prisma.offer.update({ where: { id: offer.id }, data: updateData })

    if (notifyUserId) {
      prisma.notification.create({
        data: {
          user_id: notifyUserId,
          type:    'offer',
          title:   notifyTitle,
          body:    notifyBody,
          data:    { listing_id: offer.listing.id, offer_id: offer.id },
        },
      }).catch(() => {})
    }

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

module.exports = router
