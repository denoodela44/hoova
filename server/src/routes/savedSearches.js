const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json({ success: true, data: searches })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { query, filters, notif_email = true, notif_sms = false, notif_push = true } = req.body
    const search = await prisma.savedSearch.create({
      data: { user_id: req.user.id, query, filters, notif_email, notif_sms, notif_push },
    })
    res.status(201).json({ success: true, data: search })
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.savedSearch.deleteMany({ where: { id: req.params.id, user_id: req.user.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

module.exports = router
