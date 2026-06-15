import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, Package, Search, TrendingUp,
  ArrowUpRight, AlertCircle, UserCheck, Zap,
  Clock, ExternalLink, CheckCircle, ChevronDown,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../services/api'

const RANGES = [
  { label: '1D',  days: 1 },
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y',  days: 365 },
]
const fmtDate = (d) => d.toISOString().slice(0, 10)

function fmtCompact(n) {
  const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) : Number(n)
  if (isNaN(num)) return n
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`
  return num.toLocaleString()
}

const MOCK = {
  users:    { total: 4821, today: 12, week: 84, verified: 1340, trend: [] },
  listings: { total: 52400, active: 48200, today: 47, week: 312, trend: [] },
  searches: { month: 38470, today: 623, top: [
    { display_query: 'toyota corolla', count: 289 },
    { display_query: 'iphone 15', count: 241 },
    { display_query: '2 bedroom apartment', count: 198 },
    { display_query: 'generator', count: 176 },
    { display_query: 'samsung tv', count: 154 },
  ], zero_results_gaps: 23 },
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/analytics/admin/dashboard').then((r) => r.data.data),
    refetchInterval: 60000,
  })

  if (isLoading || !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#B81365', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-black text-gray-900"
          style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
        >
          Platform Overview
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Live snapshot of everything happening on HOOVA.</p>
      </div>

      {/* KPI row — joined bar */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0" style={{ '--tw-divide-opacity': 1, borderColor: '#f0eeeb' }}>
          <KpiCard
            icon={<Users className="w-4 h-4" style={{ color: '#B81365' }} />}
            label="Total Users"
            value={data.users.total}
            delta={`+${fmtCompact(data.users.today)} today`}
            deltaColor="green"
          />
          <KpiCard
            icon={<UserCheck className="w-4 h-4 text-green-500" />}
            label="Verified Sellers"
            value={data.users.verified}
            delta={`${((data.users.verified / data.users.total) * 100).toFixed(0)}% of users`}
          />
          <KpiCard
            icon={<Package className="w-4 h-4 text-blue-500" />}
            label="Active Listings"
            value={data.listings.active}
            delta={`+${fmtCompact(data.listings.today)} today`}
            deltaColor="green"
          />
          <KpiCard
            icon={<Search className="w-4 h-4 text-purple-500" />}
            label="Searches (30d)"
            value={data.searches.month}
            delta={`${fmtCompact(data.searches.today)} today`}
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendCard title="New Users"    type="users"    unit="users joined"    color="#B81365" badgeBg="#fdf2f5" badgeColor="#B81365" />
        <TrendCard title="New Listings" type="listings" unit="listings posted" color="#3b82f6" badgeBg="#eff6ff" badgeColor="#1d4ed8" />
      </div>

      {/* Recent activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recently joined users */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#B81365' }} />
              <p className="text-sm font-bold text-gray-800">Recently Joined</p>
            </div>
            <Link to="/admin/users" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: '#B81365' }}>
              All users <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(data.recent_users || []).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden" style={{ background: '#B81365' }}>
                  {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                    {u.id_verified && <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />}
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize shrink-0"
                      style={{ background: u.subscription_tier === 'business' ? '#fff7ed' : u.subscription_tier === 'pro' ? '#fdf2f5' : '#f3f4f6', color: u.subscription_tier === 'business' ? '#c2410c' : u.subscription_tier === 'pro' ? '#B81365' : '#9ca3af' }}>
                      {u.subscription_tier}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                </div>
                <p className="text-[10px] text-gray-400 shrink-0 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(u.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recently listed items */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-bold text-gray-800">Recently Listed</p>
            </div>
            <Link to="/admin/listings" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: '#B81365' }}>
              All listings <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(data.recent_listings || []).map((l) => {
              const statusColor = { active: '#15803d', pending: '#854d0e', sold: '#7e22ce', expired: '#9ca3af', soft_live: '#1d4ed8' }
              return (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center" style={{ background: '#ECEAE6' }}>
                    {l.images?.[0]?.url
                      ? <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{l.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-gray-400">{l.seller?.name}</p>
                      {l.category && <span className="text-[9px] text-gray-300">· {l.category.name}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-900">{l.currency} {l.price?.toLocaleString()}</p>
                    <span className="text-[9px] font-bold capitalize" style={{ color: statusColor[l.status] || '#9ca3af' }}>{l.status}</span>
                  </div>
                  <Link to={`/listing/${l.id}`} target="_blank" className="p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top searches */}
        <div className="lg:col-span-2 rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: '#B81365' }} />
              <p className="text-sm font-bold text-gray-800">Trending Searches</p>
            </div>
            <Link
              to="/admin/search"
              className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
              style={{ color: '#B81365' }}
            >
              Full report <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(data.searches.top || []).map((t, i) => (
              <div key={t.display_query} className="flex items-center gap-3">
                <span
                  className="w-5 text-center text-xs font-black shrink-0"
                  style={{ color: i < 3 ? '#B81365' : '#d1d5db' }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 capitalize font-medium truncate">
                  {t.display_query}
                </span>
                <span className="text-xs font-bold text-gray-400 shrink-0">
                  {t.count?.toLocaleString()}×
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: '#B81365' }}
          >
            <Zap className="w-5 h-5 text-white/60 mb-3" />
            <p className="text-white font-black text-2xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {data.listings.active?.toLocaleString()}
            </p>
            <p className="text-pink-200 text-xs mt-0.5">Active listings live right now</p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: '#ECEAE6' }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 mb-3" />
            <p className="text-gray-900 font-black text-2xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {data.searches.zero_results_gaps}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Searches with zero results</p>
            <Link
              to="/admin/search"
              className="text-xs font-bold mt-2 block hover:underline"
              style={{ color: '#B81365' }}
            >
              View unmet demand →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, delta, deltaColor = 'gray' }) {
  const colors = { green: '#15803d', gray: '#9ca3af', red: '#dc2626' }
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#ECEAE6' }}>
          {icon}
        </div>
        <span className="text-[11px] text-gray-500 font-medium leading-tight">{label}</span>
      </div>
      <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {fmtCompact(value)}
      </p>
      {delta && (
        <p className="text-[11px] mt-0.5 font-medium" style={{ color: colors[deltaColor] }}>
          {delta}
        </p>
      )}
    </div>
  )
}

function TrendCard({ title, type, unit, color, badgeBg, badgeColor }) {
  const [days, setDays]         = useState(7)
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')
  const [useCustom, setUseCustom]   = useState(false)

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'trend', type, useCustom ? 'custom' : days, customFrom, customTo],
    queryFn: () => {
      const params = new URLSearchParams({ type })
      if (useCustom && customFrom && customTo) {
        params.set('from', customFrom)
        params.set('to', customTo)
      } else {
        params.set('days', days)
      }
      return api.get(`/analytics/admin/trend?${params}`).then((r) => r.data.data)
    },
  })

  const chartData = (data?.trend || []).map((d) => ({ day: d.day?.slice(5), count: d.count }))
  const total = data?.total ?? 0

  const periodLabel = useCustom
    ? `${customFrom} → ${customTo}`
    : days === 1 ? 'today' : `last ${days} days`

  function applyCustom() {
    if (customFrom && customTo) { setUseCustom(true); setShowCustom(false) }
  }
  function pickRange(d) {
    setDays(d); setUseCustom(false); setShowCustom(false)
  }

  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: color, borderTopColor: 'transparent' }} />}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: badgeBg, color: badgeColor }}>
            {total.toLocaleString()} {unit}
          </span>
        </div>
      </div>

      {/* Range buttons */}
      <div className="flex items-center gap-1 mb-3">
        {RANGES.map((r) => (
          <button key={r.days} onClick={() => pickRange(r.days)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
            style={!useCustom && days === r.days ? { background: color, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
            {r.label}
          </button>
        ))}
        <div className="relative">
          <button onClick={() => setShowCustom((s) => !s)}
            className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
            style={useCustom ? { background: color, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
            Custom <ChevronDown className="w-3 h-3" />
          </button>
          {showCustom && (
            <div className="absolute right-0 top-8 z-20 rounded-xl shadow-xl p-3 bg-white space-y-2" style={{ border: '1px solid #e5e7eb', minWidth: 220 }}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">From</label>
                  <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border focus:outline-none" style={{ border: '1px solid #e5e7eb' }} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">To</label>
                  <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border focus:outline-none" style={{ border: '1px solid #e5e7eb' }} />
                </div>
              </div>
              <button onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                style={{ background: color }}>
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-xs text-gray-400">No data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
              interval={chartData.length > 30 ? Math.floor(chartData.length / 10) : 0} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2' }}
            />
            <Area
              type="monotone" dataKey="count" stroke={color} strokeWidth={2}
              fill={`url(#grad-${type})`} dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
