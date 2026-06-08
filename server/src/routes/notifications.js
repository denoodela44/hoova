const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
    const unread = notifications.filter((n) => !n.is_read).length
    res.json({ success: true, data: notifications, unread })
  } catch (err) { next(err) }
})

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { user_id: req.user.id, is_read: false }, data: { is_read: true } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/notifications/subscribe — save push subscription
router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const { subscription } = req.body
    await prisma.user.update({ where: { id: req.user.id }, data: { push_subscription: subscription } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

module.exports = router
