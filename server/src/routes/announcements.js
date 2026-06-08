const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')

function requireAdmin(req, res, next) {
  if (req.user?.subscription_tier !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' })
  }
  next()
}

// ── GET /api/announcements — public: latest announcements for banner ─
router.get('/', async (_req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where:   { sent_at: { not: null } },
      orderBy: { sent_at: 'desc' },
      take:    5,
    })
    res.json({ success: true, data: announcements })
  } catch (err) { next(err) }
})

// ── GET /api/announcements/admin — admin: all announcements ──────────
router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
    })
    res.json({ success: true, data: announcements })
  } catch (err) { next(err) }
})

// ── POST /api/announcements — admin: create ──────────────────────────
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, body, type = 'info', target = 'all' } = req.body
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and body required' })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title:      title.trim(),
        body:       body.trim(),
        type,
        target,
        created_by: req.user.id,
      },
    })
    res.status(201).json({ success: true, data: announcement })
  } catch (err) { next(err) }
})

// ── POST /api/announcements/:id/send — admin: send to users ──────────
router.post('/:id/send', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } })
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' })
    if (announcement.sent_at) return res.status(400).json({ success: false, message: 'Already sent' })

    // Find target users
    const where = {}
    if (announcement.target !== 'all') where.subscription_tier = announcement.target

    const users = await prisma.user.findMany({ where, select: { id: true } })

    // Create notifications in batch (chunked to avoid memory issues)
    const CHUNK = 500
    for (let i = 0; i < users.length; i += CHUNK) {
      await prisma.notification.createMany({
        data: users.slice(i, i + CHUNK).map((u) => ({
          user_id: u.id,
          type:    'system',
          title:   announcement.title,
          body:    announcement.body,
          data:    { announcement_id: announcement.id, type: announcement.type },
        })),
        skipDuplicates: true,
      })
    }

    // Mark as sent
    await prisma.announcement.update({
      where: { id: req.params.id },
      data:  { sent_at: new Date() },
    })

    res.json({ success: true, recipients: users.length })
  } catch (err) { next(err) }
})

// ── DELETE /api/announcements/:id — admin: delete draft ─────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ann = await prisma.announcement.findUnique({ where: { id: req.params.id } })
    if (ann?.sent_at) return res.status(400).json({ success: false, message: 'Cannot delete sent announcements' })
    await prisma.announcement.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

module.exports = router
