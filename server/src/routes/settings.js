const router = require('express').Router()
const prisma = require('../utils/prisma')
const { requireAuth, requireAdminToken } = require('../middleware/auth')

// Keys exposed publicly (for frontend tracking + branding injection)
const PUBLIC_KEYS = [
  'ga4_id',
  'gtm_id',
  'google_ads_id',
  'meta_pixel_id',
  'gsc_verification',
  'custom_head_scripts',
  'custom_body_scripts',
  // branding
  'site_name',
  'site_tagline',
  'brand_primary_color',
  'brand_logo_url',
  'brand_favicon_url',
  'brand_og_image_url',
  // social media
  'social_facebook',
  'social_instagram',
  'social_tiktok',
  'social_twitter',
  'social_youtube',
  'social_whatsapp',
  'social_linkedin',
]

// ── GET /api/settings/public ─────────────────────────────────────────
// No auth — loaded by frontend on every page to inject tracking + branding
router.get('/public', async (_req, res, next) => {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    })
    const data = {}
    rows.forEach((r) => { data[r.key] = r.value })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// ── GET /api/settings/admin ──────────────────────────────────────────
// Admin: return all settings
router.get('/admin', requireAdminToken, async (_req, res, next) => {
  try {
    const rows = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } })
    const data = {}
    rows.forEach((r) => { data[r.key] = r.value })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// ── PATCH /api/settings/admin ────────────────────────────────────────
// Admin: upsert any number of key-value pairs
router.patch('/admin', requireAdminToken, async (req, res, next) => {
  try {
    const entries = Object.entries(req.body)
    if (!entries.length) return res.status(400).json({ success: false, message: 'No settings provided' })

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: value === '' ? null : String(value) },
          create: { key, value: value === '' ? null : String(value) },
        })
      )
    )

    res.json({ success: true, message: 'Settings saved' })
  } catch (err) { next(err) }
})

module.exports = router
