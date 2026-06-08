import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, CheckCircle, XCircle, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const REASON_META = {
  spam:          { label: 'Spam',            color: '#6b7280', bg: '#f3f4f6' },
  scam:          { label: 'Scam / Fraud',    color: '#dc2626', bg: '#fef2f2' },
  inappropriate: { label: 'Inappropriate',   color: '#c2410c', bg: '#fff7ed' },
  prohibited:    { label: 'Prohibited Item', color: '#7e22ce', bg: '#f5f3ff' },
  wrong_category:{ label: 'Wrong Category',  color: '#1d4ed8', bg: '#eff6ff' },
  duplicate:     { label: 'Duplicate',       color: '#854d0e', bg: '#fefce8' },
  other:         { label: 'Other',           color: '#6b7280', bg: '#f3f4f6' },
}

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#fefce8', color: '#854d0e' },
  reviewed:  { label: 'Reviewed',  bg: '#eff6ff', color: '#1d4ed8' },
  dismissed: { label: 'Dismissed', bg: '#f3f4f6', color: '#6b7280' },
  actioned:  { label: 'Actioned',  bg: '#dcfce7', color: '#15803d' },
}

const MOCK_REPORTS = Array.from({ length: 12 }, (_, i) => ({
  id: `r${i}`,
  reason: Object.keys(REASON_META)[i % 7],
  description: ['Price seems too good to be true', 'Seller asked me to pay via crypto first', null, 'This item is clearly a replica'][i % 4],
  status: ['pending', 'pending', 'reviewed', 'dismissed', 'actioned'][i % 5],
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  reporter: { id: `u${i}`, name: `User ${i + 1}`, email: `user${i}@example.com`, avatar: null },
  listing: i % 2 === 0 ? { id: `l${i}`, title: ['iPhone 15 Pro', '2019 Toyota', 'HP Laptop', 'Sofa Set'][i % 4], status: 'active', images: [] } : null,
  seller:  i % 2 !== 0 ? { id: `s${i}`, name: ['Kwame Motors', 'TechHub GH'][i % 2], avatar: null, email: `seller${i}@sika.gh` } : null,
}))

const STATUS_FILTERS = ['all', 'pending', 'reviewed', 'dismissed', 'actioned']

export default function AdminReports() {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('all')
  const [actionModal, setActionModal] = useState(null)

  const { data } = useQuery({
    queryKey: ['admin', 'reports', page, status],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ page, limit: 20 })
        if (status !== 'all') params.set('status', status)
        return await api.get(`/reports?${params}`).then((r) => r.data.data)
      } catch {
        return { reports: MOCK_REPORTS, total: 12, page: 1, totalPages: 1, stats: { pending: 7, reviewed: 2, dismissed: 2, actioned: 1 } }
      }
    },
  })

  const reports    = data?.reports   || MOCK_REPORTS
  const stats      = data?.stats     || { pending: 7, reviewed: 2, dismissed: 2, actioned: 1 }
  const totalPages = data?.totalPages || 1

  const { mutate: updateReport } = useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/reports/${id}`, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'reports'] }); setActionModal(null) },
  })

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">User-submitted reports on listings and sellers.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(stats).map(([key, value]) => {
          const m = STATUS_META[key] || { label: key, bg: '#f3f4f6', color: '#6b7280' }
          return (
            <div key={key} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #f0eeeb' }}>
              <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: m.bg, color: m.color }}>{m.label}</span>
            </div>
          )
        })}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#ECEAE6' }}>
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={status === s ? { background: 'white', color: '#B81365', boxShadow: '0 1px 3px rgba(0,0,0,.1)' } : { color: '#6b7280' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.map((r) => {
          const rm = REASON_META[r.reason] || REASON_META.other
          const sm = STATUS_META[r.status] || STATUS_META.pending
          return (
            <div key={r.id} className="rounded-2xl bg-white p-4" style={{ border: '1px solid #f0eeeb' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: rm.bg }}>
                  <Flag className="w-4 h-4" style={{ color: rm.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: rm.bg, color: rm.color }}>{rm.label}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {new Date(r.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {r.description && <p className="text-xs text-gray-600 mt-1.5 italic">"{r.description}"</p>}

                  <div className="flex flex-wrap gap-4 mt-2">
                    {/* Reporter */}
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Reported by</p>
                      <p className="text-xs font-semibold text-gray-700">{r.reporter?.name}</p>
                      <p className="text-[10px] text-gray-400">{r.reporter?.email}</p>
                    </div>

                    {/* Target listing */}
                    {r.listing && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Listing</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-gray-700 truncate max-w-[160px]">{r.listing.title}</p>
                          <Link to={`/listing/${r.listing.id}`} target="_blank" className="text-gray-400 hover:text-gray-700">
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                        <span className="text-[10px]" style={{ color: r.listing.status === 'active' ? '#15803d' : '#9ca3af' }}>
                          {r.listing.status}
                        </span>
                      </div>
                    )}

                    {/* Target seller */}
                    {r.seller && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Seller</p>
                        <p className="text-xs font-semibold text-gray-700">{r.seller.name}</p>
                        <p className="text-[10px] text-gray-400">{r.seller.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f0eeeb' }}>
                  <button onClick={() => updateReport({ id: r.id, status: 'reviewed' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Reviewed
                  </button>
                  <button onClick={() => setActionModal(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: '#dcfce7', color: '#15803d' }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Take Action
                  </button>
                  <button onClick={() => updateReport({ id: r.id, status: 'dismissed' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ml-auto"
                    style={{ background: '#f3f4f6', color: '#6b7280' }}>
                    <XCircle className="w-3.5 h-3.5" /> Dismiss
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <ActionModal
          report={actionModal}
          onClose={() => setActionModal(null)}
          onSubmit={(action_taken, remove_listing) =>
            updateReport({ id: actionModal.id, status: 'actioned', action_taken, remove_listing })
          }
        />
      )}
    </div>
  )
}

function ActionModal({ report, onClose, onSubmit }) {
  const [action, setAction] = useState('')
  const [remove, setRemove] = useState(false)
  const ACTIONS = ['Warning sent to seller', 'Listing removed for policy violation', 'Seller account suspended', 'Content edited by admin', 'Referred to law enforcement']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Take Action</h3>
        <div className="space-y-2 mb-4">
          {ACTIONS.map((a) => (
            <button key={a} onClick={() => setAction(a)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all"
              style={action === a ? { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' } : { background: '#fafaf9', border: '1px solid #f0eeeb', color: '#6b7280' }}>
              {a}
            </button>
          ))}
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Or type a custom action…"
            className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none" style={{ border: '1px solid #e5e7eb' }} />
        </div>
        {report.listing && (
          <label className="flex items-center gap-2 text-xs text-gray-600 mb-4">
            <input type="checkbox" checked={remove} onChange={(e) => setRemove(e.target.checked)} className="rounded" />
            Also remove the reported listing from the platform
          </label>
        )}
        <div className="flex gap-2">
          <button onClick={() => onSubmit(action, remove)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#15803d' }}>
            Confirm Action
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  )
}
