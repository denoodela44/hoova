import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Zap, Crown, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../services/api'

const MOCK = {
  mrr: 23450,
  arr: 281400,
  boost_revenue_total: 8900,
  boost_revenue_month: 1240,
  tier_breakdown: [
    { tier: 'free',     count: 4534, revenue: 0 },
    { tier: 'pro',      count: 251,  revenue: 12550 },
    { tier: 'business', count: 60,   revenue: 9000 },
  ],
  recent_subscriptions: Array.from({ length: 8 }, (_, i) => ({
    id: `s${i}`,
    plan: ['pro', 'business', 'pro'][i % 3],
    starts_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    user: { name: ['Kwame Motors', 'TechHub GH', 'HomePro', 'ElectroCity'][i % 4], email: `seller${i}@hoova.gh`, avatar: null },
  })),
  monthly_trend: [
    { month: 'Jan 25', amount: 14200 }, { month: 'Feb 25', amount: 16800 },
    { month: 'Mar 25', amount: 18500 }, { month: 'Apr 25', amount: 20100 },
    { month: 'May 25', amount: 21900 }, { month: 'Jun 25', amount: 23450 },
  ],
}

const TIER_COLORS = { free: '#9ca3af', pro: '#B81365', business: '#c2410c' }

export default function Revenue() {
  const { data = MOCK } = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: async () => {
      try { return await api.get('/admin/revenue').then((r) => r.data.data) } catch { return MOCK }
    },
    refetchInterval: 120000,
  })

  const totalRevenue = (data.mrr || 0) + (data.boost_revenue_month || 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>Revenue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Subscription MRR, boost revenue, and growth trends.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MRR',              value: `GHS ${data.mrr?.toLocaleString()}`,              icon: DollarSign, color: '#B81365',  bg: '#fdf2f5' },
          { label: 'ARR (projected)',  value: `GHS ${data.arr?.toLocaleString()}`,              icon: TrendingUp, color: '#1d4ed8',  bg: '#eff6ff' },
          { label: 'Boost Revenue',    value: `GHS ${data.boost_revenue_month?.toLocaleString()}`, icon: Zap,     color: '#7e22ce',  bg: '#f5f3ff', sub: 'this month' },
          { label: 'Total Revenue',    value: `GHS ${totalRevenue?.toLocaleString()}`,          icon: Crown,      color: '#c2410c',  bg: '#fff7ed', sub: 'this month' },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #f0eeeb' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Monthly Subscription Revenue</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthly_trend} barSize={32}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }}
                formatter={(v) => [`GHS ${v?.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#B81365" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier breakdown */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Revenue by Plan</p>
          <div className="space-y-4">
            {data.tier_breakdown?.map((t) => {
              const pct = totalRevenue ? Math.round((t.revenue / (data.mrr || 1)) * 100) : 0
              return (
                <div key={t.tier}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold capitalize text-gray-700">{t.tier}</span>
                    <span className="text-gray-400">{t.count} users · GHS {t.revenue?.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TIER_COLORS[t.tier] }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid #f0eeeb' }}>
            <p className="text-xs font-bold text-gray-500 mb-1">Boost Revenue</p>
            <p className="text-lg font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              GHS {data.boost_revenue_total?.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400">all-time total</p>
          </div>
        </div>
      </div>

      {/* Recent subscriptions */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <p className="text-sm font-bold text-gray-800 mb-4">Recent Subscriptions</p>
        <div className="space-y-3">
          {data.recent_subscriptions?.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#B81365' }}>
                {s.user?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{s.user?.name}</p>
                <p className="text-[10px] text-gray-400">{s.user?.email}</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                style={{ background: s.plan === 'business' ? '#fff7ed' : '#fdf2f5', color: TIER_COLORS[s.plan] }}>
                {s.plan}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(s.starts_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
