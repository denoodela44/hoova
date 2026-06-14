const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const prisma = require('../utils/prisma')
const { requireAuth } = require('../middleware/auth')
const { generateUniqueSlug } = require('../utils/slug')

const JWT_SECRET = process.env.JWT_SECRET || 'hoova-jwt-secret-default-2024-xk9mP3qRvL'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hoova-refresh-secret-default-2024-yL7nQ2wSbM'

function signTokens(userId) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' })
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { token, refreshToken }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{9,10}$/),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg })

    const { name, email, phone, password } = req.body

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone required' })
    }

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return res.status(409).json({ success: false, message: 'Email already registered' })
    }
    if (phone) {
      const fullPhone = `+233${phone.replace(/^0/, '')}`
      const existing = await prisma.user.findUnique({ where: { phone: fullPhone } })
      if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const fullPhone = phone ? `+233${phone.replace(/^0/, '')}` : null
    const store_slug = await generateUniqueSlug(name)

    const user = await prisma.user.create({
      data: { name, email: email || null, phone: fullPhone, password_hash, store_slug },
    })

    // Send phone OTP if phone provided
    if (fullPhone) {
      const otp = generateOtp()
      const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 min
      await prisma.otpCode.create({
        data: { user_id: user.id, phone: fullPhone, code: otp, purpose: 'verify-phone', expires_at: expires },
      })
      // TODO: send via Hubtel SMS service
      console.log(`[OTP] ${fullPhone}: ${otp}`)
    }

    const { token, refreshToken } = signTokens(user.id)

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, subscription_tier: user.subscription_tier },
        token,
        refreshToken,
        requiresPhoneVerify: !!fullPhone,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid credentials' })

    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const { token, refreshToken } = signTokens(user.id)

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, subscription_tier: user.subscription_tier, id_verified: user.id_verified },
        token,
        refreshToken,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/verify-phone
router.post('/verify-phone', async (req, res, next) => {
  try {
    const { phone, otp } = req.body
    const fullPhone = `+233${phone.replace(/^0/, '')}`

    const record = await prisma.otpCode.findFirst({
      where: { phone: fullPhone, code: otp, purpose: 'verify-phone', used: false, expires_at: { gt: new Date() } },
      orderBy: { created_at: 'desc' },
    })

    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired code' })

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: record.id }, data: { used: true } }),
      prisma.user.update({ where: { id: record.user_id }, data: { phone_verified: true } }),
    ])

    const user = await prisma.user.findUnique({ where: { id: record.user_id } })
    const { token, refreshToken } = signTokens(user.id)

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, phone_verified: true, subscription_tier: user.subscription_tier },
        token,
        refreshToken,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { phone } = req.body
    const fullPhone = `+233${phone.replace(/^0/, '')}`
    const otp = generateOtp()
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    const user = await prisma.user.findUnique({ where: { phone: fullPhone } })
    if (!user) return res.status(404).json({ success: false, message: 'Phone not registered' })

    await prisma.otpCode.create({
      data: { user_id: user.id, phone: fullPhone, code: otp, purpose: 'verify-phone', expires_at: expires },
    })

    console.log(`[OTP resend] ${fullPhone}: ${otp}`)
    res.json({ success: true, message: 'OTP sent' })
  } catch (err) { next(err) }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' })
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    const { token, refreshToken: newRefreshToken } = signTokens(payload.sub)
    res.json({ success: true, data: { token, refreshToken: newRefreshToken } })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, phone, avatar, bio, phone_verified, email_verified, id_verified, subscription_tier, rating_avg, review_count, created_at } = req.user
  res.json({ success: true, data: { id, name, email, phone, avatar, bio, phone_verified, email_verified, id_verified, subscription_tier, rating_avg, review_count, created_at } })
})

module.exports = router
