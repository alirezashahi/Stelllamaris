import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Homepage from './components/pages/Homepage'
import ProductsPage from './components/pages/ProductsPage'
import ProductDetailPage from './components/pages/ProductDetailPage'
import CartPage from './components/pages/CartPage'
import UserAccountPage from './components/pages/UserAccountPage'
import WishlistPage from './components/pages/WishlistPage'
import RecentlyViewedPage from './components/pages/RecentlyViewedPage'
import CheckoutPage from './components/pages/CheckoutPage'
import OrderConfirmationPage from './components/pages/OrderConfirmationPage'
import ShippingReturnsPage from './components/pages/ShippingReturnsPage'
import FAQPage from './components/pages/FAQPage'
import AdminDashboard from './components/admin/AdminDashboard'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CheckoutProvider } from './contexts/CheckoutContext'

// Protected Admin Route Component
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stellamaris-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <RedirectToSignIn />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <a href="/" className="text-stellamaris-600 hover:text-stellamaris-700 font-medium">
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

const App = () => {
  return (
    <CartProvider>
      <AuthProvider>
        <CheckoutProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/bags" element={<ProductsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/recently-viewed" element={<RecentlyViewedPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route 
                  path="/wishlist" 
                  element={
                    <>
                      <SignedIn>
                        <WishlistPage />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  } 
                />
                <Route 
                  path="/account" 
                  element={
                    <>
                      <SignedIn>
                        <UserAccountPage />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  } 
                />
                {/* Add more routes as we build them */}
              </Routes>
            </main>
            <Footer />
          </div>
        </CheckoutProvider>
      </AuthProvider>
    </CartProvider>
  )
}

export default App 