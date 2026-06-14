const router = require('express').Router()
const { upload } = require('../middleware/upload')
const { requireAuth } = require('../middleware/auth')
const { uploadImage } = require('../services/storage')

router.post('/image', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const url = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype)
    res.json({ success: true, url })
  } catch (err) { next(err) }
})

module.exports = router
