import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Filter, ChevronDown, Leaf, Grid, List, ShoppingCart, Check, FolderOpen, Folder, Heart } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'

interface FilterState {
  categoryId?: Id<"categories">
  minPrice?: number
  maxPrice?: number
  materials?: string[]
  sortBy?: 'name' | 'price_low_high' | 'price_high_low' | 'rating' | 'newest'
}

const ProductsPage = () => {
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'newest'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({})
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({})
  const [wishlistLoading, setWishlistLoading] = useState<{ [key: string]: boolean }>({})
  const { addToCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  // Wishlist mutations
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist)
  
  // Get current user's Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkUserId: user.id } : "skip"
  )

  // Pagination state
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 12,
    cursor: null as string | null
  })

  // Get data from Convex
  const searchResult = useQuery(api.products.searchProducts, {
    ...filters,
    paginationOpts
  })

  const products = searchResult?.page || []
  const isDone = searchResult?.isDone || false

  // Get categories for filtering
  const hierarchicalCategories = useQuery(api.categories.getAllCategoriesHierarchical)

  // Get user's wishlist to check which products are favorited
  const userWishlist = useQuery(
    api.wishlist.getUserWishlist,
    convexUser ? { userId: convexUser._id } : "skip"
  )

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters({ ...filters, ...newFilters })
    // Reset pagination when filters change
    setPaginationOpts({ numItems: 12, cursor: null })
  }

  const handleLoadMore = () => {
    if (searchResult?.continueCursor) {
      setPaginationOpts({
        numItems: 12,
        cursor: searchResult.continueCursor
      })
    }
  }

  const handleAddToCart = async (product: any) => {
    const productKey = product._id
    setAddingToCart(prev => ({ ...prev, [productKey]: true }))
    
    try {
      const currentPrice = product.salePrice || product.basePrice
      
      // Add to cart with proper cart item structure
      addToCart({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        basePrice: currentPrice,
        imageUrl: product.primaryImageUrl,
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

  const handleWishlistToggle = async (product: any) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return
    }

    if (!convexUser) return

    const productKey = product._id
    setWishlistLoading(prev => ({ ...prev, [productKey]: true }))

    try {
      await toggleWishlist({
        userId: convexUser._id,
        productId: product._id,
      })
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productKey]: false }))
    }
  }

  const ProductCard = ({ product, isListView = false }: { product: any, isListView?: boolean }) => {
    const productKey = product._id
    const isAdding = addingToCart[productKey]
    const wasAdded = addedToCart[productKey]
    const isWishlistLoading = wishlistLoading[productKey]
    const isInWishlist = userWishlist?.some(item => item.productId === product._id) || false
    
    return (
      <div className={`product-card group ${isListView ? 'flex gap-6' : ''}`}>
        <div className={`relative overflow-hidden ${isListView ? 'w-64 aspect-[3/4]' : 'aspect-[3/4]'}`}>
          <img
            src={product.primaryImageUrl || 'https://via.placeholder.com/300x400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.salePrice && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
              Sale
            </div>
          )}
          <div className="absolute top-4 right-4 sustainability-badge">
            <Leaf size={12} className="mr-1" />
            {product.sustainabilityScore || 0}/10
          </div>
        </div>
        
        <div className={`p-6 ${isListView ? 'flex-1' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
          
          {/* Rating */}
          <div className="flex items-center space-x-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.totalReviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-2 mb-4">
            {product.salePrice ? (
              <>
                <span className="text-xl font-bold text-gray-900">${product.salePrice}</span>
                <span className="text-lg text-gray-500 line-through">${product.basePrice}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-gray-900">${product.basePrice}</span>
            )}
          </div>

          {isListView && (
            <p className="text-gray-600 mb-4 line-clamp-2">{product.shortDescription}</p>
          )}

          {/* Actions */}
          <div className={`space-y-2 ${isListView ? 'flex space-y-0 space-x-2' : ''}`}>
            <div className={`flex gap-2 ${isListView ? '' : 'w-full'}`}>
              <button 
                onClick={() => handleAddToCart(product)}
                disabled={isAdding}
                className={`btn-primary ${isListView ? 'flex-1' : 'flex-1'} flex items-center justify-center space-x-2 disabled:opacity-50`}
              >
                {isAdding ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : wasAdded ? (
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
              <div className="relative">
                <button 
                  onClick={() => handleWishlistToggle(product)}
                  disabled={isWishlistLoading || !isAuthenticated}
                  className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  {isWishlistLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <Heart 
                      size={18} 
                      className={`transition-colors ${
                        isInWishlist 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-600 hover:text-red-500'
                      }`} 
                    />
                  )}
                  <span className="sr-only">{isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</span>
                </button>
              </div>
            </div>
            <Link 
              to={`/product/${product.slug}`} 
              className={`btn-outline block text-center ${isListView ? 'flex-1' : 'w-full'}`}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-stellamaris-600">Home</Link>
            <span className="mx-2">/</span>
            <span>All Bags</span>
          </nav>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Collection</h1>
          <p className="text-xl text-gray-600">
            Discover luxury handbags crafted with sustainable materials and timeless design
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter size={20} />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_low_high">Price: Low to High</option>
                    <option value="price_high_low">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Categories</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={!filters.categoryId}
                        onChange={() => handleFilterChange({ categoryId: undefined })}
                        className="rounded border-gray-300 text-stellamaris-600 focus:ring-stellamaris-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Categories</span>
                    </label>
                    
                    {hierarchicalCategories?.map((parentCategory) => (
                      <div key={parentCategory._id} className="space-y-1">
                        {/* Parent Category */}
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.categoryId === parentCategory._id}
                            onChange={() => handleFilterChange({ categoryId: parentCategory._id })}
                            className="rounded border-gray-300 text-stellamaris-600 focus:ring-stellamaris-500"
                          />
                          <FolderOpen size={14} className="ml-2 mr-1 text-stellamaris-600" />
                          <span className="text-sm text-gray-700 font-medium">{parentCategory.name}</span>
                        </label>
                        
                        {/* Child Categories */}
                        {parentCategory.children.map((childCategory) => (
                          <label key={childCategory._id} className="flex items-center ml-4">
                            <input
                              type="radio"
                              name="category"
                              checked={filters.categoryId === childCategory._id}
                              onChange={() => handleFilterChange({ categoryId: childCategory._id })}
                              className="rounded border-gray-300 text-stellamaris-600 focus:ring-stellamaris-500"
                            />
                            <Folder size={12} className="ml-2 mr-1 text-gray-500" />
                            <span className="text-sm text-gray-600">{childCategory.name}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>



                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({ sortBy: 'newest' })}
                  className="w-full text-sm text-stellamaris-600 hover:text-stellamaris-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* View Controls */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {products.length} products
                {!isDone && ' (load more to see all)'}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-stellamaris-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-stellamaris-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No products found matching your criteria.</p>
                <button
                  onClick={() => setFilters({ sortBy: 'newest' })}
                  className="mt-4 btn-outline"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}`}>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} isListView={viewMode === 'list'} />
                ))}
              </div>
            )}

            {/* Load More */}
            {!isDone && products.length > 0 && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="btn-outline"
                >
                  Load More Products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductsPage 