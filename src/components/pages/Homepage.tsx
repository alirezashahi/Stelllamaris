import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Heart, Leaf, Shield, Truck, ShoppingCart, Check } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCart } from '../../contexts/CartContext'

const Homepage = () => {
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({})
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({})
  const { addToCart } = useCart()
  
  // Get real data from Convex
  const featuredProducts = useQuery(api.products.getFeaturedProducts) || []
  const newArrivals = useQuery(api.products.getNewArrivals) || []

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement newsletter signup
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-sage-50 to-sage-100 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Elevate Your Style
                  <span className="block stellamaris-text-gradient">
                    Sustain Our Planet
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Discover our curated collection of luxury handbags, crafted with the finest sustainable materials. 
                  With every purchase, you're not just choosing quality – you're choosing to make a difference.
                </p>
              </div>

              {/* Impact Stats */}
              <div className="charity-impact-card p-6 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Heart className="text-stellamaris-600" size={20} />
                  <span className="font-semibold text-sage-800">Our Impact Together</span>
                </div>
                <p className="text-sage-700 text-sm">
                  <strong>5% of every purchase</strong> goes directly to animal shelters and charities. 
                  This year alone, we've donated <strong>$25,000+</strong> to causes that matter.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/bags"
                  className="btn-primary inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
                >
                  <span>Shop Now</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/our-impact"
                  className="btn-outline inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
                >
                  <span>Our Impact</span>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80"
                  alt="Stellamaris luxury handbag collection"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating sustainability badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">100% Sustainable</p>
                    <p className="text-gray-600 text-sm">Ethically sourced materials</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A timeless design for the modern woman who values quality and sustainability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div key={product._id} className="product-card group">
                <div className="relative aspect-[3/4] overflow-hidden">
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
                
                <div className="p-6">
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

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      className="w-full btn-primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart[product._id] || addedToCart[product._id]}
                    >
                      {addingToCart[product._id] ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-4 border-b-4 border-stellamaris-600"></div>
                        </div>
                      ) : (
                        'Add to Bag'
                      )}
                    </button>
                    <Link to={`/product/${product.slug}`} className="w-full btn-outline block text-center">
                      Quick View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/bags" className="btn-outline inline-flex items-center space-x-2">
              <span>View All Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">New Arrivals</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fresh designs that blend contemporary style with timeless elegance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newArrivals.map((product) => (
              <div key={product._id} className="product-card group">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={product.primaryImageUrl || 'https://via.placeholder.com/300x400'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-stellamaris-600 text-white px-2 py-1 rounded text-sm font-medium">
                    New
                  </div>
                  <div className="absolute top-4 right-4 sustainability-badge">
                    <Leaf size={12} className="mr-1" />
                    {product.sustainabilityScore || 0}/10
                  </div>
                </div>
                
                <div className="p-6">
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

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      className="w-full btn-primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart[product._id] || addedToCart[product._id]}
                    >
                      {addingToCart[product._id] ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-4 border-b-4 border-stellamaris-600"></div>
                        </div>
                      ) : (
                        'Add to Bag'
                      )}
                    </button>
                    <Link to={`/product/${product.slug}`} className="w-full btn-outline block text-center">
                      Quick View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Stellamaris?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to luxury without compromise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-stellamaris-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="text-stellamaris-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sustainable Materials</h3>
              <p className="text-gray-600">
                Every bag is crafted from ethically sourced, sustainable materials that minimize environmental impact.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-stellamaris-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-stellamaris-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Charity Partnership</h3>
              <p className="text-gray-600">
                5% of every purchase goes to animal shelters and environmental causes. Your style makes an impact.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-stellamaris-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-stellamaris-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Guarantee</h3>
              <p className="text-gray-600">
                Handcrafted with attention to detail and backed by our lifetime craftsmanship guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-stellamaris-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Stay Connected</h2>
            <p className="text-xl text-stellamaris-200 mb-8">
              Join our community and be the first to know about new arrivals, sustainability initiatives, and our charity impact.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="btn-primary bg-stellamaris-600 hover:bg-stellamaris-700 px-8 py-3"
              >
                Subscribe
              </button>
            </form>
            
            <p className="text-sm text-stellamaris-300 mt-4">
              By subscribing, you'll also receive updates on how your purchases are helping animal shelters and environmental causes.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Homepage 