import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, Clock, CheckCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const TIER_META = {
  featured:  { label: 'Featured',  bg: '#f5f3ff', color: '#7e22ce', price: 30 },
  spotlight: { label: 'Spotlight', bg: '#fff7ed', color: '#c2410c', price: 60 },
  top:       { label: 'Top',       bg: '#fefce8', color: '#854d0e', price: 100 },
}

const MOCK_STATS = { active_now: 34, by_tier: [
  { tier: 'featured',  count: 18, revenue: 540  },
  { tier: 'spotlight', count: 11, revenue: 660  },
  { tier: 'top',       count: 5,  revenue: 500  },
]}

const MOCK_BOOSTS = Array.from({ length: 15 }, (_, i) => ({
  id: `b${i}`,
  tier: ['featured', 'spotlight', 'top'][i % 3],
  paid: i % 4 !== 3,
  amount: [30, 60, 100][i % 3],
  starts_at: new Date(Date.now() - i * 86400000).toISOString(),
  ends_at:   new Date(Date.now() + (7 - i) * 86400000).toISOString(),
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  listing: {
    id: `l${i}`, title: ['2019 Toyota Corolla', 'iPhone 15 Pro', '2-Bed Apartment'][i % 3],
    status: 'active', images: [],
    seller: { id: `u${i}`, name: ['Kwame Motors', 'TechHub GH', 'HomePro'][i % 3], email: `seller${i}@hoova.gh` },
  },
}))

export default function AdminBoosts() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [paid, setPaid]   = useState('all')
  const [tier, setTier]   = useState('all')

  const { data } = useQuery({
    queryKey: ['admin', 'boosts', page, paid, tier],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ page, limit: 20 })
        if (paid !== 'all') params.set('paid', paid)
        if (tier !== 'all') params.set('tier', tier)
        return await api.get(`/admin/boosts?${params}`).then((r) => r.data.data)
      } catch {
        return { boosts: MOCK_BOOSTS, total: 15, page: 1, totalPages: 1, stats: MOCK_STATS }
      }
    },
  })

  const boosts     = data?.boosts     || MOCK_BOOSTS
  const stats      = data?.stats      || MOCK_STATS
  const totalPages = data?.totalPages || 1

  const { mutate: approvePaid } = useMutation({
    mutationFn: (id) => api.patch(`/admin/boosts/${id}`, { paid: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'boosts'] }),
  })

  const totalRevenue = stats.by_tier?.reduce((s, t) => s + t.revenue, 0) || 0

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>Boosts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage listing promotions and boost payments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <Zap className="w-4 h-4 text-purple-500 mb-2" />
          <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{stats.active_now}</p>
          <p className="text-xs text-gray-500">Active Boosts</p>
        </div>
        <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>GHS {totalRevenue?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Boost Revenue</p>
        </div>
        {stats.by_tier?.map((t) => {
          const m = TIER_META[t.tier] || {}
          return (
            <div key={t.tier} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #f0eeeb' }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block capitalize" style={{ background: m.bg, color: m.color }}>{t.tier}</span>
              <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.count}</p>
              <p className="text-[10px] text-gray-400">GHS {t.revenue?.toLocaleString()} revenue</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#ECEAE6' }}>
          {['all', 'true', 'false'].map((v) => (
            <button key={v} onClick={() => { setPaid(v); setPage(1) }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={paid === v ? { background: 'white', color: '#B81365', boxShadow: '0 1px 3px rgba(0,0,0,.1)' } : { color: '#6b7280' }}>
              {v === 'all' ? 'All' : v === 'true' ? 'Paid' : 'Pending'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#ECEAE6' }}>
          {['all', 'featured', 'spotlight', 'top'].map((v) => (
            <button key={v} onClick={() => { setTier(v); setPage(1) }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={tier === v ? { background: 'white', color: '#B81365', boxShadow: '0 1px 3px rgba(0,0,0,.1)' } : { color: '#6b7280' }}>
              {v}
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
                {['Listing', 'Seller', 'Tier', 'Amount', 'Status', 'Period', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boosts.map((b, i) => {
                const m = TIER_META[b.tier] || {}
                const expired = new Date(b.ends_at) < new Date()
                return (
                  <tr key={b.id} style={{ borderBottom: i < boosts.length - 1 ? '1px solid #f0eeeb' : 'none' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden" style={{ background: '#ECEAE6' }}>
                          {b.listing?.images?.[0]?.url && <img src={b.listing.images[0].url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[150px] text-xs">{b.listing?.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{b.listing?.seller?.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: m.bg, color: m.color }}>{b.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-800">GHS {b.amount}</td>
                    <td className="px-4 py-3">
                      {b.paid
                        ? <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle className="w-3 h-3" />{expired ? 'Expired' : 'Live'}</span>
                        : <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Clock className="w-3 h-3" />Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-gray-400">
                      <p>{new Date(b.starts_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</p>
                      <p>→ {new Date(b.ends_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/listing/${b.listing?.id}`} target="_blank" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {!b.paid && (
                          <button onClick={() => approvePaid(b.id)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: '#15803d' }}>
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #f0eeeb', background: '#fafaf9' }}>
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
