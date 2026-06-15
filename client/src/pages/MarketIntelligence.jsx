import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Zap, Search, MapPin,
  Clock, Target, ArrowUpRight, Star, ChevronRight,
  BarChart2, Package, Flame, RefreshCw, Lock,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import api from '../services/api'
import useAuthStore from '../store/authStore'

/* ── Mock data (replaced by real API once backend is wired) ────────────────── */
const MOCK = {
  updated_at: new Date().toISOString(),
  platform_stats: {
    searches_today: 18420,
    active_listings: 48200,
    avg_price_ghs: 4820,
    opportunity_zones: 6,
  },
  niches: [
    { slug: 'vehicles',    name: 'Vehicles',       icon: '🚗', score: 8.2, demand: 'Very High', demand_val: 95, competition: 'High',   comp_val: 80, avg_price: 28000, listings: 14200, searches_week: 9800,  trend: [40,45,50,48,55,60,58], trending: true,  opportunity: false },
    { slug: 'phones',      name: 'Phones',          icon: '📱', score: 9.1, demand: 'Very High', demand_val: 98, competition: 'Medium', comp_val: 55, avg_price: 4200,  listings: 5800,  searches_week: 12400, trend: [30,35,40,50,55,60,70], trending: true,  opportunity: true  },
    { slug: 'electronics', name: 'Electronics',     icon: '💻', score: 7.4, demand: 'High',      demand_val: 78, competition: 'High',   comp_val: 75, avg_price: 6800,  listings: 11800, searches_week: 7200,  trend: [50,48,52,50,48,50,52], trending: false, opportunity: false },
    { slug: 'real-estate', name: 'Real Estate',     icon: '🏠', score: 8.8, demand: 'Very High', demand_val: 92, competition: 'Low',    comp_val: 30, avg_price: 85000, listings: 9400,  searches_week: 8800,  trend: [20,25,28,30,35,38,42], trending: true,  opportunity: true  },
    { slug: 'fashion',     name: 'Fashion',         icon: '👗', score: 6.3, demand: 'Medium',    demand_val: 58, competition: 'Medium', comp_val: 52, avg_price: 350,   listings: 6200,  searches_week: 4100,  trend: [30,28,32,30,28,30,32], trending: false, opportunity: false },
    { slug: 'agriculture', name: 'Agriculture',     icon: '🌾', score: 9.4, demand: 'High',      demand_val: 82, competition: 'Low',    comp_val: 18, avg_price: 1200,  listings: 1900,  searches_week: 6200,  trend: [10,12,15,18,22,28,35], trending: true,  opportunity: true  },
    { slug: 'furniture',   name: 'Furniture',       icon: '🛋️', score: 7.1, demand: 'High',      demand_val: 72, competition: 'Medium', comp_val: 48, avg_price: 2800,  listings: 2700,  searches_week: 5100,  trend: [20,22,25,24,26,28,30], trending: true,  opportunity: false },
    { slug: 'jobs',        name: 'Jobs',            icon: '💼', score: 8.5, demand: 'Very High', demand_val: 88, competition: 'Low',    comp_val: 22, avg_price: 0,     listings: 3200,  searches_week: 11200, trend: [40,45,48,52,56,60,65], trending: true,  opportunity: true  },
    { slug: 'services',    name: 'Services',        icon: '🔧', score: 7.8, demand: 'High',      demand_val: 80, competition: 'Low',    comp_val: 25, avg_price: 500,   listings: 2100,  searches_week: 6800,  trend: [25,28,30,32,35,38,40], trending: true,  opportunity: true  },
    { slug: 'health',      name: 'Health & Beauty', icon: '💊', score: 6.9, demand: 'Medium',    demand_val: 65, competition: 'Medium', comp_val: 60, avg_price: 280,   listings: 2400,  searches_week: 3800,  trend: [18,20,22,20,22,24,26], trending: false, opportunity: false },
    { slug: 'sports',      name: 'Sports',          icon: '⚽', score: 5.8, demand: 'Medium',    demand_val: 50, competition: 'Low',    comp_val: 20, avg_price: 420,   listings: 1400,  searches_week: 2900,  trend: [15,16,18,17,18,19,20], trending: false, opportunity: false },
    { slug: 'pets',        name: 'Pets',            icon: '🐾', score: 8.1, demand: 'High',      demand_val: 76, competition: 'Low',    comp_val: 15, avg_price: 650,   listings: 900,   searches_week: 5400,  trend: [8,10,12,15,18,22,28],  trending: true,  opportunity: true  },
  ],
  hot_searches: [
    { query: 'iPhone 15 Pro',       volume: 2840, change: +18 },
    { query: 'Toyota Corolla 2020', volume: 1920, change: +12 },
    { query: '2 bedroom apartment', volume: 1640, change: +8  },
    { query: 'Samsung Galaxy S24',  volume: 1380, change: +24 },
    { query: 'Generator Honda',     volume: 1120, change: +6  },
    { query: 'Office space Accra',  volume: 980,  change: -3  },
    { query: 'Fridge for sale',     volume: 860,  change: +15 },
    { query: 'Land for sale',       volume: 820,  change: +31 },
    { query: 'Used Laptop',         volume: 760,  change: +9  },
    { query: 'Sofa set',            volume: 680,  change: -2  },
  ],
  regional_demand: [
    { region: 'Greater Accra', score: 95, searches: 9800 },
    { region: 'Ashanti',       score: 78, searches: 5200 },
    { region: 'Western',       score: 52, searches: 2800 },
    { region: 'Eastern',       score: 44, searches: 2100 },
    { region: 'Central',       score: 38, searches: 1800 },
    { region: 'Volta',         score: 28, searches: 980  },
    { region: 'Northern',      score: 22, searches: 760  },
    { region: 'Brong-Ahafo',   score: 18, searches: 620  },
  ],
  post_heatmap: {
    hours:   [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
    days:    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    data: [
      [1,1,0,0,0,1,3,6, 8, 9, 10,9, 8, 7, 8, 9, 10,9, 8, 6, 4, 3, 2,1],
      [1,1,0,0,0,1,3,7, 9, 10,10,9, 8, 7, 8, 9, 10,9, 8, 6, 4, 3, 2,1],
      [1,1,0,0,0,1,3,7, 8, 9, 10,9, 8, 7, 8, 9, 10,9, 8, 6, 4, 3, 2,1],
      [1,1,0,0,0,1,3,6, 8, 9, 10,9, 8, 7, 8, 9, 10,9, 8, 6, 4, 3, 2,1],
      [1,1,0,0,0,2,4,8, 9, 10,10,9, 9, 8, 8,10, 10,9, 8, 7, 5, 4, 3,2],
      [2,1,1,0,0,2,5,9,10, 10,10,10,10,9,10,10, 10,9, 9, 8, 7, 6, 4,3],
      [2,1,1,0,0,2,4,7, 8,  9, 9, 9, 9, 8, 9,  9,  9, 8, 7, 6, 5, 4, 3,2],
    ],
  },
}

const SCORE_COLOR = (score) => {
  if (score >= 8.5) return { color: '#15803d', bg: '#dcfce7', label: 'Excellent' }
  if (score >= 7)   return { color: '#B81365', bg: '#fdf2f5', label: 'Good' }
  if (score >= 5.5) return { color: '#854d0e', bg: '#fefce8', label: 'Fair' }
  return { color: '#6b7280', bg: '#f3f4f6', label: 'Weak' }
}

const COMP_COLOR = (level) => {
  if (level === 'Low')    return { color: '#15803d', bg: '#dcfce7' }
  if (level === 'Medium') return { color: '#854d0e', bg: '#fefce8' }
  return { color: '#dc2626', bg: '#fef2f2' }
}

const HEAT_COLOR = (val) => {
  if (val === 0)  return '#f3f4f6'
  if (val <= 2)   return '#fdf2f5'
  if (val <= 4)   return '#f9a8d4'
  if (val <= 7)   return '#B81365'
  return '#7f0038'
}

/* ── NicheScore ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = score / 10
  const sc = SCORE_COLOR(score)
  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ECEAE6" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={sc.color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span className="absolute text-sm font-black" style={{ color: sc.color }}>{score.toFixed(1)}</span>
    </div>
  )
}

function FreePlanGate() {
  const navigate = useNavigate()
  const PREVIEW_NICHES = [
    { name: 'Phones',      icon: '📱', score: 9.1, demand: 'Very High', competition: 'Medium', blurred: false },
    { name: 'Agriculture', icon: '🌾', score: 9.4, demand: 'High',      competition: 'Low',    blurred: false },
    { name: 'Real Estate', icon: '🏠', score: 8.8, demand: 'Very High', competition: 'Low',    blurred: true  },
    { name: 'Jobs',        icon: '💼', score: 8.5, demand: 'Very High', competition: 'Low',    blurred: true  },
    { name: 'Vehicles',    icon: '🚗', score: 8.2, demand: 'Very High', competition: 'High',   blurred: true  },
  ]
  return (
    <div className="min-h-screen" style={{ background: '#f5f4f1' }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: '#e9e6e0' }}>
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fdf2f5' }}>
            <Target className="w-4 h-4" style={{ color: '#B81365' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Market Intelligence
          </h1>
          <span className="ml-2 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Lock className="w-3 h-3" /> Seller Feature
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Lock banner */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #B81365 100%)' }}>
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Real Buyer Demand Data
            </h2>
            <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
              See exactly what buyers in Ghana are searching for, which categories have the least competition, the best time to post, and which regions have the highest demand — all in real time from the HOOVA platform.
            </p>
          </div>
        </div>

        {/* Blurred preview */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Niche Opportunity Scores — Preview</p>
          {PREVIEW_NICHES.map((n) => (
            <div key={n.name}
              className="rounded-2xl bg-white p-4 flex items-center gap-4"
              style={{ border: '1px solid #f0eeeb', filter: n.blurred ? 'blur(4px)' : 'none', userSelect: n.blurred ? 'none' : 'auto' }}>
              <span className="text-2xl">{n.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{n.name}</p>
                <p className="text-xs text-gray-400">Demand: <strong style={{ color: '#B81365' }}>{n.demand}</strong> · Competition: <strong>{n.competition}</strong></p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black" style={{ color: n.score >= 8.5 ? '#15803d' : '#B81365', fontFamily: "'Poppins', sans-serif" }}>{n.score}</p>
                <p className="text-[10px] text-gray-400">Niche Score</p>
              </div>
            </div>
          ))}
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">+ {'>'}8 more categories hidden</p>
          </div>
        </div>

        {/* What's included */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">What Seller accounts unlock</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🔥', label: 'Hot Searches',        desc: 'Top buyer queries updated daily' },
              { icon: '📊', label: 'Category Scores',     desc: 'Demand vs competition for every niche' },
              { icon: '📍', label: 'Regional Demand',     desc: 'Which regions have the most buyers' },
              { icon: '⏰', label: 'Best Time to Post',   desc: 'Heatmap of when buyers are most active' },
              { icon: '💡', label: 'Opportunity Alerts',  desc: 'High demand + low supply categories' },
              { icon: '📈', label: 'Weekly Trends',       desc: '7-day search trend per category' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: '#fafaf9' }}>
                <span className="text-lg shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/dashboard', { state: { openTab: 'subscription' } })}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center"
            style={{ background: '#B81365' }}>
            Upgrade to Seller — GHS 50/mo →
          </button>
          <button onClick={() => navigate('/dashboard', { state: { openTab: 'subscription' } })}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-center"
            style={{ background: '#fff7ed', color: '#c2410c' }}>
            Business Plan — GHS 150/mo →
          </button>
        </div>
        <p className="text-xs text-center text-gray-400">Payments via Paystack · Cancel anytime</p>
      </div>
    </div>
  )
}

export default function MarketIntelligence() {
  const { user } = useAuthStore()
  const [selectedNiche, setSelectedNiche] = useState(null)
  const [sortBy, setSortBy] = useState('score')
  const [filterOpp, setFilterOpp] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const tier = user?.subscription_tier || 'free'
  if (tier === 'free') return <FreePlanGate />

  const { data = MOCK, isRefetching, refetch } = useQuery({
    queryKey: ['market-intelligence'],
    queryFn: async () => {
      try { return await api.get('/market-intelligence').then((r) => r.data.data) }
      catch { return MOCK }
    },
    staleTime: 1000 * 60 * 10,
  })

  const niches = [...(data.niches || [])]
    .filter((n) => !filterOpp || n.opportunity)
    .filter((n) => !searchQ || n.name.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'score')    return b.score - a.score
      if (sortBy === 'demand')   return b.demand_val - a.demand_val
      if (sortBy === 'searches') return b.searches_week - a.searches_week
      if (sortBy === 'price')    return b.avg_price - a.avg_price
      return b.score - a.score
    })

  const active = selectedNiche ? data.niches?.find((n) => n.slug === selectedNiche) : null
  const opportunityCount = (data.niches || []).filter((n) => n.opportunity).length
  const ps = data.platform_stats || {}
  const hm = data.post_heatmap || { hours: [], days: [], data: [] }

  return (
    <div className="min-h-screen" style={{ background: '#f5f4f1' }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: '#e9e6e0' }}>
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fdf2f5' }}>
                  <Target className="w-4 h-4" style={{ color: '#B81365' }} />
                </div>
                <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
                  Market Intelligence
                </h1>
              </div>
              <p className="text-sm text-gray-500">
                Real buyer demand data from HOOVA · Updated {new Date(data.updated_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#ECEAE6', color: '#374151' }}>
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Platform KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Searches Today',    value: ps.searches_today?.toLocaleString(),    icon: Search,   color: '#1d4ed8', bg: '#eff6ff',  sub: 'by buyers on HOOVA' },
            { label: 'Active Listings',   value: ps.active_listings?.toLocaleString(),   icon: Package,  color: '#15803d', bg: '#dcfce7',  sub: 'across all categories' },
            { label: 'Avg Listing Price', value: `GHS ${ps.avg_price_ghs?.toLocaleString()}`, icon: BarChart2, color: '#B81365', bg: '#fdf2f5', sub: 'platform average' },
            { label: 'Opportunity Zones', value: opportunityCount,                        icon: Flame,    color: '#c2410c', bg: '#fff7ed',  sub: 'high demand, low supply' },
          ].map(({ label, value, icon: Icon, color, bg, sub }) => (
            <div key={label} className="rounded-2xl bg-white p-4" style={{ border: '1px solid #f0eeeb' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-300">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Niche browser ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search category…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{ border: '1px solid #e5e7eb' }} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none"
                style={{ border: '1px solid #e5e7eb', color: '#374151' }}>
                <option value="score">Sort: Niche Score</option>
                <option value="demand">Sort: Demand</option>
                <option value="searches">Sort: Searches</option>
                <option value="price">Sort: Avg Price</option>
              </select>
              <button onClick={() => setFilterOpp((f) => !f)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={filterOpp ? { background: '#B81365', color: 'white' } : { background: '#ECEAE6', color: '#6b7280' }}>
                <Flame className="w-3.5 h-3.5" />
                Opportunities Only
              </button>
            </div>

            {/* Niche cards */}
            <div className="space-y-2">
              {niches.map((n) => {
                const sc = SCORE_COLOR(n.score)
                const cc = COMP_COLOR(n.competition)
                const isSelected = selectedNiche === n.slug
                const trendData = n.trend.map((v, i) => ({ i, v }))
                return (
                  <div key={n.slug}
                    onClick={() => setSelectedNiche(isSelected ? null : n.slug)}
                    className="rounded-2xl bg-white p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{
                      border: isSelected ? `2px solid #B81365` : '1px solid #f0eeeb',
                      boxShadow: isSelected ? '0 4px 16px rgba(184,19,101,0.12)' : 'none',
                    }}>
                    <div className="flex items-center gap-3">
                      {/* Score ring */}
                      <ScoreRing score={n.score} />

                      {/* Icon + name */}
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <span className="text-2xl">{n.icon}</span>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{n.name}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex-1 grid grid-cols-3 gap-3 min-w-0">
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Weekly Searches</p>
                          <p className="text-sm font-black text-gray-900">{n.searches_week?.toLocaleString()}</p>
                          <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                            <div className="h-full rounded-full" style={{ width: `${n.demand_val}%`, background: '#B81365' }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Competition</p>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: cc.bg, color: cc.color }}>{n.competition}</span>
                          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                            <div className="h-full rounded-full" style={{ width: `${n.comp_val}%`, background: cc.color }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Avg Price</p>
                          <p className="text-xs font-bold text-gray-800">
                            {n.avg_price === 0 ? 'Varies' : `GHS ${n.avg_price.toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      {/* Trend sparkline */}
                      <div className="w-20 h-10 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id={`g${n.slug}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={n.trending ? '#B81365' : '#9ca3af'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={n.trending ? '#B81365' : '#9ca3af'} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={n.trending ? '#B81365' : '#9ca3af'}
                              strokeWidth={1.5} fill={`url(#g${n.slug})`} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col gap-1 shrink-0 items-end">
                        {n.opportunity && (
                          <span className="flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: '#c2410c', color: 'white' }}>
                            <Flame className="w-2.5 h-2.5" /> Opportunity
                          </span>
                        )}
                        {n.trending && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#dcfce7', color: '#15803d' }}>
                            <TrendingUp className="w-2.5 h-2.5" /> Trending
                          </span>
                        )}
                        <Link to={`/post?category=${n.slug}`} onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#fdf2f5', color: '#B81365' }}>
                          + List Now <ArrowUpRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isSelected && active && (
                      <div className="mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ borderTop: '1px solid #f0eeeb' }}>
                        <div className="rounded-xl p-3" style={{ background: '#fafaf9' }}>
                          <p className="text-[10px] text-gray-400 mb-1">Total Listings</p>
                          <p className="text-lg font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{active.listings?.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: '#fafaf9' }}>
                          <p className="text-[10px] text-gray-400 mb-1">Searches / Listing</p>
                          <p className="text-lg font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {(active.searches_week / Math.max(1, active.listings)).toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: '#fafaf9' }}>
                          <p className="text-[10px] text-gray-400 mb-1">Demand Score</p>
                          <p className="text-lg font-black" style={{ fontFamily: "'Poppins', sans-serif", color: '#B81365' }}>{active.demand_val}/100</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: '#fafaf9' }}>
                          <p className="text-[10px] text-gray-400 mb-1">Supply Pressure</p>
                          <p className="text-lg font-black" style={{ fontFamily: "'Poppins', sans-serif", color: COMP_COLOR(active.competition).color }}>{active.comp_val}/100</p>
                        </div>
                        <div className="col-span-2 sm:col-span-4 rounded-xl p-3" style={{ background: n.opportunity ? '#fff7ed' : '#fafaf9', border: n.opportunity ? '1px solid #fed7aa' : '1px solid #f0eeeb' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: n.opportunity ? '#c2410c' : '#374151' }}>
                            {n.opportunity ? '🔥 Why this is an Opportunity' : '📊 Market Insight'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {n.opportunity
                              ? `${active.name} has ${active.searches_week?.toLocaleString()} weekly searches but only ${active.listings?.toLocaleString()} listings — that's ${(active.searches_week / Math.max(1, active.listings)).toFixed(1)}x more buyers than sellers. List now while competition is ${active.competition.toLowerCase()}.`
                              : `${active.name} is a competitive but active category. Focus on quality photos, competitive pricing, and boosting your listing to stand out from ${active.listings?.toLocaleString()} existing ads.`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Hot searches */}
            <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4" style={{ color: '#c2410c' }} />
                <p className="text-sm font-bold text-gray-800">Hot Searches Right Now</p>
              </div>
              <div className="space-y-2">
                {(data.hot_searches || []).map((s, i) => (
                  <div key={s.query} className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-200 w-4 shrink-0">#{i + 1}</span>
                    <Link to={`/browse?q=${encodeURIComponent(s.query)}`}
                      className="flex-1 text-xs font-semibold text-gray-700 hover:text-pink-600 truncate transition-colors">
                      {s.query}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400">{s.volume.toLocaleString()}</span>
                      {s.change > 0
                        ? <span className="text-[9px] font-bold text-green-500 flex items-center"><TrendingUp className="w-2.5 h-2.5" />+{s.change}%</span>
                        : <span className="text-[9px] font-bold text-red-400 flex items-center"><TrendingDown className="w-2.5 h-2.5" />{s.change}%</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional demand */}
            <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" style={{ color: '#1d4ed8' }} />
                <p className="text-sm font-bold text-gray-800">Demand by Region</p>
              </div>
              <div className="space-y-2.5">
                {(data.regional_demand || []).map((r) => (
                  <div key={r.region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{r.region}</span>
                      <span className="text-gray-400">{r.searches.toLocaleString()} searches</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#ECEAE6' }}>
                      <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score > 70 ? '#B81365' : r.score > 40 ? '#c2410c' : '#9ca3af' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best time to post */}
            <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" style={{ color: '#7e22ce' }} />
                <p className="text-sm font-bold text-gray-800">Best Time to Post</p>
              </div>
              <p className="text-[10px] text-gray-400 mb-3">Buyer activity heatmap — darker = more active</p>

              <div className="overflow-x-auto">
                <div className="min-w-[280px]">
                  {/* Hour labels */}
                  <div className="flex mb-1 pl-8">
                    {[0,3,6,9,12,15,18,21].map((h) => (
                      <div key={h} className="flex-1 text-center text-[8px] text-gray-300">{h}h</div>
                    ))}
                  </div>

                  {hm.days.map((day, di) => (
                    <div key={day} className="flex items-center gap-1 mb-0.5">
                      <span className="text-[9px] text-gray-400 w-7 shrink-0 text-right">{day}</span>
                      <div className="flex gap-0.5 flex-1">
                        {(hm.data[di] || []).map((val, hi) => (
                          <div key={hi} className="flex-1 h-4 rounded-[3px]"
                            style={{ background: HEAT_COLOR(val), minWidth: 8 }}
                            title={`${day} ${hi}:00 — activity: ${val}/10`} />
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-3 justify-end">
                    <span className="text-[9px] text-gray-400">Low</span>
                    {['#f3f4f6','#fdf2f5','#f9a8d4','#B81365','#7f0038'].map((c) => (
                      <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                    ))}
                    <span className="text-[9px] text-gray-400">High</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-xl text-[10px] font-semibold" style={{ background: '#fdf2f5', color: '#B81365' }}>
                💡 Best times: Weekdays 9–11am and 4–6pm · Saturdays 10am–1pm
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
