import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ShieldAlert, Clock, Zap, CheckCircle, XCircle,
  AlertTriangle, ChevronLeft, ChevronRight, ExternalLink,
  RefreshCw, ShieldOff, CheckSquare, Square, Filter,
} from 'lucide-react'
import api from '../../services/api'

// ── Mock data ─────────────────────────────────────────────────────
const mkListing = (i, extra = {}) => ({
  id: `l${i}`,
  title: ['2019 Toyota Corolla', 'iPhone 15 Pro', '2-Bed Apt East Legon', 'Samsung 55" TV', 'Honda Generator'][i % 5],
  price: [28000, 6500, 3200, 4800, 2100][i % 5],
  currency: 'GHS',
  status: 'pending',
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
  auto_approve_at: new Date(Date.now() + (30 - i * 5) * 60000).toISOString(),
  images: [],
  category: { name: ['Vehicles', 'Phones', 'Property', 'Electronics', 'Appliances'][i % 5] },
  seller: {
    id: `u${i}`, name: ['Kwame Motors', 'TechHub GH', 'HomePro', 'ElectroCity', 'PowerZone'][i % 5],
    email: `seller${i}@example.com`, subscription_tier: 'free',
    created_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  },
  ...extra,
})

const MOCK_PENDING  = Array.from({ length: 8 }, (_, i) => mkListing(i))
const MOCK_FLAGGED  = Array.from({ length: 5 }, (_, i) => mkListing(i, {
  is_flagged: true,
  status: ['pending', 'soft_live'][i % 2],
  flag_reasons: [
    [{ rule: 'suspicious_price', label: 'Suspicious Price', description: 'Price is unusually low for this category', severity: 'medium' }],
    [{ rule: 'scam_indicator',   label: 'Scam Indicator',   description: 'Phrase "send money first" detected', severity: 'high' }],
    [{ rule: 'no_images',        label: 'No Images',        description: 'Listing submitted without any images', severity: 'low' }],
    [{ rule: 'new_account_spam', label: 'New Account Bulk Post', description: 'Account 2 days old, 5 listings today', severity: 'high' }],
    [{ rule: 'duplicate_title',  label: 'Duplicate Listing', description: 'Same title posted within 24 hours', severity: 'medium' }],
  ][i],
}))
const MOCK_SOFT     = Array.from({ length: 4 }, (_, i) => mkListing(i, { status: 'soft_live' }))

const SEVERITY_META = {
  high:   { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
  medium: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  low:    { bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
}

const TABS = [
  { key: 'pending',   label: 'Pending Approval', icon: Clock,       color: '#854d0e' },
  { key: 'flagged',   label: 'Flagged',           icon: ShieldAlert, color: '#dc2626' },
  { key: 'soft_live', label: 'Soft-Live',         icon: Zap,         color: '#7e22ce' },
]

export default function Moderation() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState('pending')
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState([])
  const [rejectModal, setRejectModal] = useState(null)

  const endpointMap = { pending: 'pending', flagged: 'flagged', soft_live: 'soft-live' }

  const { data: counts = { pending: 0, flagged: 0, soft_live: 0 } } = useQuery({
    queryKey: ['admin', 'moderation', 'counts'],
    queryFn: async () => {
      try { return await api.get('/admin/moderation/counts').then((r) => r.data.data) }
      catch { return { pending: 8, flagged: 5, soft_live: 4 } }
    },
    refetchInterval: 30000,
  })

  const { data } = useQuery({
    queryKey: ['admin', 'moderation', tab, page],
    queryFn: async () => {
      try {
        return await api.get(`/admin/moderation/${endpointMap[tab]}?page=${page}&limit=20`).then((r) => r.data.data)
      } catch {
        return {
          listings:   tab === 'pending' ? MOCK_PENDING : tab === 'flagged' ? MOCK_FLAGGED : MOCK_SOFT,
          total:      tab === 'pending' ? 8 : tab === 'flagged' ? 5 : 4,
          totalPages: 1,
        }
      }
    },
    keepPreviousData: true,
  })

  const listings   = data?.listings   || []
  const totalPages = data?.totalPages || 1

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'moderation'] })
    setSelected([])
  }

  const { mutate: approve } = useMutation({
    mutationFn: (id) => api.post(`/admin/moderation/${id}/approve`),
    onSuccess: invalidate,
  })

  const { mutate: reject } = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/admin/moderation/${id}/reject`, { reason }),
    onSuccess: () => { invalidate(); setRejectModal(null) },
  })

  const { mutate: unflag } = useMutation({
    mutationFn: (id) => api.post(`/admin/moderation/${id}/unflag`),
    onSuccess: invalidate,
  })

  const { mutate: rescan } = useMutation({
    mutationFn: (id) => api.post(`/admin/moderation/${id}/rescan`),
    onSuccess: invalidate,
  })

  const { mutate: bulkApprove, isPending: bulkPending } = useMutation({
    mutationFn: () => api.post('/admin/moderation/bulk-approve', { ids: selected }),
    onSuccess: invalidate,
  })

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelected(selected.length === listings.length ? [] : listings.map((l) => l.id))

  const switchTab = (key) => { setTab(key); setPage(1); setSelected([]) }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
          Moderation
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Review new listings, clear flags, and manage soft-live content.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl w-fit" style={{ background: '#ECEAE6' }}>
        {TABS.map(({ key, label, icon: Icon, color }) => {
          const count = counts[key] || 0
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={active
                ? { background: 'white', color, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }
                : { color: '#9ca3af' }}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{ background: active ? color : '#d1d5db', color: active ? 'white' : '#6b7280' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#1a1a2e', color: 'white' }}
        >
          <span className="text-sm font-semibold">{selected.length} selected</span>
          <button
            onClick={() => bulkApprove()}
            disabled={bulkPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: '#15803d', color: 'white' }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve All
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-sm text-white/40 hover:text-white/70 transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Listing cards */}
      {listings.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid #f0eeeb' }}>
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-bold text-gray-700">All clear</p>
          <p className="text-sm text-gray-400 mt-1">Nothing in this queue right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
              {selected.length === listings.length
                ? <CheckSquare className="w-4 h-4" style={{ color: '#B81365' }} />
                : <Square className="w-4 h-4" />}
              {selected.length === listings.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {listings.map((l) => (
            <ModerationCard
              key={l.id}
              listing={l}
              tab={tab}
              selected={selected.includes(l.id)}
              onToggle={() => toggleSelect(l.id)}
              onApprove={() => approve(l.id)}
              onReject={() => setRejectModal(l)}
              onUnflag={() => unflag(l.id)}
              onRescan={() => rescan(l.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <RejectModal
          listing={rejectModal}
          onClose={() => setRejectModal(null)}
          onSubmit={(reason) => reject({ id: rejectModal.id, reason })}
        />
      )}
    </div>
  )
}

function ModerationCard({ listing: l, tab, selected, onToggle, onApprove, onReject, onUnflag, onRescan }) {
  const accountAgeDays = Math.floor((Date.now() - new Date(l.seller?.created_at).getTime()) / 86400000)
  const timeToAutoApprove = l.auto_approve_at
    ? Math.max(0, Math.floor((new Date(l.auto_approve_at) - Date.now()) / 60000))
    : null

  return (
    <div
      className="rounded-2xl bg-white overflow-hidden transition-all"
      style={{
        border: selected ? '2px solid #B81365' : '1px solid #f0eeeb',
        boxShadow: selected ? '0 0 0 3px #B8136520' : 'none',
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button onClick={onToggle} className="mt-0.5 shrink-0">
            {selected
              ? <CheckSquare className="w-4 h-4" style={{ color: '#B81365' }} />
              : <Square className="w-4 h-4 text-gray-300" />}
          </button>

          {/* Thumbnail */}
          <div
            className="w-16 h-16 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-xs text-gray-400"
            style={{ background: '#ECEAE6' }}
          >
            {l.images?.[0]?.url
              ? <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
              : 'No img'}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-sm truncate">{l.title}</p>
                <p className="text-xs text-gray-400">{l.category?.name} · GHS {l.price?.toLocaleString()}</p>
              </div>
              <Link
                to={`/listing/${l.id}`}
                target="_blank"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Seller info */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {l.seller?.name?.[0]}
                </div>
                <span className="text-xs font-medium text-gray-700">{l.seller?.name}</span>
              </div>
              <span className="text-[10px] text-gray-400">Account: {accountAgeDays}d old</span>
              <span className="text-[10px] text-gray-400">
                {new Date(l.created_at).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              {tab === 'pending' && timeToAutoApprove !== null && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={timeToAutoApprove > 10
                    ? { background: '#fef9c3', color: '#854d0e' }
                    : { background: '#fef2f2', color: '#dc2626' }}
                >
                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                  {timeToAutoApprove > 0 ? `Auto in ${timeToAutoApprove}m` : 'Auto-approving…'}
                </span>
              )}
              {l.status === 'soft_live' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f5f3ff', color: '#7e22ce' }}>
                  <Zap className="w-2.5 h-2.5 inline mr-0.5" />Soft-Live
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Flag reasons */}
        {l.is_flagged && Array.isArray(l.flag_reasons) && l.flag_reasons.length > 0 && (
          <div className="mt-3 space-y-2">
            {l.flag_reasons.map((f, i) => {
              const m = SEVERITY_META[f.severity] || SEVERITY_META.low
              return (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl" style={{ background: m.bg }}>
                  <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: m.dot }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: m.color }}>{f.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: m.color + 'cc' }}>{f.description}</p>
                  </div>
                  <span
                    className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full ml-auto shrink-0"
                    style={{ background: m.color + '20', color: m.color }}
                  >
                    {f.severity}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f0eeeb' }}>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: '#15803d' }}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: '#fef2f2', color: '#dc2626' }}
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
          {l.is_flagged && (
            <button
              onClick={onUnflag}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: '#ECEAE6', color: '#6b7280' }}
            >
              <ShieldOff className="w-3.5 h-3.5" /> Clear Flag
            </button>
          )}
          <button
            onClick={onRescan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all ml-auto"
            title="Re-run flagging rules"
          >
            <RefreshCw className="w-3 h-3" /> Rescan
          </button>
        </div>
      </div>
    </div>
  )
}

const QUICK_REASONS = [
  'Does not meet our community guidelines.',
  'Item is prohibited on HOOVA.',
  'Suspected scam or fraudulent listing.',
  'Price appears deceptive or misleading.',
  'Duplicate listing — please edit your existing one.',
  'Images do not match the item description.',
]

function RejectModal({ listing, onClose, onSubmit }) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Reject Listing</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 truncate">"{listing.title}"</p>

        <p className="text-xs font-bold text-gray-600 mb-2">Quick reasons</p>
        <div className="space-y-1.5 mb-4">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
              style={reason === r
                ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }
                : { background: '#fafaf9', color: '#6b7280', border: '1px solid #f0eeeb' }}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Or write a custom reason…"
          className="w-full px-3 py-2.5 rounded-xl text-xs border resize-none focus:outline-none"
          style={{ border: '1px solid #e5e7eb' }}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSubmit(reason || 'Your listing did not meet our community guidelines.')}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#dc2626' }}
          >
            Confirm Rejection
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
