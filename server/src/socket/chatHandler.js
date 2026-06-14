const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')

const JWT_SECRET = process.env.JWT_SECRET || 'hoova-jwt-secret-default-2024-xk9mP3qRvL'

module.exports = function chatHandler(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      socket.userId = payload.sub
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`)
    })

    socket.on('send_message', async ({ conversation_id, content }) => {
      try {
        const convo = await prisma.conversation.findUnique({ where: { id: conversation_id } })
        if (!convo) return
        if (convo.buyer_id !== socket.userId && convo.seller_id !== socket.userId) return

        const message = await prisma.message.create({
          data: { conversation_id, sender_id: socket.userId, content },
        })

        await prisma.conversation.update({ where: { id: conversation_id }, data: { last_message_at: new Date() } })

        io.to(`conv:${conversation_id}`).emit('new_message', message)

        // Notify the other participant
        const recipientId = convo.buyer_id === socket.userId ? convo.seller_id : convo.buyer_id
        io.to(`user:${recipientId}`).emit('notification', { type: 'message', conversation_id })

        // Create DB notification
        prisma.notification.create({
          data: { user_id: recipientId, type: 'message', title: 'New message', body: content.slice(0, 100), data: { conversation_id } },
        }).catch(() => {})
      } catch (err) {
        console.error('chat error', err)
      }
    })

    socket.on('typing', ({ conversation_id, typing }) => {
      socket.to(`conv:${conversation_id}`).emit('typing', { user_id: socket.userId, typing })
    })

    // Join user-specific room for personal notifications
    socket.join(`user:${socket.userId}`)

    socket.on('disconnect', () => {})
  })
}
