import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingBag, User, Menu, X, Heart, Settings } from 'lucide-react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal from '../auth/LoginModal'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { getTotalItems } = useCart()

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleToggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  const handleSignInClick = () => {
    setIsLoginModalOpen(true)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top banner for charity message */}
      <div className="charity-impact-card text-center py-2 px-4">
        <p className="text-sm text-sage-800">
          🌱 <strong>Making a difference together:</strong> 5% of our profits support animal shelters & charities of your choice
        </p>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={handleToggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="stellamaris-gradient w-8 h-8 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold stellamaris-text-gradient">
              Stellamaris
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              to="/bags" 
              className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors"
            >
              Bags
            </Link>
            <Link 
              to="/new-arrivals" 
              className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors"
            >
              New Arrivals
            </Link>
            <Link 
              to="/sustainability" 
              className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors"
            >
              Sustainability
            </Link>
            <Link 
              to="/our-impact" 
              className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors"
            >
              Our Impact
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              onClick={handleToggleSearch}
              className="p-2 text-gray-700 hover:text-stellamaris-600 transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-gray-700 hover:text-stellamaris-600 transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={20} />
            </Link>

            {/* Account Link - Only show when signed in */}
            <SignedIn>
              <Link
                to="/account"
                className="p-2 text-gray-700 hover:text-stellamaris-600 transition-colors"
                aria-label="My Account"
              >
                <Settings size={20} />
              </Link>
            </SignedIn>

            {/* User Account - Clerk Integration */}
            <div className="flex items-center space-x-2">
              <SignedOut>
                <button
                  onClick={handleSignInClick}
                  className="p-2 text-gray-700 hover:text-stellamaris-600 transition-colors flex items-center space-x-1"
                  aria-label="Sign In"
                >
                  <User size={20} />
                  <span className="hidden md:block text-sm font-medium">Sign In</span>
                </button>
              </SignedOut>
              
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "shadow-lg",
                      userButtonPopoverActionButton: "hover:bg-gray-100",
                    }
                  }}
                  userProfileMode="modal"
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </div>

            {/* Shopping Bag */}
            <Link
              to="/cart"
              className="p-2 text-gray-700 hover:text-stellamaris-600 transition-colors relative"
              aria-label="Shopping bag"
            >
              <ShoppingBag size={20} />
              {/* Cart item count badge */}
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-stellamaris-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar (when open) */}
        {isSearchOpen && (
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Search for sustainable luxury bags..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/bags" 
                className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Bags
              </Link>
              <Link 
                to="/new-arrivals" 
                className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                New Arrivals
              </Link>
              <Link 
                to="/sustainability" 
                className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sustainability
              </Link>
              <Link 
                to="/our-impact" 
                className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Our Impact
              </Link>
              
              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <SignedOut>
                  <button
                    onClick={() => {
                      handleSignInClick()
                      setIsMenuOpen(false)
                    }}
                    className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors py-2 block w-full text-left"
                  >
                    Sign In
                  </button>
                </SignedOut>
                
                <SignedIn>
                  <Link 
                    to="/account" 
                    className="text-gray-700 hover:text-stellamaris-600 font-medium transition-colors py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <div className="py-2">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                        }
                      }}
                      userProfileMode="modal"
                      afterSignOutUrl="/"
                    />
                  </div>
                </SignedIn>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  )
}

export default Header 