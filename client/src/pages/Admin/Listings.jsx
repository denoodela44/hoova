import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Package, Search, Trash2, Eye, CheckCircle,
  XCircle, Clock, Zap, ExternalLink, ChevronLeft, ChevronRight,
  AlertTriangle, TrendingUp, BarChart2, ArrowUpDown, Tag,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts'
import api from '../../services/api'

const MOCK_STATS = {
  total: 52400, active: 48200, pending: 134, sold: 4066,
  flagged: 23, avg_price: 4820, views_total: 1284000,
  new_today: 48,
}

const MOCK_CATEGORY_BREAKDOWN = [
  { name: 'Vehicles',     count: 14200, color: '#B81365' },
  { name: 'Electronics',  count: 11800, color: '#7e22ce' },
  { name: 'Property',     count: 9400,  color: '#1d4ed8' },
  { name: 'Phones',       count: 5800,  color: '#c2410c' },
  { name: 'Fashion',      count: 6200,  color: '#854d0e' },
  { name: 'Furniture',    count: 2700,  color: '#15803d' },
  { name: 'Agriculture',  count: 1900,  color: '#0e7490' },
  { name: 'Other',        count: 3100,  color: '#6b7280' },
]

const MOCK_TREND = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }),
  listings: Math.floor(Math.random() * 80) + 20,
}))

const MOCK_LISTINGS = Array.from({ length: 20 }, (_, i) => ({
  id: `l${i}`,
  title: ['2019 Toyota Corolla LE', 'iPhone 15 Pro Max 256GB', '2-Bed Apt East Legon', 'Samsung 55" QLED', 'Honda Generator'][i % 5],
  price: [28000, 6500, 3200, 4800, 2100][i % 5],
  currency: 'GHS',
  status: ['active', 'active', 'pending', 'sold', 'active'][i % 5],
  boost_tier: [null, 'featured', null, null, 'spotlight'][i % 5],
  is_flagged: i % 9 === 0,
  views_count: Math.floor(Math.random() * 800 + 50),
  saves_count: Math.floor(Math.random() * 40),
  inquiries_count: Math.floor(Math.random() * 15),
  created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  images: [],
  category: { name: ['Vehicles', 'Phones', 'Property', 'Electronics', 'Appliances'][i % 5] },
  seller: {
    id: `u${i}`,
    name: ['Kwame Motors', 'TechHub GH', 'HomePro', 'ElectroCity', 'PowerZone'][i % 5],
    email: `seller${i}@example.com`,
    subscription_tier: ['free', 'pro', 'business', 'free', 'pro'][i % 5],
    id_verified: i % 2 === 0,
  },
}))

const STATUS_META = {
  active:    { label: 'Active',    bg: '#dcfce7', color: '#15803d' },
  pending:   { label: 'Pending',   bg: '#fef9c3', color: '#854d0e' },
  soft_live: { label: 'Soft-Live', bg: '#eff6ff', color: '#1d4ed8' },
  sold:      { label: 'Sold',      bg: '#f5f3ff', color: '#7e22ce' },
  expired:   { label: 'Expired',   bg: '#f3f4f6', color: '#6b7280' },
}

const TIER_META = {
  featured:  { label: 'Featured',  bg: '#fdf4ff', color: '#7e22ce' },
  spotlight: { label: 'Spotlight', bg: '#fff7ed', color: '#c2410c' },
  top:       { label: 'Top',       bg: '#fef9c3', color: '#854d0e' },
}

const STATUS_OPTIONS = ['all', 'active', 'pending', 'soft_live', 'sold', 'expired', 'flagged']
const SORT_OPTIONS   = [
  { value: 'newest',     label: 'Newest' },
  { value: 'oldest',     label: 'Oldest' },
  { value: 'views_desc', label: 'Most Viewed' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'price_asc',  label: 'Price ↑' },
]

export default function AdminListings() {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [q, setQ]               = useState('')
  const [status, setStatus]     = useState('all')
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState('newest')
  const [category, setCategory] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(true)

  const { data } = useQuery({
    queryKey: ['admin', 'listings', page, status, search, sort, category],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ page, limit: 20, sort })
        if (status !== 'all') params.set('status', status === 'flagged' ? 'all' : status)
        if (status === 'flagged') params.set('flagged', 'true')
        if (search) params.set('q', search)
        if (category) params.set('category', category)
        return await api.get(`/admin/listings?${params}`).then((r) => r.data.data)
      } catch {
        return { listings: MOCK_LISTINGS, total: 52400, page: 1, totalPages: 2620, stats: MOCK_STATS, category_breakdown: MOCK_CATEGORY_BREAKDOWN, trend: MOCK_TREND }
      }
    },
    keepPreviousData: true,
  })

  const listings          = data?.listings           || MOCK_LISTINGS
  const stats             = data?.stats              || MOCK_STATS
  const totalPages        = data?.totalPages         || 1
  const categoryBreakdown = data?.category_breakdown || MOCK_CATEGORY_BREAKDOWN
  const trend             = data?.trend              || MOCK_TREND

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/listings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })

  const { mutate: deleteListing } = useMutation({
    mutationFn: (id) => api.delete(`/admin/listings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })

  const handleSearch = (e) => { e.preventDefault(); setSearch(q); setPage(1) }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
            Listings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Review, moderate, and analyse all listings on the platform.</p>
        </div>
        <button onClick={() => setShowAnalytics((s) => !s)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={showAnalytics ? { background: '#B81365', color: 'white' } : { background: '#ECEAE6', color: '#6b7280' }}>
          <BarChart2 className="w-3.5 h-3.5" />
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total',       value: stats.total,       color: '#B81365',  bg: '#fdf2f5' },
          { label: 'Active',      value: stats.active,      color: '#15803d',  bg: '#dcfce7' },
          { label: 'Pending',     value: stats.pending,     color: '#854d0e',  bg: '#fef9c3' },
          { label: 'Sold',        value: stats.sold,        color: '#7e22ce',  bg: '#f5f3ff' },
          { label: 'Flagged',     value: stats.flagged,     color: '#dc2626',  bg: '#fef2f2' },
          { label: 'New Today',   value: stats.new_today,   color: '#1d4ed8',  bg: '#eff6ff' },
          { label: 'Avg Price',   value: `GHS ${(stats.avg_price || 0).toLocaleString()}`, color: '#0e7490', bg: '#ecfeff', raw: true },
          { label: 'Total Views', value: (stats.views_total || 0) >= 1000 ? `${((stats.views_total || 0) / 1000).toFixed(0)}K` : stats.views_total, color: '#6b7280', bg: '#f3f4f6' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-3 bg-white" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-[10px] text-gray-400 font-medium mb-1">{label}</p>
            <p className="text-base font-black" style={{ fontFamily: "'Poppins', sans-serif", color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
          </div>
        ))}
      </div>

      {/* Analytics panels */}
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily posting trend */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-800">Listings Posted — last 14 days</p>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="listGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#B81365" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B81365" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }} />
                <Area type="monotone" dataKey="listings" stroke="#B81365" strokeWidth={2} fill="url(#listGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-sm font-bold text-gray-800 mb-4">Listings by Category</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryBreakdown} layout="vertical" barSize={10}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color || '#B81365'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top listings by views */}
          <div className="lg:col-span-3 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-sm font-bold text-gray-800 mb-3">Top 5 Listings by Views</p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5).map((l, i) => {
                const maxViews = listings[0]?.views_count || 1
                const pct = Math.round(((l.views_count || 0) / maxViews) * 100)
                return (
                  <div key={l.id} className="rounded-xl p-3" style={{ background: '#fafaf9', border: '1px solid #f0eeeb' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-black text-gray-300">#{i + 1}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#fdf2f5', color: '#B81365' }}>
                        {(l.views_count || 0).toLocaleString()} views
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-2">{l.title}</p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#B81365' }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">{l.saves_count || 0} saves</span>
                      <span className="text-[10px] text-gray-400">{l.inquiries_count || 0} chats</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title or seller…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ border: '1px solid #e5e7eb' }} />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#B81365' }}>
              Search
            </button>
          </form>

          <div className="flex gap-2 flex-wrap">
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none"
              style={{ border: '1px solid #e5e7eb', color: '#374151' }}>
              <option value="">All Categories</option>
              {MOCK_CATEGORY_BREAKDOWN.map((c) => (
                <option key={c.name} value={c.name.toLowerCase()}>{c.name}</option>
              ))}
            </select>

            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none"
              style={{ border: '1px solid #e5e7eb', color: '#374151' }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={status === s
                ? { background: s === 'flagged' ? '#dc2626' : '#B81365', color: 'white' }
                : { background: '#ECEAE6', color: '#6b7280' }}>
              {s === 'soft_live' ? 'Soft-Live' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#fafaf9', borderBottom: '1px solid #f0eeeb' }}>
                {['Listing', 'Category', 'Seller', 'Price', 'Status', 'Boost', 'Views / Saves / Chats', 'Posted', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((l, i) => {
                const sm = STATUS_META[l.status] || STATUS_META.expired
                const bm = l.boost_tier ? TIER_META[l.boost_tier] : null
                return (
                  <tr key={l.id}
                    style={{ borderBottom: i < listings.length - 1 ? '1px solid #f0eeeb' : 'none' }}
                    className="hover:bg-gray-50 transition-colors">

                    {/* Listing */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center" style={{ background: '#ECEAE6' }}>
                          {l.images?.[0]?.url
                            ? <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                            : <Package className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[180px] text-xs">{l.title}</p>
                          {l.is_flagged && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
                              <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Tag className="w-3 h-3" />{l.category?.name || '—'}
                      </span>
                    </td>

                    {/* Seller */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-[110px] text-xs">{l.seller?.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <TierBadge tier={l.seller?.subscription_tier} />
                        {l.seller?.id_verified && (
                          <span className="text-[9px] font-bold text-green-600">✓ ID</span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap text-xs">
                      {l.currency} {l.price?.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                    </td>

                    {/* Boost */}
                    <td className="px-4 py-3">
                      {bm ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 w-fit" style={{ background: bm.bg, color: bm.color }}>
                          <Zap className="w-2.5 h-2.5" />{bm.label}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Engagement */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                        <Eye className="w-3 h-3 text-gray-400" />
                        {(l.views_count || 0).toLocaleString()}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {l.saves_count || 0} saves · {l.inquiries_count || 0} chats
                      </p>
                      {/* Engagement bar */}
                      <div className="mt-1 h-1 rounded-full overflow-hidden w-20" style={{ background: '#ECEAE6' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((l.views_count || 0) / 800) * 100)}%`, background: '#B81365' }} />
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/listing/${l.id}`} target="_blank"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {(l.status === 'pending' || l.status === 'soft_live') && (
                          <button onClick={() => updateStatus({ id: l.id, status: 'active' })}
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="Approve">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {l.status === 'active' && (
                          <button onClick={() => updateStatus({ id: l.id, status: 'expired' })}
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Deactivate">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { if (confirm(`Delete "${l.title}"?`)) deleteListing(l.id) }}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Delete">
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
    </div>
  )
}

function TierBadge({ tier }) {
  const MAP = {
    free:     { label: 'Free',     color: '#9ca3af' },
    pro:      { label: 'Pro',      color: '#B81365' },
    business: { label: 'Business', color: '#854d0e' },
    admin:    { label: 'Admin',    color: '#1d4ed8' },
  }
  const m = MAP[tier] || MAP.free
  return <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.label}</span>
}
