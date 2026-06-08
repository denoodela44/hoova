const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

// POST /api/conversations
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { listing_id } = req.body
    const listing = await prisma.listing.findUnique({ where: { id: listing_id } })
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' })
    if (listing.user_id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot chat with yourself' })

    const convo = await prisma.conversation.upsert({
      where: { listing_id_buyer_id: { listing_id, buyer_id: req.user.id } },
      create: { listing_id, buyer_id: req.user.id, seller_id: listing.user_id },
      update: {},
      include: { listing: { select: { id: true, title: true, price: true, images: { take: 1 } } } },
    })

    res.json({ success: true, data: convo })
  } catch (err) { next(err) }
})

// GET /api/conversations — user's inbox
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const convos = await prisma.conversation.findMany({
      where: { OR: [{ buyer_id: req.user.id }, { seller_id: req.user.id }] },
      include: {
        listing: { select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: { last_message_at: 'desc' },
    })
    res.json({ success: true, data: convos })
  } catch (err) { next(err) }
})

// GET /api/conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const convo = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!convo) return res.status(404).json({ success: false, message: 'Not found' })
    if (convo.buyer_id !== req.user.id && convo.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: req.params.id },
      orderBy: { created_at: 'asc' },
    })

    // Mark as read
    await prisma.message.updateMany({
      where: { conversation_id: req.params.id, sender_id: { not: req.user.id }, is_read: false },
      data: { is_read: true },
    })

    res.json({ success: true, data: messages })
  } catch (err) { next(err) }
})

module.exports = router
