import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, ArrowLeft, Package } from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { timeAgo } from '../utils/format'

function useSocket() {
  const { token } = useAuthStore()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return
    const socket = io('/', { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket
    return () => socket.disconnect()
  }, [token])

  return socketRef
}

export default function Messages() {
  const { id: activeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const socketRef = useSocket()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  // Conversations list
  const { data: convos = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then((r) => r.data.data),
    refetchInterval: 15000,
  })

  // Messages in active conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => api.get(`/conversations/${activeId}/messages`).then((r) => r.data.data),
    enabled: !!activeId,
  })

  const activeConvo = convos.find((c) => c.id === activeId)

  // Join socket room + listen for new messages
  useEffect(() => {
    if (!activeId || !socketRef.current) return
    const socket = socketRef.current
    socket.emit('join_conversation', activeId)

    const handler = (msg) => {
      queryClient.setQueryData(['messages', activeId], (prev = []) => [...prev, msg])
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
    socket.on('new_message', handler)
    return () => socket.off('new_message', handler)
  }, [activeId, socketRef, queryClient])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    const content = input.trim()
    if (!content || !activeId || !socketRef.current) return
    socketRef.current.emit('send_message', { conversation_id: activeId, content })
    setInput('')
  }

  const otherParty = (convo) =>
    convo.buyer_id === user?.id ? convo.seller : convo.buyer

  return (
    <div style={{ background: '#f5f4f2', minHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Messages
        </h1>

        <div className="flex gap-4 h-[calc(100vh-180px)]">

          {/* ── Conversation list ───────────────────────── */}
          <div
            className={`w-full sm:w-72 shrink-0 rounded-2xl bg-white overflow-y-auto ${activeId ? 'hidden sm:flex flex-col' : 'flex flex-col'}`}
            style={{ border: '1px solid #f0eeeb' }}
          >
            {convos.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#fdf2f5' }}>
                  <MessageSquare className="w-6 h-6" style={{ color: '#B81365' }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No messages yet</p>
                <p className="text-xs text-gray-400">Start a conversation from any listing</p>
              </div>
            ) : (
              convos.map((c) => {
                const other = otherParty(c)
                const lastMsg = c.messages?.[0]
                const isActive = c.id === activeId
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/messages/${c.id}`)}
                    className="flex items-start gap-3 px-4 py-3.5 text-left w-full transition-colors hover:bg-gray-50"
                    style={{
                      background: isActive ? '#fdf2f5' : 'transparent',
                      borderLeft: isActive ? '3px solid #B81365' : '3px solid transparent',
                    }}
                  >
                    <img
                      src={other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || '?')}&background=F8C0C8&color=B81365&bold=true`}
                      alt={other?.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{other?.name}</p>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">{timeAgo(lastMsg.created_at)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{c.listing?.title}</p>
                      {lastMsg && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* ── Conversation thread ──────────────────────── */}
          {activeId ? (
            <div className="flex-1 flex flex-col rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#f0eeeb' }}>
                <button onClick={() => navigate('/messages')} className="sm:hidden text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {activeConvo && (
                  <>
                    <img
                      src={otherParty(activeConvo)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParty(activeConvo)?.name || '?')}&background=F8C0C8&color=B81365&bold=true`}
                      alt={otherParty(activeConvo)?.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{otherParty(activeConvo)?.name}</p>
                      {activeConvo.listing && (
                        <Link
                          to={`/listing/${activeConvo.listing.id}`}
                          className="text-xs truncate hover:underline"
                          style={{ color: '#B81365' }}
                        >
                          {activeConvo.listing.title}
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm"
                        style={{
                          background: isMine ? '#B81365' : '#f5f4f2',
                          color: isMine ? 'white' : '#1f2937',
                          borderBottomRightRadius: isMine ? 4 : undefined,
                          borderBottomLeftRadius: isMine ? undefined : 4,
                        }}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: '#f0eeeb' }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#f5f4f2', border: '1px solid #f0eeeb' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#B81365' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 rounded-2xl bg-white items-center justify-center" style={{ border: '1px solid #f0eeeb' }}>
              <div className="text-center">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
