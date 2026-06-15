import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, Package, TrendingUp, Store, Crown, Bell,
  Plus, Edit2, Trash2, Eye, Heart, MessageSquare, Zap,
  CheckCircle, Clock, AlertTriangle, Star, ExternalLink,
  ChevronRight, ArrowUpRight, Camera, Globe, Instagram,
  Facebook, Twitter, Youtube, Linkedin, Send, X,
  ToggleLeft, ToggleRight, ShieldCheck, Lock, Target, Flame,
  Phone, UserCog, KeyRound, BadgeCheck, CircleUser, ImagePlus,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { formatPrice, timeAgo } from '../utils/format'

const TABS = [
  { id: 'overview',      label: 'Overview',     icon: LayoutDashboard },
  { id: 'listings',      label: 'My Listings',  icon: Package },
  { id: 'analytics',     label: 'Analytics',    icon: TrendingUp },
  { id: 'store',         label: 'Store',         icon: Store },
  { id: 'subscription',  label: 'Subscription', icon: Crown },
  { id: 'account',       label: 'Account',       icon: UserCog },
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
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.openTab || 'overview')

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
              <div className="flex items-center gap-2">
                <h1 className="font-black text-gray-900 text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {user.store_name || user.name}
                </h1>
                {user.phone_verified && (
                  <span title="Phone verified" className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: PLANS[tier]?.bg, color: PLANS[tier]?.color }}>
                  {PLANS[tier]?.label} Plan
                </span>
                {user.phone && <span className="text-xs text-gray-400">{user.phone}</span>}
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
        {tab === 'store'         && <StoreTab user={user} setTab={setTab} />}
        {tab === 'subscription'  && <SubscriptionTab tier={tier} />}
        {tab === 'account'       && <AccountTab user={user} />}
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
      {/* Profile completion prompts */}
      {(!user.store_name || !user.phone_verified) && (
        <div className="space-y-2">
          {!user.store_name && (
            <button onClick={() => setTab('store')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all hover:opacity-90"
              style={{ background: '#fdf2f5', border: '1.5px dashed #F8C0C8' }}>
              <span className="text-xl">✍️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#B81365' }}>Set your display name</p>
                <p className="text-xs text-gray-500 mt-0.5">Your ads currently show your email username. Add a display name so buyers know who you are.</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#B81365' }} />
            </button>
          )}
          {!user.phone_verified && (
            <button onClick={() => setTab('account')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all hover:opacity-90"
              style={{ background: '#eff6ff', border: '1.5px dashed #93c5fd' }}>
              <Phone className="w-5 h-5 shrink-0" style={{ color: '#1d4ed8' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#1d4ed8' }}>Verify your phone number</p>
                <p className="text-xs text-gray-500 mt-0.5">Verified sellers get 3× more trust from buyers. Takes 30 seconds.</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Verify →</span>
            </button>
          )}
        </div>
      )}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((l) => {
            const st = STATUS_STYLE[l.status] || STATUS_STYLE.expired
            const boost = l.boost_tier ? BOOST_STYLE[l.boost_tier] : null
            return (
              <div key={l.id} className="rounded-2xl bg-white overflow-hidden flex flex-col" style={{ border: '1px solid #f0eeeb' }}>
                {/* Image */}
                <Link to={`/listing/${l.id}`} className="block relative">
                  <img src={l.images?.[0]?.url || '/placeholder.jpg'} alt={l.title}
                    className="w-full aspect-square object-cover" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  {boost && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                      style={{ background: boost.bg, color: boost.color }}>
                      <Zap className="w-2.5 h-2.5" />{boost.label}
                    </span>
                  )}
                  {l.is_flagged && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                      style={{ background: '#fef2f2', color: '#dc2626' }}>
                      <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col">
                  <Link to={`/listing/${l.id}`}
                    className="text-xs font-bold text-gray-900 hover:underline line-clamp-2 leading-snug mb-1">{l.title}</Link>
                  <p className="text-sm font-black mb-2" style={{ color: '#B81365', fontFamily: "'Poppins', sans-serif" }}>
                    {formatPrice(l.price)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-auto">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{l.views_count || 0}</span>
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{l.saves_count || 0}</span>
                    <span className="ml-auto">{timeAgo(l.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center border-t divide-x" style={{ borderColor: '#f5f4f2' }}>
                  {l.status === 'active' && (
                    <button title="Mark as Sold"
                      onClick={() => { if (confirm('Mark this listing as sold?')) toggleMutation.mutate({ id: l.id, status: 'sold' }) }}
                      className="flex-1 py-2 text-[10px] font-bold transition-colors hover:bg-green-50"
                      style={{ color: '#15803d' }}>
                      Sold
                    </button>
                  )}
                  {l.status === 'sold' && (
                    <button onClick={() => toggleMutation.mutate({ id: l.id, status: 'active' })}
                      className="flex-1 py-2 text-[10px] font-bold transition-colors hover:bg-purple-50"
                      style={{ color: '#7e22ce' }}>
                      Relist
                    </button>
                  )}
                  {l.status === 'expired' && (
                    <button onClick={() => toggleMutation.mutate({ id: l.id, status: 'active' })}
                      className="flex-1 py-2 text-[10px] font-bold transition-colors hover:bg-green-50"
                      style={{ color: '#15803d' }}>
                      Activate
                    </button>
                  )}
                  {(l.status === 'pending' || l.status === 'soft_live') && (
                    <span className="flex-1 py-2 text-[10px] text-center text-gray-300">In review</span>
                  )}
                  {l.status === 'active' && (
                    <button title="Pause"
                      onClick={() => toggleMutation.mutate({ id: l.id, status: 'expired' })}
                      className="px-3 py-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
                      <ToggleRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button title="Delete"
                    onClick={() => { if (confirm('Delete this listing? This cannot be undone.')) deleteMutation.mutate(l.id) }}
                    className="px-3 py-2 text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
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
function StoreTab({ user, setTab }) {
  const tier = user.subscription_tier || 'free'

  if (tier === 'free') {
    const SELLER_FEATURES = [
      { icon: Store,       label: 'Your own store page',         desc: '/store/your-name — share one link with all buyers' },
      { icon: TrendingUp,  label: 'Analytics dashboard',         desc: 'Views, saves, inquiries per listing over time' },
      { icon: Zap,         label: '3 featured boosts/month',     desc: 'Push your listings to the top of search results' },
      { icon: BadgeCheck,  label: 'Verified seller badge',       desc: 'Shown on every listing — builds instant buyer trust' },
      { icon: ArrowUpRight,label: 'Priority search placement',   desc: 'Your ads rank higher than free-plan listings' },
      { icon: Package,     label: 'Up to 25 active listings',    desc: 'vs 5 on the free plan' },
    ]

    const PLANS_GATE = [
      {
        key: 'pro', label: 'Seller', price: 50, color: '#B81365', bg: '#fdf2f5',
        perks: ['25 active listings', 'Store profile page', 'Analytics dashboard', '3 boosts/month', 'Verified badge', 'Priority search'],
      },
      {
        key: 'business', label: 'Business', price: 150, color: '#c2410c', bg: '#fff7ed',
        perks: ['Unlimited listings', 'Everything in Seller', '10 boosts/month', 'Top search placement', 'Custom store URL', 'Dedicated support'],
      },
    ]

    return (
      <div className="max-w-2xl space-y-5">
        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #B81365 100%)' }}>
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Unlock Your Seller Account
            </h2>
            <p className="text-white/70 text-sm max-w-sm mx-auto leading-relaxed">
              Get your own branded store page, analytics, featured boosts, and a Verified badge — everything a serious seller needs to stand out in Ghana.
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">What you unlock as a Seller</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SELLER_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fafaf9', border: '1px solid #f0eeeb' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fdf2f5' }}>
                  <Icon className="w-4 h-4" style={{ color: '#B81365' }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANS_GATE.map(({ key, label, price, color, bg, perks }) => (
            <div key={key} className="rounded-2xl bg-white p-5 flex flex-col" style={{ border: `2px solid ${color}20` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black" style={{ color }}>{label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                  {key === 'pro' ? 'Most Popular' : 'Best Value'}
                </span>
              </div>
              <p className="text-3xl font-black text-gray-900 mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                GHS {price}<span className="text-sm font-medium text-gray-400">/mo</span>
              </p>
              <ul className="space-y-1.5 my-4 flex-1">
                {perks.map((p) => (
                  <li key={p} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color }} /> {p}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setTab('subscription')}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: color }}>
                Upgrade to {label} →
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400">
          Payments processed securely via Paystack · Cancel anytime
        </p>
      </div>
    )
  }

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

      {/* Plan cards — admin tier is never shown to users */}
      {tier === 'admin' ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: '#f5f3ff', border: '2px solid #7c3aed30' }}>
          <p className="text-sm font-bold" style={{ color: '#7c3aed' }}>You have full admin access — all features are unlocked.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(PLANS).filter(([key]) => key !== 'admin').map(([key, plan]) => {
          const isCurrent = key === tier
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
      )}

      {tier !== 'admin' && (
        <p className="text-xs text-gray-400 text-center">
          Payments are processed securely via Paystack. Cancel anytime from your account.
        </p>
      )}
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

/* ─── Account ───────────────────────────────────────────────────────────────── */
function AccountTab({ user }) {
  const { setAuth } = useAuthStore()
  const qc = useQueryClient()

  // Phone verification state
  const [phoneInput, setPhoneInput] = useState(user.phone?.replace('+233', '') || '')
  const [otpSent, setOtpSent]       = useState(false)
  const [otp, setOtp]               = useState('')
  const [phoneMsg, setPhoneMsg]     = useState(null)
  const [phonePending, setPhonePending] = useState(false)
  const [verifyPending, setVerifyPending] = useState(false)

  // Password state
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg]       = useState(null)
  const [pwPending, setPwPending] = useState(false)

  // Avatar state
  const [avatarUrl, setAvatarUrl]   = useState(user.avatar || '')
  const [avatarMsg, setAvatarMsg]   = useState(null)
  const [avatarPending, setAvatarPending] = useState(false)

  // Profile completeness
  const checks = [
    { label: 'Phone verified',   done: !!user.phone_verified, icon: Phone,      color: '#1d4ed8' },
    { label: 'Display name set', done: !!user.store_name,     icon: CircleUser, color: '#B81365' },
    { label: 'Avatar uploaded',  done: !!user.avatar,         icon: ImagePlus,  color: '#7e22ce' },
    { label: 'First listing',    done: true,                  icon: Package,    color: '#15803d' },
  ]
  const doneCount = checks.filter((c) => c.done).length
  const pct = Math.round((doneCount / checks.length) * 100)

  async function sendOtp() {
    setPhonePending(true); setPhoneMsg(null)
    try {
      const raw = phoneInput.replace(/^0/, '').replace(/\D/g, '')
      await api.post('/auth/request-phone-verify', { phone: raw })
      setOtpSent(true)
      setPhoneMsg({ type: 'success', text: 'Code sent! Check your phone.' })
    } catch (err) {
      setPhoneMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send code' })
    } finally { setPhonePending(false) }
  }

  async function verifyOtp() {
    setVerifyPending(true); setPhoneMsg(null)
    try {
      const raw = phoneInput.replace(/^0/, '').replace(/\D/g, '')
      const res = await api.post('/auth/verify-phone', { phone: raw, otp })
      setAuth(res.data.data.user, res.data.data.token, res.data.data.refreshToken)
      setOtpSent(false); setOtp('')
      setPhoneMsg({ type: 'success', text: '✅ Phone verified! Your Verified badge is now showing.' })
    } catch (err) {
      setPhoneMsg({ type: 'error', text: err.response?.data?.message || 'Invalid code' })
    } finally { setVerifyPending(false) }
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'New passwords don\'t match' }); return }
    if (pwForm.next.length < 8) { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters' }); return }
    setPwPending(true); setPwMsg(null)
    try {
      await api.post('/auth/change-password', { current_password: pwForm.current, new_password: pwForm.next })
      setPwForm({ current: '', next: '', confirm: '' })
      setPwMsg({ type: 'success', text: '✅ Password updated successfully' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' })
    } finally { setPwPending(false) }
  }

  async function saveAvatar() {
    setAvatarPending(true); setAvatarMsg(null)
    try {
      const res = await api.patch('/users/me', { avatar: avatarUrl })
      setAuth({ ...user, avatar: avatarUrl }, null, null)
      setAvatarMsg({ type: 'success', text: '✅ Avatar updated' })
    } catch (err) {
      setAvatarMsg({ type: 'error', text: 'Failed to update avatar' })
    } finally { setAvatarPending(false) }
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Profile completeness */}
      <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-800">Profile Strength</p>
            <p className="text-xs text-gray-400 mt-0.5">Complete your profile to build trust with buyers</p>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#ECEAE6" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={pct === 100 ? '#15803d' : '#B81365'} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: pct === 100 ? '#15803d' : '#B81365' }}>{pct}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {checks.map(({ label, done, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: done ? '#f0fdf4' : '#fafaf9', border: `1px solid ${done ? '#bbf7d0' : '#f0eeeb'}` }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: done ? '#dcfce7' : '#ECEAE6' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: done ? '#15803d' : '#9ca3af' }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: done ? '#15803d' : '#6b7280' }}>{label}</span>
              {done
                ? <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0 text-green-500" />
                : <div className="w-3.5 h-3.5 ml-auto shrink-0 rounded-full border-2 border-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Phone verification */}
      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" style={{ color: '#1d4ed8' }} />
          <p className="text-sm font-bold text-gray-800">Phone Number</p>
          {user.phone_verified
            ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: '#dcfce7', color: '#15803d' }}><BadgeCheck className="w-3 h-3" /> Verified</span>
            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: '#fef2f2', color: '#dc2626' }}>Not verified</span>}
        </div>

        {user.phone_verified ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <BadgeCheck className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">{user.phone}</p>
              <p className="text-xs text-green-600">Your number is verified — buyers see your Verified badge</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background: '#eff6ff', color: '#1e40af' }}>
              <strong>Why verify?</strong> Verified sellers are trusted by buyers, show a Verified badge on all listings, and are prioritised in search.
            </div>
            {!otpSent ? (
              <div className="flex gap-2">
                <div className="flex rounded-xl overflow-hidden flex-1" style={{ border: '1px solid #e5e7eb' }}>
                  <span className="flex items-center px-3 text-sm text-gray-400 bg-gray-50 border-r shrink-0" style={{ borderColor: '#e5e7eb' }}>+233</span>
                  <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="24 123 4567"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                </div>
                <button onClick={sendOtp} disabled={phonePending || phoneInput.length < 9}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shrink-0"
                  style={{ background: '#1d4ed8' }}>
                  {phonePending ? 'Sending…' : 'Send Code'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Enter the 6-digit code sent to <strong>+233{phoneInput}</strong></p>
                <div className="flex gap-2">
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000 000"
                    maxLength={6}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-center tracking-widest font-bold focus:outline-none"
                    style={{ border: '1px solid #e5e7eb', letterSpacing: '0.4em' }} />
                  <button onClick={verifyOtp} disabled={verifyPending || otp.length < 6}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shrink-0"
                    style={{ background: '#1d4ed8' }}>
                    {verifyPending ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
                <button onClick={() => setOtpSent(false)} className="text-xs text-gray-400 hover:underline">← Change number</button>
                <button onClick={sendOtp} className="text-xs ml-3 hover:underline" style={{ color: '#1d4ed8' }}>Resend code</button>
              </div>
            )}
          </div>
        )}

        {phoneMsg && (
          <p className={`text-xs font-semibold px-3 py-2 rounded-xl`}
            style={{ background: phoneMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: phoneMsg.type === 'success' ? '#15803d' : '#dc2626' }}>
            {phoneMsg.text}
          </p>
        )}
      </div>

      {/* Avatar */}
      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-bold text-gray-800">Profile Photo</p>
        </div>
        <div className="flex items-center gap-4">
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=B81365&color=fff&size=80`}
            alt="avatar" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
          <div className="flex-1 space-y-2">
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste image URL (https://…)"
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ border: '1px solid #e5e7eb' }} />
            <button onClick={saveAvatar} disabled={avatarPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
              style={{ background: '#B81365' }}>
              {avatarPending ? 'Saving…' : 'Update Photo'}
            </button>
          </div>
        </div>
        {avatarMsg && (
          <p className="text-xs font-semibold px-3 py-2 rounded-xl"
            style={{ background: avatarMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: avatarMsg.type === 'success' ? '#15803d' : '#dc2626' }}>
            {avatarMsg.text}
          </p>
        )}
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #f0eeeb' }}>
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-bold text-gray-800">Change Password</p>
        </div>
        <div className="space-y-2.5">
          {[
            { key: 'current', label: 'Current password', placeholder: '••••••••' },
            { key: 'next',    label: 'New password',     placeholder: 'At least 8 characters' },
            { key: 'confirm', label: 'Confirm new password', placeholder: 'Re-enter new password' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
              <input type="password" value={pwForm[key]}
                onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ border: '1px solid #e5e7eb' }} />
            </div>
          ))}
        </div>
        <button onClick={changePassword} disabled={pwPending || !pwForm.current || !pwForm.next}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: '#B81365' }}>
          {pwPending ? 'Updating…' : 'Update Password'}
        </button>
        {pwMsg && (
          <p className="text-xs font-semibold px-3 py-2 rounded-xl"
            style={{ background: pwMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: pwMsg.type === 'success' ? '#15803d' : '#dc2626' }}>
            {pwMsg.text}
          </p>
        )}
      </div>

    </div>
  )
}
