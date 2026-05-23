import React, { Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import OrderTrackingPopup from './components/OrderTrackingPopup'
import CartToast from './components/CartToast'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import { ToastProvider, setToastFunction, useToast } from './components/Toast'
import { CartProvider, useCart } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import WelcomePage from './components/WelcomePage.jsx'

// Lazy load all route components for code splitting
const Category = React.lazy(() => import('./pages/customer/Category'))
const Menu = React.lazy(() => import('./pages/customer/Menu'))
const Cart = React.lazy(() => import('./pages/customer/Cart'))
const Payment = React.lazy(() => import('./pages/customer/Payment'))
const Checkout = React.lazy(() => import('./pages/customer/Checkout'))
const OrderTracking = React.lazy(() => import('./pages/customer/OrderTracking'))
const Profile = React.lazy(() => import('./pages/customer/Profile'))
const LoginWrapper = React.lazy(() => import('./components/LoginWrapper'))
const HelpSupport = React.lazy(() => import('./pages/customer/HelpSupport'))
const TermsConditions = React.lazy(() => import('./pages/customer/TermsConditions'))
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'))
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'))
const MenuManagement = React.lazy(() => import('./pages/admin/MenuManagement'))
const SalesAnalytics = React.lazy(() => import('./pages/admin/SalesAnalytics'))
const Reports = React.lazy(() => import('./pages/admin/Reports'))
const Billing = React.lazy(() => import('./pages/admin/Billing'))
const AdminProfile = React.lazy(() => import('./pages/admin/AdminProfile'))
const SuperAdminDashboard = React.lazy(() => import('./pages/admin/SuperAdminDashboard'))
const SuperAdminLogin = React.lazy(() => import('./pages/superadmin/SuperAdminLogin'))
const SuperAdminDash = React.lazy(() => import('./pages/superadmin/SuperAdminDashboard'))
const CreateRestaurant = React.lazy(() => import('./pages/superadmin/CreateRestaurant'))
const ViewRestaurants = React.lazy(() => import('./pages/superadmin/ViewRestaurants'))
const SuperAdminAnalytics = React.lazy(() => import('./pages/superadmin/SuperAdminAnalytics'))

// Root route handler - shows WelcomePage if siteCode exists, otherwise SuperAdminLogin
const RootRoute = () => {
  const [siteCode, setSiteCode] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('siteCode')
    if (code) {
      localStorage.setItem('siteCode', code.toUpperCase())
      setSiteCode(code.toUpperCase())
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <PageLoader />
  }

  return siteCode ? <WelcomePage /> : <SuperAdminLogin />
}

// Loading fallback component for lazy-loaded routes
const PageLoader = () => (
  <LoadingSpinner fullScreen message="Loading page..." />
)

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
              <AppContent />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isSuperAdminRoute = location.pathname.startsWith('/superadmin')
  const isWelcomePage = location.pathname === '/'
  const { showToast, lastAddedItem, hideToast } = useCart()
  const toast = useToast()
  
  // Set up toast function for global access
  useEffect(() => {
    setToastFunction(toast.showToast)
  }, [toast.showToast])

  // Scroll to top on every page navigation
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Store siteCode from URL to localStorage when user visits the site
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const siteCodeFromUrl = urlParams.get('siteCode')

    if (siteCodeFromUrl) {
      // Store siteCode in localStorage for later use
      localStorage.setItem('siteCode', siteCodeFromUrl.toUpperCase())
    }
  }, [location.search])

  return (
    <div className="App">
      {!isAdminRoute && !isSuperAdminRoute && !isWelcomePage && <Navbar />}
      {!isAdminRoute && !isWelcomePage && <OrderTrackingPopup />}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootRoute />} />

            <Route path="/Category" element={<Category />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<LoginWrapper />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/menu" element={<MenuManagement />} />
            <Route path="/admin/analytics" element={<SalesAnalytics />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/billing" element={<Billing />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/superadmin" element={<SuperAdminLogin />} />
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/superadmin/dashboard" element={<SuperAdminDash />} />
            <Route path="/superadmin/create-restaurant" element={<CreateRestaurant />} />
            <Route path="/superadmin/restaurants" element={<ViewRestaurants />} />
            <Route path="/superadmin/analytics" element={<SuperAdminAnalytics />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && !isSuperAdminRoute && !isWelcomePage && <Footer />}
      
      {/* Cart Toast Notification - Shows globally when item is added */}
      <CartToast
        show={showToast}
        itemName={lastAddedItem || undefined}
        onClose={hideToast}
      />
    </div>
  )
}

export default App
