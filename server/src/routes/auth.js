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
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{9,10}$/),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg })

    const { email, phone, password } = req.body
    const name = req.body.name || (email ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : null) || 'Seller'

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
        requiresPhoneVerify: false, // SMS not yet configured — skip verification
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

    // Promote to admin if email matches ADMIN_EMAIL env var
    const isAdmin = process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
    const subscription_tier = isAdmin ? 'admin' : user.subscription_tier

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, subscription_tier, id_verified: user.id_verified },
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

// POST /api/auth/request-phone-verify — send OTP to the logged-in user's phone
router.post('/request-phone-verify', requireAuth, async (req, res, next) => {
  try {
    // Allow adding/changing phone too
    const rawPhone = req.body.phone || req.user.phone
    if (!rawPhone) return res.status(400).json({ success: false, message: 'No phone number on your account. Add one first.' })

    const fullPhone = rawPhone.startsWith('+') ? rawPhone : `+233${rawPhone.replace(/^0/, '')}`

    // If changing phone, check it's not taken by another user
    if (rawPhone !== req.user.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: fullPhone } })
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ success: false, message: 'Phone already registered to another account' })
      }
      // Update phone on user record (unverified until OTP confirmed)
      await prisma.user.update({ where: { id: req.user.id }, data: { phone: fullPhone, phone_verified: false } })
    }

    const otp = generateOtp()
    const expires = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.otpCode.create({
      data: { user_id: req.user.id, phone: fullPhone, code: otp, purpose: 'verify-phone', expires_at: expires },
    })

    console.log(`[OTP verify] ${fullPhone}: ${otp}`)
    // TODO: send via Hubtel SMS
    res.json({ success: true, message: 'OTP sent', phone: fullPhone })
  } catch (err) { next(err) }
})

// POST /api/auth/change-password — change password for logged-in user
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'current_password and new_password required' })
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user?.password_hash) {
      return res.status(400).json({ success: false, message: 'Account uses social login — no password to change' })
    }

    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' })

    const password_hash = await bcrypt.hash(new_password, 12)
    await prisma.user.update({ where: { id: req.user.id }, data: { password_hash } })

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) { next(err) }
})

// POST /api/auth/make-admin  — one-time setup, requires ADMIN_SECRET env var
router.post('/make-admin', async (req, res, next) => {
  try {
    const { email, secret } = req.body
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) return res.status(500).json({ success: false, message: 'ADMIN_SECRET not configured on server' })
    if (!secret || secret !== adminSecret) return res.status(403).json({ success: false, message: 'Invalid secret' })
    if (!email) return res.status(400).json({ success: false, message: 'Email required' })
    const user = await prisma.user.update({
      where: { email },
      data: { subscription_tier: 'admin' },
    })
    res.json({ success: true, message: `✅ ${user.name} (${user.email}) is now an admin` })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'No user found with that email' })
    next(err)
  }
})

module.exports = router
