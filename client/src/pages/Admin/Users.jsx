import { useState } from 'react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, Search, ShieldCheck, ShieldOff, UserCheck,
  ExternalLink, ChevronLeft, ChevronRight, Crown, Trash2,
  TrendingUp, AlertTriangle, X, Eye, Star, Package,
  Ban, Mail, Phone, MessageSquare, BarChart2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import api from '../../services/api'

const MOCK_STATS = { total: 4821, verified: 1340, pro_plus: 287, new_today: 12, banned: 5, churn_risk: 38 }

const MOCK_GROWTH = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }),
  signups: Math.floor(Math.random() * 30) + 5,
}))

const MOCK_TIER_DIST = [
  { tier: 'Free',     count: 4474, color: '#9ca3af' },
  { tier: 'Pro',      count: 251,  color: '#B81365' },
  { tier: 'Business', count: 60,   color: '#c2410c' },
  { tier: 'Admin',    count: 4,    color: '#1d4ed8' },
]

const MOCK_USERS = Array.from({ length: 20 }, (_, i) => ({
  id: `u${i}`,
  name: ['Kwame Asante', 'Ama Owusu', 'Kofi Mensah', 'Abena Boateng', 'Yaw Darko'][i % 5],
  email: `user${i}@example.com`,
  phone: `+23320${String(i).padStart(7, '0')}`,
  avatar: null,
  subscription_tier: ['free', 'free', 'pro', 'business', 'free'][i % 5],
  id_verified: i % 3 === 0,
  email_verified: true,
  phone_verified: i % 2 === 0,
  is_banned: i === 7,
  rating_avg: parseFloat((3.5 + Math.random()).toFixed(1)),
  review_count: Math.floor(Math.random() * 30),
  listing_count: Math.floor(Math.random() * 50 + 1),
  reports_received: i % 11 === 0 ? Math.floor(Math.random() * 5) + 2 : 0,
  store_slug: i % 3 === 0 ? `seller-store-${i}` : null,
  store_name: i % 3 === 0 ? `Store ${i}` : null,
  last_active_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  created_at: new Date(Date.now() - i * 86400000 * 14).toISOString(),
}))

const TIER_OPTIONS = ['all', 'free', 'pro', 'business']
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'listings', label: 'Most Listings' },
  { value: 'rating',   label: 'Highest Rated' },
  { value: 'reports',  label: 'Most Reported' },
]

const TIER_COLORS = {
  free:     { bg: '#f3f4f6', color: '#6b7280',  label: 'Free' },
  pro:      { bg: '#fdf2f5', color: '#B81365',  label: 'Pro' },
  business: { bg: '#fff7ed', color: '#c2410c',  label: 'Business' },
  admin:    { bg: '#eff6ff', color: '#1d4ed8',  label: 'Admin' },
}

function timeAgoShort(date) {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1d ago'
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [q, setQ]                 = useState('')
  const [search, setSearch]       = useState('')
  const [tier, setTier]           = useState('all')
  const [verified, setVerified]   = useState('all')
  const [sort, setSort]           = useState('newest')
  const [tierModal, setTierModal] = useState(null)
  const [drawer, setDrawer]       = useState(null)   // user object
  const [confirmState, setConfirmState] = useState(null)
  const [showCharts, setShowCharts] = useState(true)

  const { data } = useQuery({
    queryKey: ['admin', 'users', page, tier, verified, search, sort],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ page, limit: 20, sort })
        if (tier !== 'all') params.set('tier', tier)
        if (verified !== 'all') params.set('verified', verified)
        if (search) params.set('q', search)
        return await api.get(`/admin/users?${params}`).then((r) => r.data.data)
      } catch {
        return { users: MOCK_USERS, total: 4821, page: 1, totalPages: 242, stats: MOCK_STATS, growth: MOCK_GROWTH, tier_distribution: MOCK_TIER_DIST }
      }
    },
    keepPreviousData: true,
  })

  const users       = data?.users             || MOCK_USERS
  const stats       = data?.stats             || MOCK_STATS
  const totalPages  = data?.totalPages        || 1
  const growth      = data?.growth            || MOCK_GROWTH
  const tierDist    = data?.tier_distribution || MOCK_TIER_DIST
  const totalTier   = tierDist.reduce((s, t) => s + t.count, 0)

  const { mutate: updateUser } = useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/admin/users/${id}`, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setDrawer(null) },
  })

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setDrawer(null) },
  })

  const handleSearch = (e) => { e.preventDefault(); setSearch(q); setPage(1) }

  const suspiciousUsers = users.filter((u) => u.reports_received >= 2)

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage accounts, verify sellers, and monitor activity.</p>
        </div>
        <button onClick={() => setShowCharts((s) => !s)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={showCharts ? { background: '#B81365', color: 'white' } : { background: '#ECEAE6', color: '#6b7280' }}>
          <BarChart2 className="w-3.5 h-3.5" />
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Users',   value: stats.total,       color: '#B81365', bg: '#fdf2f5' },
          { label: 'ID Verified',   value: stats.verified,    color: '#15803d', bg: '#dcfce7' },
          { label: 'Paid Plans',    value: stats.pro_plus,    color: '#c2410c', bg: '#fff7ed' },
          { label: 'New Today',     value: stats.new_today,   color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Banned',        value: stats.banned,      color: '#dc2626', bg: '#fef2f2' },
          { label: 'Churn Risk',    value: stats.churn_risk,  color: '#854d0e', bg: '#fefce8' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-[10px] text-gray-400 font-medium mb-1">{label}</p>
            <p className="text-xl font-black" style={{ fontFamily: "'Poppins', sans-serif", color }}>{value?.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Analytics charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Signup trend */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-800">New Signups — last 14 days</p>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#B81365" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B81365" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }} />
                <Area type="monotone" dataKey="signups" stroke="#B81365" strokeWidth={2} fill="url(#signupGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tier distribution */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-sm font-bold text-gray-800 mb-4">Users by Plan</p>
            <div className="space-y-3">
              {tierDist.map((t) => {
                const pct = totalTier ? Math.round((t.count / totalTier) * 100) : 0
                return (
                  <div key={t.tier}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{t.tier}</span>
                      <span className="text-gray-400">{t.count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Suspicious users alert */}
          {suspiciousUsers.length > 0 && (
            <div className="lg:col-span-3 rounded-2xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-bold text-red-700">{suspiciousUsers.length} users flagged by reports</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suspiciousUsers.map((u) => (
                  <button key={u.id} onClick={() => setDrawer(u)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-red-700"
                    style={{ border: '1px solid #fecaca' }}>
                    <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-black text-[10px] shrink-0">
                      {u.name?.[0]}
                    </span>
                    {u.name}
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">{u.reports_received} reports</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none"
              style={{ border: '1px solid #e5e7eb' }} />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#B81365' }}>
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#ECEAE6' }}>
            {TIER_OPTIONS.map((t) => (
              <button key={t} onClick={() => { setTier(t); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={tier === t ? { background: 'white', color: '#B81365', boxShadow: '0 1px 3px rgba(0,0,0,.1)' } : { color: '#6b7280' }}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#ECEAE6' }}>
            {['all', 'true', 'false'].map((v) => (
              <button key={v} onClick={() => { setVerified(v); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={verified === v ? { background: 'white', color: '#B81365', boxShadow: '0 1px 3px rgba(0,0,0,.1)' } : { color: '#6b7280' }}>
                {v === 'all' ? 'All' : v === 'true' ? 'Verified' : 'Unverified'}
              </button>
            ))}
          </div>

          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none"
            style={{ border: '1px solid #e5e7eb', color: '#374151' }}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#fafaf9', borderBottom: '1px solid #f0eeeb' }}>
                {['User', 'Contact', 'Tier', 'Verified', 'Listings', 'Rating', 'Last Active', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const tierMeta = TIER_COLORS[u.subscription_tier] || TIER_COLORS.free
                const isSuspicious = u.reports_received >= 2
                return (
                  <tr key={u.id}
                    style={{ borderBottom: i < users.length - 1 ? '1px solid #f0eeeb' : 'none', opacity: u.is_banned ? 0.5 : 1 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDrawer(u)}>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white relative"
                          style={{ background: u.is_banned ? '#9ca3af' : '#B81365' }}>
                          {u.avatar
                            ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            : u.name?.[0]?.toUpperCase()}
                          {u.is_banned && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                              <Ban className="w-2 h-2 text-white" />
                            </span>
                          )}
                          {isSuspicious && !u.is_banned && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-2 h-2 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-xs">{u.name}</p>
                          {u.store_name && <p className="text-[10px] text-gray-400 truncate">{u.store_name}</p>}
                          {u.is_banned && <p className="text-[10px] font-bold text-red-500">Banned</p>}
                          {isSuspicious && !u.is_banned && <p className="text-[10px] font-bold text-amber-500">{u.reports_received} reports</p>}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-gray-700 truncate max-w-[140px]">{u.email || '—'}</p>
                      <p className="text-[10px] text-gray-400">{u.phone || '—'}</p>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: tierMeta.bg, color: tierMeta.color }}>
                        {tierMeta.label}
                      </span>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <VerifiedChip label="ID"    ok={u.id_verified} />
                        <VerifiedChip label="Email" ok={u.email_verified} />
                        <VerifiedChip label="Phone" ok={u.phone_verified} />
                      </div>
                    </td>

                    {/* Listings */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{u.listing_count}</td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      {u.review_count > 0 ? (
                        <div>
                          <span className="text-sm font-bold text-gray-800">★ {u.rating_avg?.toFixed(1)}</span>
                          <p className="text-[10px] text-gray-400">{u.review_count} reviews</p>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {timeAgoShort(u.last_active_at)}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {u.store_slug && (
                          <Link to={`/store/${u.store_slug}`} target="_blank"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => updateUser({ id: u.id, id_verified: !u.id_verified })}
                          className="p-1.5 rounded-lg transition-colors"
                          style={u.id_verified ? { color: '#15803d', background: '#dcfce7' } : { color: '#9ca3af', background: '#f3f4f6' }}
                          title={u.id_verified ? 'Revoke ID' : 'Verify ID'}>
                          {u.id_verified ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setTierModal({ userId: u.id, currentTier: u.subscription_tier })}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Change tier">
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateUser({ id: u.id, is_banned: !u.is_banned })}
                          className="p-1.5 rounded-lg transition-colors"
                          style={u.is_banned ? { color: '#15803d', background: '#dcfce7' } : { color: '#dc2626', background: '#fef2f2' }}
                          title={u.is_banned ? 'Unban user' : 'Ban user'}>
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmState({ message: `Delete "${u.name}"? All their listings will also be deleted.`, onConfirm: () => deleteUser(u.id) })}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Delete user">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #f0eeeb', background: '#fafaf9' }}>
          <p className="text-xs text-gray-500">Page {data?.page || 1} of {totalPages?.toLocaleString()}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User detail drawer */}
      {drawer && (
        <UserDrawer
          user={drawer}
          onClose={() => setDrawer(null)}
          onVerify={() => updateUser({ id: drawer.id, id_verified: !drawer.id_verified })}
          onBan={() => updateUser({ id: drawer.id, is_banned: !drawer.is_banned })}
          onChangeTier={() => { setTierModal({ userId: drawer.id, currentTier: drawer.subscription_tier }); setDrawer(null) }}
          onDelete={() => setConfirmState({ message: `Delete ${drawer.name}? All their listings will also be deleted.`, onConfirm: () => { deleteUser(drawer.id); setDrawer(null) } })}
        />
      )}

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* Change Tier Modal */}
      {tierModal && (
        <TierModal
          currentTier={tierModal.currentTier}
          onClose={() => setTierModal(null)}
          onSelect={(newTier) => { updateUser({ id: tierModal.userId, subscription_tier: newTier }); setTierModal(null) }}
        />
      )}
    </div>
  )
}

/* ─── User Detail Drawer ─────────────────────────────────────────────────────── */
function UserDrawer({ user, onClose, onVerify, onBan, onChangeTier, onDelete }) {
  const tierMeta = {
    free:     { bg: '#f3f4f6', color: '#6b7280', label: 'Free' },
    pro:      { bg: '#fdf2f5', color: '#B81365', label: 'Pro' },
    business: { bg: '#fff7ed', color: '#c2410c', label: 'Business' },
    admin:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Admin' },
  }
  const tm = tierMeta[user.subscription_tier] || tierMeta.free

  const { data: listings = [] } = useQuery({
    queryKey: ['admin', 'user-listings', user.id],
    queryFn: async () => {
      try { return await api.get(`/admin/listings?seller_id=${user.id}&limit=5`).then((r) => r.data.data?.listings || []) }
      catch { return [] }
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#f0eeeb' }}>
          <p className="text-sm font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>User Profile</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
              style={{ background: user.is_banned ? '#9ca3af' : '#B81365' }}>
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" /> : user.name?.[0]}
            </div>
            <div>
              <p className="font-black text-gray-900">{user.name}</p>
              {user.store_name && <p className="text-xs text-gray-400">{user.store_name}</p>}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: tm.bg, color: tm.color }}>{tm.label}</span>
                {user.id_verified && <span className="text-xs font-bold text-green-600 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" />Verified</span>}
                {user.is_banned && <span className="text-xs font-bold text-red-500 flex items-center gap-0.5"><Ban className="w-3 h-3" />Banned</span>}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="rounded-xl p-4 space-y-2.5" style={{ background: '#fafaf9', border: '1px solid #f0eeeb' }}>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-800">{user.email || '—'}</p>
                <p className="text-[10px] text-gray-400">{user.email_verified ? '✓ Verified' : 'Not verified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-800">{user.phone || '—'}</p>
                <p className="text-[10px] text-gray-400">{user.phone_verified ? '✓ Verified' : 'Not verified'}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Listings', value: user.listing_count, icon: Package, color: '#B81365' },
              { label: 'Reviews',  value: user.review_count,  icon: Star,    color: '#854d0e' },
              { label: 'Reports',  value: user.reports_received || 0, icon: AlertTriangle, color: user.reports_received >= 2 ? '#dc2626' : '#9ca3af' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#fafaf9', border: '1px solid #f0eeeb' }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <p className="text-lg font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Rating */}
          {user.review_count > 0 && (
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
              <Star className="w-5 h-5 text-amber-500 fill-current shrink-0" />
              <div>
                <p className="text-sm font-black text-gray-900">{user.rating_avg?.toFixed(1)} / 5.0</p>
                <p className="text-[10px] text-gray-500">Based on {user.review_count} reviews</p>
              </div>
            </div>
          )}

          {/* Recent listings */}
          {listings.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Recent Listings</p>
              <div className="space-y-2">
                {listings.slice(0, 4).map((l) => (
                  <Link key={l.id} to={`/listing/${l.id}`} target="_blank"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50"
                    style={{ border: '1px solid #f0eeeb' }}>
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0" style={{ background: '#ECEAE6' }}>
                      {l.images?.[0]?.url && <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{l.title}</p>
                      <p className="text-[10px] text-gray-400">GHS {l.price?.toLocaleString()} · {l.views_count || 0} views</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Joined: {new Date(user.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {user.store_slug && (
              <p>Store: <Link to={`/store/${user.store_slug}`} target="_blank" className="underline text-gray-500">/store/{user.store_slug}</Link></p>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: '#f0eeeb' }}>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onVerify}
              className="py-2.5 rounded-xl text-xs font-bold transition-all"
              style={user.id_verified ? { background: '#fef2f2', color: '#dc2626' } : { background: '#dcfce7', color: '#15803d' }}>
              {user.id_verified ? 'Revoke Verification' : 'Verify ID'}
            </button>
            <button onClick={onChangeTier}
              className="py-2.5 rounded-xl text-xs font-bold" style={{ background: '#fdf2f5', color: '#B81365' }}>
              Change Plan
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onBan}
              className="py-2.5 rounded-xl text-xs font-bold transition-all"
              style={user.is_banned ? { background: '#dcfce7', color: '#15803d' } : { background: '#fef2f2', color: '#dc2626' }}>
              {user.is_banned ? 'Unban User' : 'Ban User'}
            </button>
            <button onClick={onDelete}
              className="py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifiedChip({ label, ok }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-gray-200'}`} />
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  )
}

function TierModal({ currentTier, onClose, onSelect }) {
  const tiers = [
    { id: 'free',     label: 'Free',     desc: 'Basic access, 5 listings/month' },
    { id: 'pro',      label: 'Pro',      desc: '50 listings, store page, 3 boosts/month' },
    { id: 'business', label: 'Business', desc: 'Unlimited listings, full analytics, priority' },
    { id: 'admin',    label: 'Admin',    desc: 'Full platform access — use with care' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Change Plan Tier</h3>
        <p className="text-xs text-gray-400 mb-5">Current: <span className="font-bold capitalize">{currentTier}</span></p>
        <div className="space-y-2">
          {tiers.map((t) => (
            <button key={t.id} onClick={() => onSelect(t.id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all hover:border-pink-200"
              style={t.id === currentTier ? { border: '2px solid #B81365', background: '#fdf2f5' } : { border: '1px solid #e5e7eb' }}>
              <div>
                <p className="font-bold text-sm text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-400">{t.desc}</p>
              </div>
              {t.id === currentTier && <span className="text-xs font-bold" style={{ color: '#B81365' }}>Current</span>}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
