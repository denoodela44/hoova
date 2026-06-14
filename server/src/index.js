require('dotenv').config()
const path = require('path')
const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const { Server } = require('socket.io')
const cron = require('node-cron')

const authRoutes = require('./routes/auth')
const listingRoutes = require('./routes/listings')
const searchRoutes = require('./routes/search')
const categoryRoutes = require('./routes/categories')
const messageRoutes = require('./routes/messages')
const notifRoutes = require('./routes/notifications')
const userRoutes = require('./routes/users')
const uploadRoutes = require('./routes/uploads')
const savedSearchRoutes = require('./routes/savedSearches')
const analyticsRoutes = require('./routes/analytics')
const adminRoutes  = require('./routes/admin')
const sellerRoutes = require('./routes/sellers')
const subscriptionRoutes = require('./routes/subscriptions')
const settingsRoutes = require('./routes/settings')
const reportsRoutes = require('./routes/reports')
const announcementsRoutes = require('./routes/announcements')
const sitemapRoutes = require('./routes/sitemap')

const chatHandler = require('./socket/chatHandler')
const { expireListings } = require('./jobs/expireListings')
const { autoApprovePending } = require('./jobs/autoApprove')
const { runScoreUpdate } = require('./jobs/updateScores')
const botRenderer = require('./middleware/botRenderer')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
})

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.cloudinary.com', 'https://*.googleapis.com', 'https://*.gstatic.com', 'https://picsum.photos', 'https://fastly.picsum.photos', 'https://ui-avatars.com', 'https://images.unsplash.com'],
      'connect-src': ["'self'", 'wss:', 'ws:'],
    },
  },
}))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Dynamic rendering for search-engine bots (must be before static/SPA handler)
app.use(botRenderer)

// Pass io to requests for realtime events
app.use((req, _res, next) => { req.io = io; next() })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/users', userRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/saved-searches', savedSearchRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/sellers', sellerRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/', sitemapRoutes) // sitemap.xml + robots.txt at root

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))

// Socket.io
chatHandler(io)

// Cron jobs
cron.schedule('0 2 * * *', expireListings)
cron.schedule('*/5 * * * *', autoApprovePending)
cron.schedule('*/30 * * * *', runScoreUpdate) // re-score all active listings every 30 min

// Score all listings on startup
runScoreUpdate()

// Serve React build in production — must be after all API routes
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'Not found' })
    }
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({ success: false, message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`🚀 HOOVA server running on http://localhost:${PORT}`))
