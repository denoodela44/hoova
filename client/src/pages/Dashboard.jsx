import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, Package, TrendingUp, Store, Crown, Bell,
  Plus, Edit2, Trash2, Eye, Heart, MessageSquare, Zap,
  CheckCircle, Clock, AlertTriangle, Star, ExternalLink,
  ChevronRight, ArrowUpRight, Camera, Globe, Instagram,
  Facebook, Twitter, Youtube, Linkedin, Send, X,
  ToggleLeft, ToggleRight, ShieldCheck, Lock, Target, Flame,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { formatPrice, timeAgo } from '../utils/format'

const TABS = [
  { id: 'overview',      label: 'Overview',      icon: LayoutDashboard },
  { id: 'listings',      label: 'My Listings',   icon: Package },
  { id: 'analytics',     label: 'Analytics',     icon: TrendingUp },
  { id: 'store',         label: 'Store',          icon: Store },
  { id: 'subscription',  label: 'Subscription',  icon: Crown },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const STATUS_STYLE = {
  active:   { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  pending:  { bg: '#fefce8', color: '#854d0e', label: 'In Review' },
  soft_live:{ bg: '#eff6ff', color: '#1d4ed8', label: 'Soft-Live' },
  expired:  { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
  sold:     { bg: '#f5f3ff', color: '#7e22ce', label: 'Sold' },
}

const BOOST_STYLE = {
  featured:  { bg: '#f5f3ff', color: '#7e22ce', label: 'Featured' },
  spotlight: { bg: '#fff7ed', color: '#c2410c', label: 'Spotlight' },
  top:       { bg: '#fefce8', color: '#854d0e', label: 'Top Ad' },
}

const PLANS = {
  free:     { label: 'Free',     price: 0,   color: '#6b7280', bg: '#f3f4f6', features: ['5 active listings', 'Basic search placement', 'Standard support'] },
  pro:      { label: 'Pro',      price: 50,  color: '#B81365', bg: '#fdf2f5', features: ['25 active listings', 'Priority search placement', '3 featured boosts/month', 'Store profile page', 'Analytics dashboard'] },
  business: { label: 'Business', price: 150, color: '#c2410c', bg: '#fff7ed', features: ['Unlimited listings', 'Top search placement', '10 featured boosts/month', 'Verified badge', 'Dedicated support', 'Custom store URL'] },
  admin:    { label: 'Admin',    price: 0,   color: '#7c3aed', bg: '#f5f3ff', features: ['Full platform access', 'All features unlocked', 'Admin dashboard'] },
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  if (!user) { navigate('/login'); return null }

  const tier = user.subscription_tier || 'free'

  return (
    <div className="min-h-screen" style={{ background: '#f5f4f1' }}>
      {/* Header strip */}
      <div className="bg-white border-b" style={{ borderColor: '#e9e6e0' }}>
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=B81365&color=fff&size=80`}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
              {tier !== 'free' && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#B81365' }}>
                  <ShieldCheck className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>{user.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: PLANS[tier]?.bg, color: PLANS[tier]?.color }}>
                  {PLANS[tier]?.label} Plan
                </span>
                {user.store_name && <span className="text-xs text-gray-400">· {user.store_name}</span>}
              </div>
            </div>
            <Link to="/post"
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#B81365' }}>
              <Plus className="w-4 h-4" /> Post Ad
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 mt-5 overflow-x-auto -mb-px">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all"
                style={tab === id
                  ? { borderColor: '#B81365', color: '#B81365' }
                  : { borderColor: 'transparent', color: '#9ca3af' }}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'overview'      && <OverviewTab user={user} tier={tier} setTab={setTab} />}
        {tab === 'listings'      && <ListingsTab />}
        {tab === 'analytics'     && <AnalyticsTab />}
        {tab === 'store'         && <StoreTab user={user} />}
        {tab === 'subscription'  && <SubscriptionTab tier={tier} />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  )
}

/* ─── Overview ──────────────────────────────────────────────────────────────── */
function OverviewTab({ user, tier, setTab }) {
  const { data: stats } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: () => api.get('/sellers/me/stats').then((r) => r.data.data),
  })

  const { data: listings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/mine').then((r) => r.data.data),
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=5').then((r) => r.data.data?.notifications || []),
  })

  const activeCount  = listings.filter((l) => l.status === 'active').length
  const pendingCount = listings.filter((l) => l.status === 'pending' || l.status === 'soft_live').length
  const unread       = notifications.filter((n) => !n.read_at).length

  const KPIs = [
    { label: 'Total Views',   value: stats?.total_views   || 0, icon: Eye,          color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'Inquiries',     value: stats?.inquiries     || 0, icon: MessageSquare, color: '#7e22ce', bg: '#f5f3ff' },
    { label: 'Saves',         value: stats?.saves         || 0, icon: Heart,         color: '#B81365', bg: '#fdf2f5' },
    { label: 'Active Ads',    value: activeCount,               icon: Package,       color: '#15803d', bg: '#dcfce7' },
  ]

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIs.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl bg-white p-4" style={{ border: '1px solid #f0eeeb' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-sm font-bold text-gray-800 mb-3">Quick Actions</p>
          <div className="space-y-2">
            {[
              { label: 'Post a new ad',        icon: Plus,        action: '/post',   style: { background: '#B81365', color: 'white' } },
              { label: 'Manage my listings',   icon: Package,     tab: 'listings' },
              { label: 'Edit store profile',   icon: Store,       tab: 'store' },
              { label: 'View analytics',       icon: TrendingUp,  tab: 'analytics' },
            ].map(({ label, icon: Icon, action, tab: t, style }) =>
              action ? (
                <Link key={label} to={action}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={style || { background: '#ECEAE6', color: '#374151' }}>
                  <Icon className="w-4 h-4" /> {label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              ) : (
                <button key={label} onClick={() => setTab(t)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left"
                  style={{ background: '#ECEAE6', color: '#374151' }}>
                  <Icon className="w-4 h-4" /> {label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Recent listings */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Recent Listings</p>
            <button onClick={() => setTab('listings')} className="text-xs font-semibold" style={{ color: '#B81365' }}>View all</button>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No listings yet</p>
              <Link to="/post" className="text-xs font-bold mt-1 inline-block" style={{ color: '#B81365' }}>Post your first ad →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.slice(0, 4).map((l) => {
                const st = STATUS_STYLE[l.status] || STATUS_STYLE.expired
                return (
                  <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
                    <img src={l.images?.[0]?.url || '/placeholder.jpg'} alt={l.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{l.title}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: '#B81365' }}>{formatPrice(l.price)}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
                      <Eye className="w-3 h-3" /> {l.views_count || 0}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Market Intelligence promo card */}
      <Link to="/market"
        className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg, #B81365 0%, #7f0038 100%)', border: 'none' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>Market Intelligence</p>
          <p className="text-white/70 text-xs mt-0.5">See which categories are booming, hot buyer searches, and the best time to post your ads.</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Flame className="w-4 h-4 text-white/70" />
          <ChevronRight className="w-5 h-5 text-white/70" />
        </div>
      </Link>

      {/* Status alerts */}
      {pendingCount > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
          <Clock className="w-5 h-5 shrink-0" style={{ color: '#854d0e' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#854d0e' }}>{pendingCount} listing{pendingCount > 1 ? 's' : ''} under review</p>
            <p className="text-xs" style={{ color: '#a16207' }}>We'll notify you when they go live. Usually within 30 minutes.</p>
          </div>
          <button onClick={() => setTab('listings')} className="ml-auto text-xs font-bold shrink-0" style={{ color: '#854d0e' }}>View →</button>
        </div>
      )}
      {unread > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#fdf2f5', border: '1px solid #f9a8d4' }}>
          <Bell className="w-5 h-5 shrink-0" style={{ color: '#B81365' }} />
          <p className="text-sm font-bold flex-1" style={{ color: '#B81365' }}>{unread} unread notification{unread > 1 ? 's' : ''}</p>
          <button onClick={() => setTab('notifications')} className="text-xs font-bold shrink-0" style={{ color: '#B81365' }}>View →</button>
        </div>
      )}
    </div>
  )
}

/* ─── Listings ──────────────────────────────────────────────────────────────── */
function ListingsTab() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/mine').then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/listings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const FILTERS = ['all', 'active', 'pending', 'soft_live', 'expired', 'sold']
  const filtered = filter === 'all' ? data : data.filter((l) => l.status === filter)

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#ECEAE6' }} />)}</div>

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const count = f === 'all' ? data.length : data.filter((l) => l.status === f).length
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={filter === f
                ? { background: '#B81365', color: 'white' }
                : { background: '#ECEAE6', color: '#6b7280' }}>
              {f === 'soft_live' ? 'Soft-Live' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          )
        })}
        <Link to="/post" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: '#B81365' }}>
          <Plus className="w-3.5 h-3.5" /> New Ad
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid #f0eeeb' }}>
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">{filter === 'all' ? 'No listings yet.' : `No ${filter} listings.`}</p>
          {filter === 'all' && <Link to="/post" className="mt-2 inline-block text-sm font-bold" style={{ color: '#B81365' }}>Post your first ad →</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const st = STATUS_STYLE[l.status] || STATUS_STYLE.expired
            const boost = l.boost_tier ? BOOST_STYLE[l.boost_tier] : null
            return (
              <div key={l.id} className="rounded-2xl bg-white p-4 flex gap-4" style={{ border: '1px solid #f0eeeb' }}>
                <Link to={`/listing/${l.id}`} className="shrink-0">
                  <img src={l.images?.[0]?.url || '/placeholder.jpg'} alt={l.title}
                    className="w-20 h-20 rounded-xl object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <Link to={`/listing/${l.id}`} className="font-bold text-sm text-gray-900 hover:underline line-clamp-1 flex-1">{l.title}</Link>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {boost && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: boost.bg, color: boost.color }}><Zap className="w-2.5 h-2.5 inline mr-0.5" />{boost.label}</span>}
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#B81365' }}>{formatPrice(l.price)}</p>
                  {l.is_flagged && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 mb-1">
                      <AlertTriangle className="w-3 h-3" /> Flagged for review
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{l.views_count || 0}</span>
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{l.saves_count || 0}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{l.inquiries_count || 0}</span>
                    <span className="ml-auto">{timeAgo(l.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link to={`/listing/${l.id}`} target="_blank"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  {(l.status === 'active' || l.status === 'expired') && (
                    <button onClick={() => toggleMutation.mutate({ id: l.id, status: l.status === 'active' ? 'expired' : 'active' })}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={l.status === 'active' ? 'Deactivate' : 'Reactivate'}>
                      {l.status === 'active'
                        ? <ToggleRight className="w-3.5 h-3.5 text-green-500" />
                        : <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  )}
                  <button onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(l.id) }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Analytics ─────────────────────────────────────────────────────────────── */
function AnalyticsTab() {
  const { data } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: () => api.get('/sellers/me/stats').then((r) => r.data.data),
  })

  const MOCK_TREND = Array.from({ length: 14 }, (_, i) => ({
    day: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }),
    views: Math.floor(Math.random() * 120) + 20,
    saves: Math.floor(Math.random() * 20) + 2,
  }))

  const trend = data?.trend || MOCK_TREND
  const topListings = data?.top_listings || []

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Views',   value: data?.total_views   || 0, color: '#1d4ed8' },
          { label: 'Saves',         value: data?.saves         || 0, color: '#B81365' },
          { label: 'Inquiries',     value: data?.inquiries     || 0, color: '#7e22ce' },
          { label: 'Active Ads',    value: data?.active_listings || 0, color: '#15803d' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl bg-white p-4" style={{ border: '1px solid #f0eeeb' }}>
            <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", color }}>{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <p className="text-sm font-bold text-gray-800 mb-4">Views — last 14 days</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B81365" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#B81365" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 11 }}
              formatter={(v, n) => [v, n === 'views' ? 'Views' : 'Saves']}
            />
            <Area type="monotone" dataKey="views" stroke="#B81365" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top listings */}
      {topListings.length > 0 && (
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-sm font-bold text-gray-800 mb-3">Top Performing Listings</p>
          <div className="space-y-3">
            {topListings.map((l, i) => (
              <div key={l.id} className="flex items-center gap-3">
                <span className="text-sm font-black text-gray-300 w-5 shrink-0">#{i + 1}</span>
                <img src={l.images?.[0]?.url || '/placeholder.jpg'} alt={l.title}
                  className="w-9 h-9 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{l.title}</p>
                  <p className="text-[10px] text-gray-400">{formatPrice(l.price)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <Eye className="w-3.5 h-3.5" /> {l.views_count || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Store ─────────────────────────────────────────────────────────────────── */
function StoreTab({ user }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    store_name:   user.store_name   || '',
    store_slug:   user.store_slug   || '',
    bio:          user.bio          || '',
    cover_banner: user.cover_banner || '',
  })
  const [saved, setSaved] = useState(false)

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch('/sellers/me/store', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const SOCIAL_FIELDS = [
    { key: 'fb_url',        label: 'Facebook',  placeholder: 'https://facebook.com/yourpage',  icon: Facebook,   color: '#1877f2' },
    { key: 'ig_url',        label: 'Instagram', placeholder: 'https://instagram.com/yourpage', icon: Instagram,  color: '#e1306c' },
    { key: 'tw_url',        label: 'X/Twitter', placeholder: 'https://x.com/yourpage',         icon: Twitter,    color: '#000000' },
    { key: 'yt_url',        label: 'YouTube',   placeholder: 'https://youtube.com/@yourchannel',icon: Youtube,   color: '#ff0000' },
    { key: 'whatsapp_num',  label: 'WhatsApp',  placeholder: '+233 XX XXX XXXX',               icon: Send,       color: '#25d366' },
    { key: 'website_url',   label: 'Website',   placeholder: 'https://yourwebsite.com',        icon: Globe,      color: '#6b7280' },
  ]

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Cover banner */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
        <div className="h-32 relative" style={{ background: form.cover_banner ? `url(${form.cover_banner}) center/cover` : '#ECEAE6' }}>
          {!form.cover_banner && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Cover Banner URL</label>
            <input value={form.cover_banner}
              onChange={(e) => setForm((f) => ({ ...f, cover_banner: e.target.value }))}
              placeholder="https://… (1200×400 recommended)"
              className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
              style={{ border: '1px solid #e5e7eb' }} />
          </div>
        </div>
      </div>

      {/* Store info */}
      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #f0eeeb' }}>
        <p className="text-sm font-bold text-gray-800">Store Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Store Name</label>
            <input value={form.store_name}
              onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value, store_slug: autoSlug(e.target.value) }))}
              placeholder="My Store"
              className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
              style={{ border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Store URL Slug</label>
            <div className="flex items-center gap-0 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
              <span className="px-2 py-2.5 text-xs text-gray-400 bg-gray-50 border-r shrink-0" style={{ borderColor: '#e5e7eb' }}>/store/</span>
              <input value={form.store_slug}
                onChange={(e) => setForm((f) => ({ ...f, store_slug: e.target.value }))}
                placeholder="my-store"
                className="flex-1 px-2 py-2.5 text-sm focus:outline-none font-mono" />
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1.5">Store Bio</label>
          <textarea rows={4} value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell buyers what you sell and why they should choose you…"
            className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none resize-none"
            style={{ border: '1px solid #e5e7eb' }} />
        </div>
      </div>

      {/* Social links */}
      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #f0eeeb' }}>
        <p className="text-sm font-bold text-gray-800">Social Links</p>
        <div className="space-y-2.5">
          {SOCIAL_FIELDS.map(({ key, label, placeholder, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: form[key] ? `${color}15` : '#ECEAE6' }}>
                <Icon className="w-4 h-4" style={{ color: form[key] ? color : '#9ca3af' }} />
              </div>
              <input value={form[key] || ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ border: '1px solid #e5e7eb' }} />
              {form[key] && (
                <a href={form[key]} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => save()} disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: '#B81365' }}>
          {saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {user.store_slug && (
          <Link to={`/store/${user.store_slug}`} target="_blank"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800">
            <ExternalLink className="w-4 h-4" /> View Store
          </Link>
        )}
      </div>
    </div>
  )
}

/* ─── Subscription ──────────────────────────────────────────────────────────── */
function SubscriptionTab({ tier }) {
  const [upgrading, setUpgrading] = useState(null)

  const { data: sub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api.get('/subscriptions/me').then((r) => r.data.data),
  })

  const { mutate: upgrade, isPending } = useMutation({
    mutationFn: (plan) => api.post('/subscriptions/upgrade', { plan }).then((r) => r.data.data),
    onSuccess: (data) => { if (data?.authorization_url) window.location.href = data.authorization_url },
  })

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Current plan */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current Plan</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black" style={{ fontFamily: "'Poppins', sans-serif", color: PLANS[tier]?.color }}>
            {PLANS[tier]?.label}
          </span>
          {tier !== 'free' && sub?.ends_at && (
            <span className="text-xs text-gray-400">
              · Renews {new Date(sub.ends_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {PLANS[tier]?.features.map((f) => (
            <span key={f} className="flex items-center gap-1 text-xs text-gray-600">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#15803d' }} /> {f}
            </span>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrent = key === tier
          const isUpgrade = key === 'pro' && tier === 'free' || key === 'business' && tier !== 'business'
          return (
            <div key={key} className="rounded-2xl bg-white p-5 flex flex-col"
              style={{ border: isCurrent ? `2px solid ${plan.color}` : '1px solid #f0eeeb' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-black text-sm" style={{ color: plan.color }}>{plan.label}</span>
                {isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: plan.bg, color: plan.color }}>Current</span>}
              </div>
              <p className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {plan.price === 0 ? 'Free' : `GHS ${plan.price}`}
                {plan.price > 0 && <span className="text-xs font-medium text-gray-400">/mo</span>}
              </p>
              <ul className="space-y-1.5 flex-1 my-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: plan.color }} /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-xs font-bold text-center py-2 rounded-xl" style={{ background: plan.bg, color: plan.color }}>
                  Active Plan
                </div>
              ) : key === 'free' ? (
                <div className="text-xs text-center text-gray-400 py-2">—</div>
              ) : (
                <button onClick={() => upgrade(key)} disabled={isPending}
                  className="py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: plan.color }}>
                  {isPending && upgrading === key ? 'Redirecting…' : `Upgrade to ${plan.label}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Payments are processed securely via Paystack. Cancel anytime from your account.
      </p>
    </div>
  )
}

/* ─── Notifications ─────────────────────────────────────────────────────────── */
function NotificationsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.get(`/notifications?page=${page}&limit=20`).then((r) => r.data.data),
  })

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.notifications || []
  const totalPages = data?.totalPages || 1
  const unread = notifications.filter((n) => !n.read_at).length

  const TYPE_ICON = {
    listing_approved: { icon: CheckCircle, color: '#15803d', bg: '#dcfce7' },
    listing_flagged:  { icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
    listing_soft_live:{ icon: Clock, color: '#854d0e', bg: '#fefce8' },
    new_message:      { icon: MessageSquare, color: '#1d4ed8', bg: '#eff6ff' },
    review:           { icon: Star, color: '#B81365', bg: '#fdf2f5' },
    announcement:     { icon: Bell, color: '#7e22ce', bg: '#f5f3ff' },
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid #f0eeeb' }}>
        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
        <p className="text-sm text-gray-400">No notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        {unread > 0 && (
          <button onClick={() => markAll()} className="text-xs font-bold" style={{ color: '#B81365' }}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const tm = TYPE_ICON[n.type] || TYPE_ICON.announcement
          const Icon = tm.icon
          const isUnread = !n.read_at
          return (
            <div key={n.id}
              className="rounded-2xl bg-white p-4 flex items-start gap-3 cursor-pointer"
              style={{ border: isUnread ? `1px solid ${tm.color}40` : '1px solid #f0eeeb', background: isUnread ? `${tm.bg}50` : 'white' }}
              onClick={() => { if (isUnread) markRead(n.id) }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tm.bg }}>
                <Icon className="w-4 h-4" style={{ color: tm.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{n.title || n.message}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {isUnread && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#B81365' }} />}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
            style={{ background: '#ECEAE6', color: '#374151' }}>← Prev</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
            style={{ background: '#ECEAE6', color: '#374151' }}>Next →</button>
        </div>
      )}
    </div>
  )
}
