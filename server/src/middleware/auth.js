const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')

const JWT_SECRET = process.env.JWT_SECRET || 'hoova-jwt-secret-default-2024-xk9mP3qRvL'

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  try {
    const payload = verifyToken(header.slice(7))
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice(7))
      req.userId = payload.sub
    } catch (_) {}
  }
  next()
}

function requireAdmin(req, res, next) {
  const isAdmin =
    req.user?.subscription_tier === 'admin' ||
    (process.env.ADMIN_EMAIL && req.user?.email === process.env.ADMIN_EMAIL)
  if (!isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' })
  next()
}

const ADMIN_JWT_SECRET = process.env.ADMIN_SECRET || 'f8Kx2#mQ9pL$vR4nWjYt6bZ@cE1hA3dU'

function requireAdminToken(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Admin login required' })
  }
  try {
    const payload = jwt.verify(header.slice(7), ADMIN_JWT_SECRET)
    if (payload.role !== 'admin') throw new Error('Not admin token')
    req.adminEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Admin session expired' })
  }
}

module.exports = { requireAuth, optionalAuth, requireAdmin, requireAdminToken, ADMIN_JWT_SECRET }
