import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Crown, Star, Eye, Package,
  ArrowUpRight, Zap, Target, BarChart3,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../services/api'


const TIER_COLORS = { free: '#9ca3af', pro: '#B81365', business: '#c2410c', admin: '#1d4ed8' }
const CATEGORY_COLORS = ['#B81365', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

export default function Intelligence() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'intelligence'],
    queryFn: () => api.get('/admin/intelligence').then((r) => r.data.data),
    refetchInterval: 120000,
  })

  if (isLoading || !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#B81365', borderTopColor: 'transparent' }} />
    </div>
  )

  const totalUsers = (data.tier_breakdown || []).reduce((s, t) => s + t.count, 0)
  const proRevenue = (data.tier_breakdown?.find((t) => t.tier === 'pro')?.count || 0) * 50
  const bizRevenue = (data.tier_breakdown?.find((t) => t.tier === 'business')?.count || 0) * 150

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black text-gray-900"
          style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
        >
          Seller Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Performance metrics, subscription health, and growth opportunities.</p>
      </div>

      {/* Revenue snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 text-white" style={{ background: '#B81365' }}>
          <Crown className="w-5 h-5 text-white/60 mb-3" />
          <p className="text-2xl font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
            GHS {(proRevenue + bizRevenue).toLocaleString()}
          </p>
          <p className="text-pink-200 text-xs mt-0.5">Est. monthly subscription revenue</p>
        </div>
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <Target className="w-5 h-5 text-amber-500 mb-3" />
          <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {data.upsell_targets.length}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">Free sellers ripe for upgrade</p>
        </div>
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
          <Zap className="w-5 h-5 text-purple-500 mb-3" />
          <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {((data.tier_breakdown.find((t) => t.tier === 'pro')?.count || 0) +
               (data.tier_breakdown.find((t) => t.tier === 'business')?.count || 0)).toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">Paid subscribers total</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top sellers — spans 2 cols */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: '#B81365' }} />
              <p className="text-sm font-bold text-gray-800">Top Sellers by Views</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.top_sellers.slice(0, 8).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span
                  className="w-5 text-center text-xs font-black shrink-0"
                  style={{ color: i < 3 ? '#B81365' : '#d1d5db' }}
                >
                  {i + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#B81365' }}
                >
                  {s.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                    {s.id_verified && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>✓</span>
                    )}
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: s.subscription_tier === 'business' ? '#fff7ed' : s.subscription_tier === 'pro' ? '#fdf2f5' : '#f3f4f6', color: TIER_COLORS[s.subscription_tier] }}
                    >
                      {s.subscription_tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" /> {s.total_views?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Package className="w-2.5 h-2.5" /> {s.active_listings} active
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> {s.rating_avg} ({s.review_count})
                    </span>
                  </div>
                </div>
                {s.store_slug && (
                  <Link
                    to={`/store/${s.store_slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Tier breakdown */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-sm font-bold text-gray-800 mb-4">User Tier Breakdown</p>
            <div className="space-y-3">
              {data.tier_breakdown.map((t) => {
                const pct = totalUsers ? ((t.count / totalUsers) * 100).toFixed(1) : 0
                return (
                  <div key={t.tier}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold capitalize text-gray-700">{t.tier}</span>
                      <span className="text-gray-400">{t.count?.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: TIER_COLORS[t.tier] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent subscriptions */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-sm font-bold text-gray-800 mb-3">Recent Upgrades</p>
            <div className="space-y-2.5">
              {data.recent_subscriptions.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#B81365' }}
                  >
                    {s.user?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{s.user?.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(s.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                    style={{ background: s.plan === 'business' ? '#fff7ed' : '#fdf2f5', color: TIER_COLORS[s.plan] }}
                  >
                    {s.plan}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category performance chart */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4" style={{ color: '#B81365' }} />
          <p className="text-sm font-bold text-gray-800">Category Performance</p>
          <span className="text-xs text-gray-400 ml-1">Active listings per category</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.category_performance} barSize={28} margin={{ left: -10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="listing_count" radius={[6, 6, 0, 0]} name="Listings">
              {data.category_performance.map((_, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upsell targets */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-bold text-gray-800">Upsell Targets</p>
        </div>
        <p className="text-xs text-gray-400 mb-4">Free users with the most listings — most likely to convert to Pro.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.upsell_targets.map((u) => (
            <div
              key={u.id}
              className="rounded-xl p-4"
              style={{ background: '#ECEAE6' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#9ca3af' }}
                >
                  {u.name?.[0]}
                </div>
                <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
              </div>
              <p className="text-lg font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {u.listing_count}
              </p>
              <p className="text-[10px] text-gray-500">listings on free plan</p>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{u.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
