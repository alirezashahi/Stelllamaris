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
import AdminDashboard from './components/admin/AdminDashboard'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { CheckoutProvider } from './contexts/CheckoutContext'

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
                <Route path="/admin" element={<AdminDashboard />} />
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