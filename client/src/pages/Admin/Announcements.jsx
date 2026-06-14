import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Send, Trash2, CheckCircle, Clock, Users } from 'lucide-react'
import api from '../../services/api'
import ConfirmModal from '../../components/ui/ConfirmModal'

const TYPE_META = {
  info:    { label: 'Info',    bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  warning: { label: 'Warning', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  success: { label: 'Success', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  promo:   { label: 'Promo',   bg: '#fdf2f5', color: '#B81365', border: '#f9a8d4' },
}

const TARGET_META = {
  all:      { label: 'All Users',     icon: '👥' },
  free:     { label: 'Free Users',    icon: '🆓' },
  pro:      { label: 'Pro Sellers',   icon: '⭐' },
  business: { label: 'Business',      icon: '🏢' },
}

const MOCK = [
  { id: 'a1', title: 'Welcome to HOOVA v2.0!', body: 'We just launched a major update with new features...', type: 'success', target: 'all', sent_at: new Date(Date.now() - 86400000 * 3).toISOString(), created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'a2', title: 'Pro Seller Exclusive Deal', body: 'Get 2 extra boost credits this month...', type: 'promo', target: 'pro', sent_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'a3', title: 'New Category: Agriculture', body: "We've added a dedicated Agriculture category...", type: 'info', target: 'all', sent_at: null, created_at: new Date().toISOString() },
]

export default function AdminAnnouncements() {
  const qc = useQueryClient()
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', type: 'info', target: 'all' })
  const [confirmState, setConfirmState] = useState(null)

  const { data: announcements = MOCK } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      try { return await api.get('/announcements/admin').then((r) => r.data.data) } catch { return MOCK }
    },
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => api.post('/announcements', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }); setComposing(false); setForm({ title: '', body: '', type: 'info', target: 'all' }) },
  })

  const { mutate: sendAnn } = useMutation({
    mutationFn: (id) => api.post(`/announcements/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  })

  const { mutate: deleteAnn } = useMutation({
    mutationFn: (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send platform-wide notifications to users.</p>
        </div>
        <button onClick={() => setComposing(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#B81365' }}>
          <Megaphone className="w-4 h-4" /> Compose
        </button>
      </div>

      {/* Compose form */}
      {composing && (
        <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '2px solid #B81365' }}>
          <p className="text-sm font-bold text-gray-800">New Announcement</p>

          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title" className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none font-semibold"
            style={{ border: '1px solid #e5e7eb' }} />

          <textarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write your message here…"
            className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none resize-none"
            style={{ border: '1px solid #e5e7eb' }} />

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(TYPE_META).map(([key, m]) => (
                  <button key={key} onClick={() => setForm((f) => ({ ...f, type: key }))}
                    className="px-2 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={form.type === key
                      ? { background: m.bg, color: m.color, border: `2px solid ${m.border}` }
                      : { background: '#fafaf9', color: '#9ca3af', border: '1px solid #f0eeeb' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target audience */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Send To</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(TARGET_META).map(([key, m]) => (
                  <button key={key} onClick={() => setForm((f) => ({ ...f, target: key }))}
                    className="px-2 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={form.target === key
                      ? { background: '#fdf2f5', color: '#B81365', border: '2px solid #f9a8d4' }
                      : { background: '#fafaf9', color: '#9ca3af', border: '1px solid #f0eeeb' }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {form.title && (
            <div className="rounded-xl p-3" style={{ background: TYPE_META[form.type]?.bg, border: `1px solid ${TYPE_META[form.type]?.border}` }}>
              <p className="text-xs font-bold" style={{ color: TYPE_META[form.type]?.color }}>Preview</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{form.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{form.body || '…'}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => create()} disabled={!form.title || !form.body || creating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: '#B81365' }}>
              Save Draft
            </button>
            <button onClick={() => setComposing(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Announcements list */}
      <div className="space-y-3">
        {announcements.map((a) => {
          const tm = TYPE_META[a.type]   || TYPE_META.info
          const am = TARGET_META[a.target] || TARGET_META.all
          const sent = !!a.sent_at
          return (
            <div key={a.id} className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tm.bg }}>
                  <Megaphone className="w-4 h-4" style={{ color: tm.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm text-gray-900">{a.title}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: tm.bg, color: tm.color }}>{tm.label}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{am.icon} {am.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{a.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {sent ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Sent {new Date(a.sent_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Clock className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!sent && (
                    <button onClick={() => setConfirmState({ message: `Send "${a.title}" to ${am.label}?`, confirmLabel: 'Send', danger: false, onConfirm: () => sendAnn(a.id) })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: '#B81365' }}>
                      <Send className="w-3 h-3" /> Send
                    </button>
                  )}
                  {!sent && (
                    <button onClick={() => setConfirmState({ message: 'Delete this draft announcement?', onConfirm: () => deleteAnn(a.id) })}
                      className="p-1.5 rounded-xl text-red-400 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel || 'Delete'}
          danger={confirmState.danger !== false}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}
      </div>
    </div>
  )
}
