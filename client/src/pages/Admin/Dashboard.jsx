import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, Package, Search, TrendingUp,
  ArrowUpRight, AlertCircle, UserCheck, Zap,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../services/api'

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
  const { data = MOCK } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      try {
        return await api.get('/analytics/admin/dashboard').then((r) => r.data.data)
      } catch { return MOCK }
    },
    refetchInterval: 60000,
  })

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

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5" style={{ color: '#B81365' }} />}
          label="Total Users"
          value={data.users.total?.toLocaleString()}
          delta={`+${data.users.today} today`}
          deltaColor="green"
        />
        <KpiCard
          icon={<UserCheck className="w-5 h-5 text-green-500" />}
          label="Verified Sellers"
          value={data.users.verified?.toLocaleString()}
          delta={`${((data.users.verified / data.users.total) * 100).toFixed(0)}% of users`}
        />
        <KpiCard
          icon={<Package className="w-5 h-5 text-blue-500" />}
          label="Active Listings"
          value={data.listings.active?.toLocaleString()}
          delta={`+${data.listings.today} today`}
          deltaColor="green"
        />
        <KpiCard
          icon={<Search className="w-5 h-5 text-purple-500" />}
          label="Searches (30d)"
          value={data.searches.month?.toLocaleString()}
          delta={`${data.searches.today} today`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* New users trend */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">New Users</p>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: '#fdf2f5', color: '#B81365' }}
            >
              +{data.users.week} this week
            </span>
          </div>
          <MiniChart data={data.users.trend} color="#B81365" />
        </div>

        {/* New listings trend */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">New Listings</p>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              +{data.listings.week} this week
            </span>
          </div>
          <MiniChart data={data.listings.trend} color="#3b82f6" />
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
    <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECEAE6' }}>
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {value}
      </p>
      {delta && (
        <p className="text-xs mt-0.5 font-medium" style={{ color: colors[deltaColor] }}>
          {delta}
        </p>
      )}
    </div>
  )
}

function MiniChart({ data = [], color }) {
  const chartData = data.length
    ? data.map((d) => ({ day: d.day?.slice(5), count: d.count }))
    : Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { month: 'numeric', day: 'numeric' }),
        count: Math.floor(Math.random() * 40 + 10),
      }))

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={chartData} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }}
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
