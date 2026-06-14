import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import PostListing from './pages/PostListing'
import Dashboard from './pages/Dashboard'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/Dashboard'
import SearchAnalytics from './pages/Admin/SearchAnalytics'
import AdminListings from './pages/Admin/Listings'
import AdminUsers from './pages/Admin/Users'
import AdminIntelligence from './pages/Admin/Intelligence'
import AdminModeration from './pages/Admin/Moderation'
import AdminSettings from './pages/Admin/Settings'
import AdminRevenue from './pages/Admin/Revenue'
import AdminReports from './pages/Admin/Reports'
import AdminBoosts from './pages/Admin/Boosts'
import AdminCategories from './pages/Admin/Categories'
import AdminAnnouncements from './pages/Admin/Announcements'
import MarketIntelligence from './pages/MarketIntelligence'
import CategoryCityLanding from './pages/Seo/CategoryCityLanding'
import SellerStore from './pages/SellerStore'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/Legal/PrivacyPolicy'
import TermsOfService from './pages/Legal/TermsOfService'
import ContactUs from './pages/Legal/ContactUs'
import SafetyTips from './pages/Legal/SafetyTips'
import useAuthStore from './store/authStore'
import TrackingInjector from './components/TrackingInjector'

function RequireAuth({ children }) {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  // TODO: restore auth check after DB is connected
  return children
  // const { isLoggedIn, user } = useAuthStore()
  // if (!isLoggedIn()) return <Navigate to="/login" replace />
  // if (user?.subscription_tier !== 'admin') return <Navigate to="/" replace />
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <TrackingInjector />
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post" element={<RequireAuth><PostListing /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/market" element={<RequireAuth><MarketIntelligence /></RequireAuth>} />
          <Route path="/seller/:id"    element={<SellerStore />} />
          <Route path="/store/:slug"  element={<SellerStore />} />
          <Route path="/buy/:category/:city" element={<CategoryCityLanding />} />
          <Route path="/buy/:category" element={<Browse />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="search" element={<SearchAnalytics />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="intelligence" element={<AdminIntelligence />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="boosts" element={<AdminBoosts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>

          {/* Legal / info pages — required for Google Ads */}
          <Route path="/privacy"  element={<PrivacyPolicy />} />
          <Route path="/terms"    element={<TermsOfService />} />
          <Route path="/contact"  element={<ContactUs />} />
          <Route path="/safety"   element={<SafetyTips />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
