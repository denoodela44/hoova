import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle, AlertTriangle, Clock, MessageSquare, Star } from 'lucide-react'
import api from '../services/api'
import { timeAgo } from '../utils/format'

const TYPE_ICON = {
  listing_approved:  { icon: CheckCircle,   color: '#15803d', bg: '#dcfce7' },
  listing_flagged:   { icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
  listing_soft_live: { icon: Clock,         color: '#854d0e', bg: '#fefce8' },
  new_message:       { icon: MessageSquare, color: '#1d4ed8', bg: '#eff6ff' },
  review:            { icon: Star,          color: '#B81365', bg: '#fdf2f5' },
  announcement:      { icon: Bell,          color: '#7e22ce', bg: '#f5f3ff' },
}

export default function Notifications() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.get(`/notifications?page=${page}&limit=20`).then((r) => r.data.data),
  })

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.notifications || []
  const totalPages = data?.totalPages || 1
  const unread = notifications.filter((n) => !n.read_at).length

  return (
    <div className="min-h-screen" style={{ background: '#f5f4f1' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" style={{ color: '#B81365' }} />
            <h1 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Notifications
            </h1>
            {unread > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#B81365', color: 'white' }}>
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={() => markAll()} className="text-xs font-bold" style={{ color: '#B81365' }}>
              Mark all as read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#ECEAE6' }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center" style={{ border: '1px solid #f0eeeb' }}>
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-300 mt-1">We'll let you know when something happens</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const tm = TYPE_ICON[n.type] || TYPE_ICON.announcement
              const Icon = tm.icon
              const isUnread = !n.read_at
              return (
                <div
                  key={n.id}
                  className="rounded-2xl bg-white p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    border: isUnread ? `1px solid ${tm.color}40` : '1px solid #f0eeeb',
                    background: isUnread ? `${tm.bg}40` : 'white',
                  }}
                  onClick={() => { if (isUnread) markRead(n.id) }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tm.bg }}>
                    <Icon className="w-4 h-4" style={{ color: tm.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                      {n.title || n.message}
                    </p>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {isUnread && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#B81365' }} />}
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
              style={{ background: '#ECEAE6', color: '#374151' }}>← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
              style={{ background: '#ECEAE6', color: '#374151' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
