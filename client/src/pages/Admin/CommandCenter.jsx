import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, TrendingUp, DollarSign, Users, Package,
  Zap, Target, ArrowUpRight, CheckCircle, XCircle,
  Lightbulb, Activity, ShieldAlert, BarChart3, Search,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts'
import api from '../../services/api'
import { DEMAND_SIGNALS } from '../../mocks/demandSignals'

const TIER_PRICE = { pro: 50, business: 150 }

function healthScore(data, intel) {
  if (!data || !intel) return null
  const verificationRate  = data.users.verified / Math.max(1, data.users.total)
  const activeRate        = data.listings.active / Math.max(1, data.listings.total)
  const searchSuccessRate = 1 - (data.searches.zero_results_gaps / Math.max(1, DEMAND_SIGNALS.unique_terms))
  const paidRate          = ((intel.tier_breakdown?.find((t) => t.tier === 'pro')?.count || 0) +
                             (intel.tier_breakdown?.find((t) => t.tier === 'business')?.count || 0)) /
                            Math.max(1, data.users.total)
  return Math.round(
    verificationRate  * 25 +
    activeRate        * 25 +
    searchSuccessRate * 30 +
    paidRate          * 20,
  )
}

function scoreColor(s) {
  if (s >= 75) return '#15803d'
  if (s >= 50) return '#d97706'
  return '#dc2626'
}

export default function CommandCenter() {
  const { data: dash, isLoading: loadDash } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/analytics/admin/dashboard').then((r) => r.data.data),
    refetchInterval: 60000,
  })

  const { data: intel, isLoading: loadIntel } = useQuery({
    queryKey: ['admin', 'intelligence'],
    queryFn: () => api.get('/admin/intelligence').then((r) => r.data.data),
    refetchInterval: 120000,
  })

  const isLoading = loadDash || loadIntel

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#B81365', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!dash || !intel) return null

  const score = healthScore(dash, intel)
  const sc    = scoreColor(score)

  const proCount  = intel.tier_breakdown?.find((t) => t.tier === 'pro')?.count  || 0
  const bizCount  = intel.tier_breakdown?.find((t) => t.tier === 'business')?.count || 0
  const mrr       = proCount * TIER_PRICE.pro + bizCount * TIER_PRICE.business
  const mrrPotential = mrr + (intel.upsell_targets?.slice(0, 20).length || 0) * TIER_PRICE.pro

  // Supply/demand gaps: top zero-competition terms not covered
  const supplyGaps = (DEMAND_SIGNALS.zero_results || []).slice(0, 6)

  // Category demand heat
  const topCategories = (DEMAND_SIGNALS.by_category || []).slice(0, 8)

  // Alerts
  const alerts = []
  const pendingMod = (intel.recent_subscriptions?.length === 0 ? 0 : 0) // placeholder — we don't have mod count here
  if (dash.searches.zero_results_gaps > 50)
    alerts.push({ level: 'high', icon: Search, text: `${dash.searches.zero_results_gaps} high-demand searches return zero results`, action: '/admin/search', actionLabel: 'View gaps' })
  if (intel.upsell_targets?.length >= 10)
    alerts.push({ level: 'medium', icon: Target, text: `${intel.upsell_targets.length} free sellers are ripe for Pro upgrade`, action: '/admin/intelligence', actionLabel: 'See targets' })
  if (dash.users.verified / dash.users.total < 0.25)
    alerts.push({ level: 'medium', icon: ShieldAlert, text: `Only ${((dash.users.verified / dash.users.total) * 100).toFixed(0)}% of sellers are ID-verified — trust risk`, action: '/admin/users', actionLabel: 'Manage users' })
  if (bizCount / Math.max(1, proCount + bizCount) < 0.15)
    alerts.push({ level: 'low', icon: DollarSign, text: 'Business tier uptake is low — consider targeted upsell to Pro users', action: '/admin/revenue', actionLabel: 'Revenue' })

  // Recommendations
  const recs = []
  recs.push({ priority: 'high', text: `Run a Pro upgrade campaign — ${intel.upsell_targets?.length} free sellers have 5+ listings`, why: 'High conversion probability: active sellers already invested in the platform' })
  if (supplyGaps.length > 0) {
    recs.push({ priority: 'high', text: `Recruit sellers for "${supplyGaps[0]?.query}" — ${supplyGaps[0]?.count?.toLocaleString()} monthly searches with zero supply`, why: 'Zero competition means first-mover advantage for recruited sellers' })
  }
  recs.push({ priority: 'medium', text: 'Push ID verification nudge to unverified sellers', why: `${((1 - dash.users.verified / dash.users.total) * 100).toFixed(0)}% of sellers are unverified — impacts buyer trust` })
  if (bizCount / Math.max(1, proCount + bizCount) < 0.15) {
    recs.push({ priority: 'medium', text: 'Target Pro subscribers with a Business upgrade offer', why: 'Business ARPU is 3× Pro — even 10% conversion adds GHS ' + (Math.round(proCount * 0.1) * (TIER_PRICE.business - TIER_PRICE.pro)).toLocaleString() + '/mo' })
  }
  recs.push({ priority: 'low', text: 'Review top 5 zero-result categories and brief sellers on demand', why: `Categories like ${supplyGaps.slice(0,2).map((g) => g.query).join(', ')} show strong demand but no supply` })

  const ALERT_COLORS = { high: '#dc2626', medium: '#d97706', low: '#6b7280' }
  const ALERT_BG     = { high: '#fef2f2', medium: '#fffbeb', low: '#f9fafb' }
  const REC_COLORS   = { high: '#B81365', medium: '#d97706', low: '#6b7280' }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
            Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Strategic platform insights to help you decide what to do next.</p>
        </div>
        <div className="text-xs text-gray-400">{new Date().toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>

      {/* Health score + quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">

        {/* Health Score */}
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center text-center" style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Platform Health</p>
          <p className="text-4xl font-black" style={{ fontFamily: "'Poppins', sans-serif", color: sc }}>{score}</p>
          <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>/ 100</p>
          <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: '#2d2d44' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: sc }} />
          </div>
        </div>

        <MiniKpi icon={<DollarSign className="w-4 h-4 text-green-400" />} label="MRR" value={`GHS ${mrr.toLocaleString()}`} sub="Est. monthly revenue" dark />
        <MiniKpi icon={<Users className="w-4 h-4 text-blue-400" />} label="Total Users" value={dash.users.total?.toLocaleString()} sub={`+${dash.users.today} today`} />
        <MiniKpi icon={<Package className="w-4 h-4 text-purple-400" />} label="Active Listings" value={dash.listings.active?.toLocaleString()} sub={`+${dash.listings.today} today`} />
        <MiniKpi icon={<Zap className="w-4 h-4 text-amber-400" />} label="Paid Users" value={(proCount + bizCount).toLocaleString()} sub={`${(((proCount + bizCount) / Math.max(1, dash.users.total)) * 100).toFixed(1)}% of total`} />
      </div>

      {/* Alerts + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Alerts */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f0eeeb' }}>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-gray-800">Platform Alerts</p>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: alerts.length > 0 ? '#fef2f2' : '#dcfce7', color: alerts.length > 0 ? '#dc2626' : '#15803d' }}>
              {alerts.length > 0 ? `${alerts.length} active` : 'All clear'}
            </span>
          </div>
          <div className="divide-y" style={{ divideColor: '#f9f8f7' }}>
            {alerts.length === 0 && (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No critical alerts right now</p>
              </div>
            )}
            {alerts.map((a, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start gap-3" style={{ background: ALERT_BG[a.level] }}>
                <a.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ALERT_COLORS[a.level] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{a.text}</p>
                </div>
                <Link to={a.action} className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ background: ALERT_COLORS[a.level], color: 'white' }}>
                  {a.actionLabel} <ArrowUpRight className="w-3 h-3 inline" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f0eeeb' }}>
            <Lightbulb className="w-4 h-4" style={{ color: '#B81365' }} />
            <p className="text-sm font-bold text-gray-800">Recommended Actions</p>
          </div>
          <div className="divide-y" style={{ divideColor: '#f9f8f7' }}>
            {recs.map((r, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 uppercase tracking-wide"
                  style={{ background: `${REC_COLORS[r.priority]}15`, color: REC_COLORS[r.priority] }}>
                  {r.priority}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{r.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl p-5" style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4" style={{ color: '#f472b6' }} />
            <p className="text-sm font-bold text-white">Revenue Pipeline</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#9ca3af' }}>Current MRR</span>
                <span className="font-bold text-white">GHS {mrr.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2d2d44' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (mrr / mrrPotential) * 100)}%`, background: '#B81365' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#9ca3af' }}>Potential MRR</span>
                <span className="font-bold text-white">GHS {mrrPotential.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2d2d44' }}>
                <div className="h-full rounded-full" style={{ width: '100%', background: '#4b5563' }} />
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(184,19,101,0.15)' }}>
              <p className="text-[10px]" style={{ color: '#f472b6' }}>Unlock additional</p>
              <p className="text-xl font-black text-white mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                GHS {(mrrPotential - mrr).toLocaleString()}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>if top upsell targets convert</p>
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="mt-4 space-y-2">
            {intel.tier_breakdown?.filter((t) => t.tier !== 'admin').map((t) => {
              const totalUsers = intel.tier_breakdown.reduce((s, x) => s + x.count, 0)
              const pct = totalUsers ? ((t.count / totalUsers) * 100).toFixed(0) : 0
              return (
                <div key={t.tier} className="flex items-center justify-between text-xs">
                  <span className="capitalize" style={{ color: '#9ca3af' }}>{t.tier}</span>
                  <span className="font-bold text-white">{t.count?.toLocaleString()} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category demand vs supply */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: '#B81365' }} />
            <p className="text-sm font-bold text-gray-800">Market Demand by Category</p>
            <span className="text-xs text-gray-400 ml-1">Monthly search volume</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topCategories} barSize={22} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                formatter={(v) => [v >= 1000 ? `${(v / 1000).toFixed(1)}K searches/mo` : `${v} searches/mo`, 'Demand']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Monthly searches">
                {topCategories.map((c, i) => (
                  <Cell key={i} fill={c.color || '#B81365'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supply gaps + top sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Zero-supply opportunities */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f0eeeb' }}>
            <Activity className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-gray-800">Highest Demand, Zero Supply</p>
            <span className="text-[10px] text-gray-400 ml-auto">Recruit sellers for these</span>
          </div>
          <div className="divide-y" style={{ divideColor: '#f9f8f7' }}>
            {supplyGaps.map((g, i) => (
              <div key={g.query} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs font-black shrink-0 w-5 text-center" style={{ color: i < 2 ? '#B81365' : '#d1d5db' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 capitalize">{g.query}</p>
                  <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (g.count / supplyGaps[0].count) * 100)}%`, background: '#f59e0b' }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black" style={{ color: '#d97706' }}>{g.count?.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">searches/mo</p>
                </div>
                <div className="shrink-0">
                  <XCircle className="w-4 h-4 text-red-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers snapshot */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f0eeeb' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#B81365' }} />
            <p className="text-sm font-bold text-gray-800">Top Sellers</p>
            <Link to="/admin/intelligence" className="ml-auto text-[10px] font-bold flex items-center gap-0.5 hover:underline" style={{ color: '#B81365' }}>
              Full report <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ divideColor: '#f9f8f7' }}>
            {intel.top_sellers?.slice(0, 6).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs font-black shrink-0 w-5 text-center" style={{ color: i < 3 ? '#B81365' : '#d1d5db' }}>{i + 1}</span>
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: '#B81365' }}>
                  {s.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.total_views?.toLocaleString()} views · {s.active_listings} listings</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize shrink-0"
                  style={{ background: s.subscription_tier === 'business' ? '#fff7ed' : s.subscription_tier === 'pro' ? '#fdf2f5' : '#f3f4f6',
                           color:      s.subscription_tier === 'business' ? '#c2410c' : s.subscription_tier === 'pro' ? '#B81365' : '#9ca3af' }}>
                  {s.subscription_tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth trend (combined) */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: '#B81365' }} />
          <p className="text-sm font-bold text-gray-800">7-Day Growth — Users & Listings</p>
          <Link to="/admin" className="ml-auto text-[10px] font-bold flex items-center gap-0.5 hover:underline" style={{ color: '#B81365' }}>
            Dashboard <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={buildCombinedTrend(dash.users.trend, dash.listings.trend)} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }} />
            <Line type="monotone" dataKey="users"    stroke="#B81365" strokeWidth={2} dot={false} name="New Users" />
            <Line type="monotone" dataKey="listings" stroke="#3b82f6" strokeWidth={2} dot={false} name="New Listings" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#B81365' }} /> New Users</span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#3b82f6' }} /> New Listings</span>
        </div>
      </div>
    </div>
  )
}

function buildCombinedTrend(usersTrend = [], listingsTrend = []) {
  const dayMap = {}
  for (const d of usersTrend)    { if (!dayMap[d.day]) dayMap[d.day] = { day: d.day?.slice(5), users: 0, listings: 0 }; dayMap[d.day].users = d.count }
  for (const d of listingsTrend) { if (!dayMap[d.day]) dayMap[d.day] = { day: d.day?.slice(5), users: 0, listings: 0 }; dayMap[d.day].listings = d.count }
  return Object.values(dayMap).sort((a, b) => a.day < b.day ? -1 : 1)
}

function MiniKpi({ icon, label, value, sub, dark }) {
  return (
    <div className="rounded-2xl p-5" style={dark ? { background: '#1a1a2e', border: '1px solid #2d2d44' } : { background: 'white', border: '1px solid #f0eeeb' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#ECEAE6' }}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>{label}</span>
      </div>
      <p className="text-xl font-black" style={{ fontFamily: "'Poppins', sans-serif", color: dark ? 'white' : '#111827' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>{sub}</p>}
    </div>
  )
}
