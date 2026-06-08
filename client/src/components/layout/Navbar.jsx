import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, Plus, ChevronDown,
  User, LogOut, LayoutDashboard, MessageSquare, Heart,
  Menu, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useNotifStore from '../../store/notifStore'
import SearchAutocomplete from '../search/SearchAutocomplete'
import Logo from './Logo'


const NAV_BG      = '#B81365'
const NAV_HOVER   = 'rgba(255,255,255,0.10)'
const ACCENT      = '#FFFFFF'

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuthStore()
  const { unreadCount } = useNotifStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: NAV_BG, boxShadow: '0 1px 0 rgba(0,0,0,0.12)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="shrink-0" aria-label="SIKA Ghana — Home">
          <Logo markColor="white" textColor="white" size={26} />
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg hidden sm:block">
          <SearchAutocomplete placeholder="Search listings…" source="navbar" />
        </div>

        <div className="ml-auto flex items-center gap-1">

          {isLoggedIn() ? (
            <>
              <NavIconBtn as={Link} to="/notifications" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white text-[#B81365] text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavIconBtn>

              <NavIconBtn as={Link} to="/messages" className="hidden sm:flex">
                <MessageSquare className="w-4 h-4" />
              </NavIconBtn>

              {/* Post Ad CTA */}
              <Link
                to="/post"
                className="hidden sm:inline-flex items-center gap-1.5 ml-2 font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-95"
                style={{ background: ACCENT, color: '#B81365', fontFamily: "'DM Sans', sans-serif" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Post Ad
              </Link>

              {/* Profile */}
              <div ref={profileRef} className="relative ml-1">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-150"
                  style={{ background: profileOpen ? NAV_HOVER : 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = NAV_HOVER}
                  onMouseLeave={(e) => !profileOpen && (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=F8C0C8&color=B81365&bold=true`}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ border: '2px solid rgba(255,255,255,0.25)' }}
                  />
                  <ChevronDown
                    className="w-3.5 h-3.5 text-white/60 transition-transform duration-150"
                    style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                  />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 animate-fade-in"
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <p className="font-semibold text-sm text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <DropdownLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                      <DropdownLink to="/saved"     icon={Heart}          label="Saved Listings" />
                      <DropdownLink to="/messages"  icon={MessageSquare}  label="Messages" />
                      <DropdownLink to="/profile"   icon={User}           label="My Profile" />
                    </div>
                    <div className="py-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => { logout(); navigate('/') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors duration-150 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium px-4 py-2 rounded-xl text-white/80 hover:text-white transition-colors duration-150"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={(e) => e.currentTarget.style.background = NAV_HOVER}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-95"
                style={{ background: ACCENT, color: '#B81365', fontFamily: "'DM Sans', sans-serif" }}
              >
                Join Free
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="sm:hidden ml-1 p-2 rounded-xl transition-all duration-150 text-white"
            style={{ background: menuOpen ? NAV_HOVER : 'transparent' }}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="sm:hidden px-4 py-4 space-y-3 animate-slide-up"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)', background: NAV_BG }}
        >
          <SearchAutocomplete placeholder="Search listings…" />
          <Link
            to={isLoggedIn() ? '/post' : '/register'}
            className="flex items-center justify-center gap-2 w-full font-semibold py-2.5 rounded-xl transition-all duration-150 hover:opacity-90 text-sm"
            style={{ background: ACCENT, color: '#B81365' }}
          >
            <Plus className="w-4 h-4" />
            {isLoggedIn() ? 'Post Ad' : 'Join Free'}
          </Link>
        </div>
      )}
    </header>
  )
}

function NavIconBtn({ children, as: Tag = 'button', className = '', ...props }) {
  return (
    <Tag
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl text-white/80 hover:text-white transition-all duration-150 ${className}`}
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.background = NAV_HOVER}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      {...props}
    >
      {children}
    </Tag>
  )
}

function DropdownLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[#fdf2f5] hover:text-[#B81365]"
    >
      <Icon className="w-4 h-4 text-gray-400" />
      {label}
    </Link>
  )
}
