const router = require('express').Router()
const { upload, cloudinaryConfigured } = require('../middleware/upload')
const { requireAuth } = require('../middleware/auth')

router.post('/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  let url
  if (cloudinaryConfigured) {
    url = req.file.path
  } else {
    const base = process.env.SITE_URL || `https://${req.headers.host}`
    url = `${base}/uploads/${req.file.filename}`
  }

  res.json({ success: true, url, public_id: req.file.filename })
})

module.exports = router
