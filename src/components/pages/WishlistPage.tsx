import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Check, Trash, Star } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

const WishlistPage = () => {
  const { user, isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const [addingToCart, setAddingToCart] = React.useState<{ [key: string]: boolean }>({})
  const [addedToCart, setAddedToCart] = React.useState<{ [key: string]: boolean }>({})
  
  // Get current user's Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkUserId: user.id } : "skip"
  )

  // Wishlist mutation to remove items
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist)

  // Get user's wishlist
  const wishlistItems = useQuery(
    api.wishlist.getUserWishlist,
    convexUser ? { userId: convexUser._id } : "skip"
  )

  const handleAddToCart = async (item: any) => {
    const productKey = item.productId
    setAddingToCart(prev => ({ ...prev, [productKey]: true }))
    
    try {
      const currentPrice = item.salePrice || item.basePrice
      
      // Add to cart with proper cart item structure
      addToCart({
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        basePrice: currentPrice,
        imageUrl: item.primaryImageUrl,
        quantity: 1
      })

      // Show success feedback
      setAddedToCart(prev => ({ ...prev, [productKey]: true }))
      setTimeout(() => {
        setAddedToCart(prev => ({ ...prev, [productKey]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(prev => ({ ...prev, [productKey]: false }))
    }
  }

  const handleRemoveFromWishlist = async (item: any) => {
    if (!convexUser) return
    
    try {
      await removeFromWishlist({
        userId: convexUser._id,
        productId: item.productId,
      })
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Wishlist</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Please sign in to view your wishlist</h2>
            <p className="text-gray-600 mb-8">Sign in to start saving your favorite items</p>
            <button 
              onClick={() => window.location.href = '/sign-in'}
              className="bg-stellamaris-600 text-white px-8 py-3 rounded-lg hover:bg-stellamaris-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="container mx-auto px-4">
        <nav className="text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-stellamaris-600">Home</Link>
          <span className="mx-2">/</span>
          <span>My Wishlist</span>
        </nav>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">My Wishlist</h1>
        <p className="text-xl text-gray-600 mb-8">Your favorite items, saved for later.</p>
        
        {!wishlistItems || wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Start adding items you love!</p>
            <Link 
              to="/bags" 
              className="bg-stellamaris-600 text-white px-8 py-3 rounded-lg hover:bg-stellamaris-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm overflow-hidden group relative">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => handleRemoveFromWishlist(item)}
                    className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                    aria-label="Remove from wishlist"
                  >
                    <Trash size={16} className="text-gray-700 hover:text-red-500" />
                  </button>
                </div>
                
                <Link to={`/product/${item.productSlug}`} className="block">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={item.primaryImageUrl || 'https://via.placeholder.com/300x400'} 
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link to={`/product/${item.productSlug}`} className="block">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-stellamaris-600 transition-colors">
                      {item.productName}
                    </h3>
                  </Link>
                  
                  {/* Rating placeholder */}
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(4) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-4">
                    {item.salePrice ? (
                      <>
                        <span className="text-xl font-bold text-gray-900">${item.salePrice}</span>
                        <span className="text-lg text-gray-500 line-through">${item.basePrice}</span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">${item.basePrice}</span>
                    )}
                  </div>
                  
                  {/* Add to cart button */}
                  <button 
                    onClick={() => handleAddToCart(item)}
                    disabled={addingToCart[item.productId]}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {addingToCart[item.productId] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : addedToCart[item.productId] ? (
                      <>
                        <Check size={16} />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistPage 