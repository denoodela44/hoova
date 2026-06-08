const router = require('express').Router()
const { upload } = require('../middleware/upload')
const { requireAuth } = require('../middleware/auth')

router.post('/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  res.json({ success: true, url: req.file.path, public_id: req.file.filename })
})

module.exports = router
