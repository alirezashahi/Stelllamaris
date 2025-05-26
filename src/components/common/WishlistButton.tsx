import React, { useState } from 'react'
import { Heart } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useAuth } from '../../contexts/AuthContext'

interface WishlistButtonProps {
  productId: Id<"products">
  className?: string
  size?: number
  showTooltip?: boolean
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ 
  productId, 
  className = "", 
  size = 18, 
  showTooltip = true 
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated, signIn } = useAuth()
  
  // Get current user's Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkUserId: user.id } : "skip"
  )

  // Get user's wishlist to check if this product is favorited
  const userWishlist = useQuery(
    api.wishlist.getUserWishlist,
    convexUser ? { userId: convexUser._id } : "skip"
  )

  const toggleWishlist = useMutation(api.wishlist.toggleWishlist)

  const isInWishlist = userWishlist?.some(item => item.productId === productId) || false

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      signIn()
      return
    }

    if (!convexUser) return

    setIsLoading(true)

    try {
      await toggleWishlist({
        userId: convexUser._id,
        productId: productId,
      })
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group relative disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
      ) : (
        <Heart 
          size={size} 
          className={`transition-colors ${
            isInWishlist 
              ? 'text-red-500 fill-current' 
              : 'text-gray-600 group-hover:text-red-500'
          }`} 
        />
      )}
      <span className="sr-only">{isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</span>
      {showTooltip && (
        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 pointer-events-none z-10">
          {!isAuthenticated ? "Sign in to add to wishlist" : isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        </span>
      )}
    </button>
  )
}

export default WishlistButton 