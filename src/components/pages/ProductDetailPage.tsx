import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Heart, Plus, Minus, Shield, Truck, ArrowLeft, Share2, Leaf, ShoppingCart, Check } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCart } from '../../contexts/CartContext'
import ReviewSection from '../reviews/ReviewSection'

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addToCart } = useCart()

  // Get product data
  const product = useQuery(api.products.getProductBySlug, slug ? { slug } : "skip")
  const relatedProducts = useQuery(
    api.products.getRelatedProducts, 
    product ? { productId: product._id, limit: 4 } : "skip"
  )

  // TODO: Replace with actual user ID from Clerk authentication
  const currentUserId = null // This will be the actual user ID from Clerk
  
  // Wishlist functionality (only works when user is authenticated)
  const isInWishlist = useQuery(
    api.wishlist.isProductInWishlist,
    currentUserId && product ? { userId: currentUserId, productId: product._id } : "skip"
  )
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist)

  if (product === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (product === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link to="/bags" className="btn-primary">Browse All Products</Link>
        </div>
      </div>
    )
  }

  const currentPrice = product.salePrice || product.basePrice
  const originalPrice = product.salePrice ? product.basePrice : null
  const onSale = !!product.salePrice

  const handleAddToCart = async () => {
    setAddingToCart(true)
    
    try {
      // Get selected variant details if any
      const selectedVariantData = selectedVariant 
        ? product.variants.find(v => v._id === selectedVariant)
        : undefined

      // Add to cart with proper cart item structure
      addToCart({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        variant: selectedVariantData ? {
          id: selectedVariantData._id,
          name: selectedVariantData.name,
          priceAdjustment: selectedVariantData.priceAdjustment
        } : undefined,
        basePrice: currentPrice,
        imageUrl: product.images.find(img => img.isPrimary)?.imageUrl || product.images[0]?.imageUrl,
        quantity
      })

      // Show success feedback
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!currentUserId) {
      // TODO: Show sign-in modal when Clerk is integrated
      alert('Please sign in to add items to your wishlist')
      return
    }

    try {
      await toggleWishlist({
        userId: currentUserId,
        productId: product._id,
      })
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    }
  }

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change))
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'care', label: 'Care Instructions' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
            
            {product.sustainableFeatures && product.sustainableFeatures.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Sustainable Features</h4>
                <ul className="space-y-2">
                  {product.sustainableFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Leaf size={16} className="text-green-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      
      case 'specifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Specifications</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-gray-900">Material</dt>
                <dd className="text-gray-700">{product.material}</dd>
              </div>
              {product.dimensions && (
                <div>
                  <dt className="font-medium text-gray-900">Dimensions</dt>
                  <dd className="text-gray-700">{product.dimensions}</dd>
                </div>
              )}
              {product.weight && (
                <div>
                  <dt className="font-medium text-gray-900">Weight</dt>
                  <dd className="text-gray-700">{product.weight} oz</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-900">SKU</dt>
                <dd className="text-gray-700">{product.sku}</dd>
              </div>
              {product.sustainabilityScore && (
                <div>
                  <dt className="font-medium text-gray-900">Sustainability Score</dt>
                  <dd className="text-gray-700">{product.sustainabilityScore}/10</dd>
                </div>
              )}
            </dl>
          </div>
        )
      
      case 'care':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Care Instructions</h3>
            {product.careInstructions ? (
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.careInstructions}
              </div>
            ) : (
              <div className="text-gray-600">
                <p>• Store in a cool, dry place</p>
                <p>• Clean with a soft, damp cloth</p>
                <p>• Avoid exposure to direct sunlight for extended periods</p>
                <p>• Use appropriate leather care products if applicable</p>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-stellamaris-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/bags" className="hover:text-stellamaris-600">All Bags</Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
              <img
                src={product.images[selectedImageIndex]?.imageUrl || 'https://via.placeholder.com/600x600'}
                alt={product.images[selectedImageIndex]?.altText || product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image._id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-stellamaris-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Share2 size={20} />
                </button>
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.averageRating?.toFixed(1) || 'No rating'} ({product.totalReviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">${currentPrice}</span>
                {originalPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">${originalPrice}</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                      Save ${originalPrice - currentPrice}
                    </span>
                  </>
                )}
              </div>

              {/* Sustainability Score */}
              {product.sustainabilityScore && (
                <div className="sustainability-badge inline-flex items-center mb-4">
                  <Leaf size={16} className="mr-2" />
                  <span>Sustainability Score: {product.sustainabilityScore}/10</span>
                </div>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-lg text-gray-600">{product.shortDescription}</p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Options</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => setSelectedVariant(variant._id)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedVariant === variant._id
                          ? 'border-stellamaris-600 bg-stellamaris-50 text-stellamaris-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {variant.name}
                      {variant.priceAdjustment !== 0 && (
                        <span className="block text-xs text-gray-500">
                          {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-900">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 btn-primary py-4 text-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {addingToCart ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : addedToCart ? (
                    <>
                      <Check size={20} />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span>Add to Cart - ${(currentPrice * quantity).toFixed(0)}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isInWishlist
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                  title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={20} className={isInWishlist ? 'fill-current' : ''} />
                </button>
              </div>
            </div>

            {/* Product Features */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield size={16} className="text-stellamaris-600" />
                <span>Quality guarantee & 30-day returns</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Truck size={16} className="text-stellamaris-600" />
                <span>Free shipping on orders over $500</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Heart size={16} className="text-stellamaris-600" />
                <span>5% of profits donated to charity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-stellamaris-600 text-stellamaris-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {renderTabContent()}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
          <ReviewSection productId={product._id} productName={product.name} />
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/product/${relatedProduct.slug}`}
                  className="product-card group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={relatedProduct.primaryImageUrl || 'https://via.placeholder.com/300x400'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {relatedProduct.sustainabilityScore && (
                      <div className="absolute top-4 right-4 sustainability-badge">
                        <Leaf size={12} className="mr-1" />
                        {relatedProduct.sustainabilityScore}/10
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{relatedProduct.name}</h3>
                    <div className="flex items-center space-x-2">
                      {relatedProduct.salePrice ? (
                        <>
                          <span className="font-bold text-gray-900">${relatedProduct.salePrice}</span>
                          <span className="text-gray-500 line-through">${relatedProduct.basePrice}</span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-900">${relatedProduct.basePrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage 