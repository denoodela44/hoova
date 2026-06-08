import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import {
  LayoutDashboard, Search, Users, Package,
  TrendingUp, ShieldCheck, LogOut, Settings2, ShieldAlert,
  DollarSign, Flag, Zap, Tag, Megaphone,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Logo from '../../components/layout/Logo'

const NAV = [
  { to: '/admin',              label: 'Dashboard',        icon: LayoutDashboard, end: true },
  { to: '/admin/moderation',   label: 'Moderation',       icon: ShieldAlert, badge: 'moderation' },
  { to: '/admin/listings',     label: 'Listings',         icon: Package },
  { to: '/admin/users',        label: 'Users',            icon: Users },
  { to: '/admin/reports',      label: 'Reports',          icon: Flag, badge: 'reports' },
  { to: '/admin/boosts',       label: 'Boosts',           icon: Zap },
  { to: '/admin/revenue',      label: 'Revenue',          icon: DollarSign },
  { to: '/admin/intelligence', label: 'Seller Intel',     icon: TrendingUp },
  { to: '/admin/categories',   label: 'Categories',       icon: Tag },
  { to: '/admin/announcements',label: 'Announcements',    icon: Megaphone },
  { to: '/admin/search',       label: 'Search Analytics', icon: Search },
  { to: '/admin/settings',     label: 'Settings',         icon: Settings2 },
]

export default function AdminLayout() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const { data: modCounts = {} } = useQuery({
    queryKey: ['admin', 'moderation', 'counts'],
    queryFn: async () => {
      try { return await api.get('/admin/moderation/counts').then((r) => r.data.data) }
      catch { return {} }
    },
    refetchInterval: 30000,
  })

  const { data: reportCounts = {} } = useQuery({
    queryKey: ['admin', 'reports', 'counts'],
    queryFn: async () => {
      try { return await api.get('/reports?limit=1').then((r) => r.data.data?.stats || {}) }
      catch { return {} }
    },
    refetchInterval: 60000,
  })

  const moderationBadge = (modCounts.pending || 0) + (modCounts.flagged || 0)
  const reportsBadge = reportCounts.pending || 0

  return (
    <div className="flex min-h-screen" style={{ background: '#f5f4f1' }}>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen"
        style={{ background: '#1a1a2e', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Logo markColor="#B81365" textColor="white" size={22} />
          <span
            className="block text-[10px] font-bold uppercase tracking-widest mt-1"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Admin Console
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => {
            const badgeCount = badge === 'moderation' ? moderationBadge : badge === 'reports' ? reportsBadge : 0
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`
                }
                style={({ isActive }) => isActive ? { background: '#B81365' } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badgeCount > 0 && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{ background: '#dc2626', color: 'white' }}
                  >
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: '#B81365', color: '#fff' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 h-14 flex items-center px-6 gap-4"
          style={{ background: 'rgba(245,244,241,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e9e6e0' }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: '#B81365' }} />
          <span className="text-sm font-semibold text-gray-700">HOOVA Admin</span>
          <span className="ml-auto text-xs text-gray-400">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
