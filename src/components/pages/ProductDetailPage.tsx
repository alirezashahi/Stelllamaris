import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, Image, Palette, Check, Share2, Copy, MessageCircle } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';
import ReviewSection from '../reviews/ReviewSection';
import ReturnPolicy from '../policies/ReturnPolicy';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Id<"productVariants">>>({});
  const [imageMode, setImageMode] = useState<'general' | 'variant'>('general');
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [linkCopied, setLinkCopied] = useState(false);
  const prevSelectedColorVariantRef = useRef<Id<"productVariants"> | undefined>();
  
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Get current user's Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkUserId: user.id } : "skip"
  );

  // Wishlist mutations
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  
  // Track recently viewed mutation
  const trackRecentlyViewed = useMutation(api.products.trackRecentlyViewedProduct);

  // Get product by slug
  const products = useQuery(api.products.getAllProducts);
  const product = products?.find(p => p.slug === slug);
  
  // Get product variants and images
  const productVariants = useQuery(
    api.products.getProductVariants,
    product ? { productId: product._id } : "skip"
  );
  
  // Get general product images
  const productImages = useQuery(
    api.products.getProductImages,
    product ? { productId: product._id } : "skip"
  );

  // Get images for selected variant (if any color variant is selected)
  const selectedColorVariant = selectedVariants['color'];
  const variantImages = useQuery(
    api.products.getVariantImages,
    selectedColorVariant && product ? { 
      productId: product._id, 
      variantId: selectedColorVariant 
    } : "skip"
  );

  // Get user's wishlist to check if this product is favorited
  const userWishlist = useQuery(
    api.wishlist.getUserWishlist,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  // Get recently viewed products
  const recentlyViewedProducts = useQuery(
    api.products.getRecentlyViewedProducts,
    convexUser ? { 
      userId: convexUser._id, 
      limit: 8, // Show more products in horizontal scroll
      excludeProductId: product?._id 
    } : user ? {
      sessionId: `guest_${user.id}`, // Use Clerk user ID as session for guests
      limit: 8,
      excludeProductId: product?._id 
    } : "skip"
  );

  // Group variants by type
  const variantsByType = productVariants?.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, typeof productVariants>) || {};

  // Check if product is in wishlist
  const isInWishlist = userWishlist?.some(item => item.productId === product?._id) || false;

  // Determine which images to display based on mode and availability
  const displayImages = (() => {
    if (imageMode === 'variant') {
      return (selectedColorVariant && variantImages?.length) ? variantImages : [];
    } else {
      return productImages?.length ? productImages : [];
    }
  })();

  // Auto-switch to variant mode when a new color variant with images is selected
  useEffect(() => {
    if (selectedColorVariant && selectedColorVariant !== prevSelectedColorVariantRef.current) {
      setImageMode('variant');
      setSelectedImageIndex(0);
    }
    prevSelectedColorVariantRef.current = selectedColorVariant;
  }, [selectedColorVariant]);

  // Reset image index when images change
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [displayImages]);

  // Reset image mode when no color variant is selected
  useEffect(() => {
    if (!selectedColorVariant) {
      setImageMode('general');
      setSelectedImageIndex(0);
    }
  }, [selectedColorVariant]);

  // Track product view
  useEffect(() => {
    if (product && (convexUser || user)) {
      const trackView = async () => {
        try {
          await trackRecentlyViewed({
            userId: convexUser?._id,
            productId: product._id,
            sessionId: !convexUser && user ? `guest_${user.id}` : undefined,
          });
        } catch (error) {
          console.error('Failed to track product view:', error);
        }
      };

      // Delay tracking to avoid rapid fire on page loads
      const timeoutId = setTimeout(trackView, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [product, convexUser, user, trackRecentlyViewed]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="text-gray-600 mt-2">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const discountPercentage = product.salePrice 
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  // Calculate final price based on selected variants
  let finalPrice = product.salePrice || product.basePrice;
  Object.values(selectedVariants).forEach(variantId => {
    const variant = productVariants?.find(v => v._id === variantId);
    if (variant) {
      finalPrice += variant.priceAdjustment;
    }
  });

  const selectedImage = displayImages?.[selectedImageIndex];

  const handlePreviousImage = () => {
    if (displayImages && displayImages.length > 0) {
      setSelectedImageIndex(prev => 
        prev === 0 ? displayImages.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (displayImages && displayImages.length > 0) {
      setSelectedImageIndex(prev => 
        prev === displayImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleVariantSelect = (type: string, variantId: Id<"productVariants">) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: variantId
    }));
  };

  const getSelectedVariantStock = () => {
    if (Object.keys(selectedVariants).length === 0) {
      return product.totalStock;
    }
    
    let minStock = product.totalStock;
    Object.values(selectedVariants).forEach(variantId => {
      const variant = productVariants?.find(v => v._id === variantId);
      if (variant && variant.stockQuantity < minStock) {
        minStock = variant.stockQuantity;
      }
    });
    
    return minStock;
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    
    try {
      const currentPrice = product.salePrice || product.basePrice;
      
      addToCart({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        basePrice: currentPrice,
        imageUrl: selectedImage?.imageUrl || '',
        quantity: quantity
      });

      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated || !convexUser) return;

    setWishlistLoading(true);
    try {
      await toggleWishlist({
        userId: convexUser._id,
        productId: product._id,
      });
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const availableStock = getSelectedVariantStock();

  // Get color variant options with enhanced display
  const colorVariants = variantsByType['color'] || [];
  const sizeVariants = variantsByType['size'] || [];

  // Social sharing functions
  const currentUrl = window.location.href;
  const shareText = `Check out ${product.name} - ${product.shortDescription || product.description.substring(0, 100)}...`;
  
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleXShare = () => {
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(xUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm text-gray-600">
            <Link to="/" className="hover:text-stellamaris-600">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/bags" className="hover:text-stellamaris-600">Bags</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
              {selectedImage ? (
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Image Available</span>
                </div>
              )}

              {/* Navigation Arrows */}
              {displayImages && displayImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {displayImages && displayImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded">
                  {selectedImageIndex + 1} / {displayImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {displayImages && displayImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {displayImages.map((image, index) => (
                  <button
                    key={image._id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-stellamaris-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || `${product.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              
              {/* Price */}
              <div className="flex items-center space-x-3 mt-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${finalPrice.toFixed(2)}
                </span>
                {product.salePrice && finalPrice !== product.basePrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ${product.basePrice.toFixed(2)}
                    </span>
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                      Save {discountPercentage}%
                    </span>
                  </>
                )}
              </div>

              {/* Reviews */}
              {product.totalReviews > 0 && (
                <div className="flex items-center mt-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {product.averageRating?.toFixed(1)} ({product.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Options Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Options</h3>
              
              {/* Color Selection */}
              {colorVariants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {/* Default/General Images Button */}
                    <button
                      onClick={() => {
                        setSelectedVariants(prev => {
                          const newVariants = { ...prev };
                          delete newVariants['color'];
                          return newVariants;
                        });
                        setImageMode('general');
                        setSelectedImageIndex(0);
                      }}
                      className={`relative px-4 py-2 border rounded-lg text-sm font-medium transition-all min-w-[80px] ${
                        !selectedVariants['color']
                          ? 'border-stellamaris-500 bg-stellamaris-50 text-stellamaris-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                      }`}
                    >
                      Default
                      <span className="block text-xs text-gray-500">General Photos</span>
                    </button>
                    
                    {colorVariants.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleVariantSelect('color', variant._id)}
                        className={`relative px-4 py-2 border rounded-lg text-sm font-medium transition-all min-w-[80px] ${
                          selectedVariants['color'] === variant._id
                            ? 'border-stellamaris-500 bg-stellamaris-50 text-stellamaris-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                        } ${
                          variant.stockQuantity === 0 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                        disabled={variant.stockQuantity === 0}
                      >
                        {variant.name}
                        {variant.priceAdjustment !== 0 && (
                          <span className="block text-xs text-gray-500">
                            {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {sizeVariants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizeVariants.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleVariantSelect('size', variant._id)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                          selectedVariants['size'] === variant._id
                            ? 'border-stellamaris-500 bg-stellamaris-50 text-stellamaris-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        } ${
                          variant.stockQuantity === 0 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                        disabled={variant.stockQuantity === 0}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-gray-200">
              <div>
                <span className="block text-sm font-medium text-gray-900 mb-1">Material</span>
                <p className="text-sm text-gray-600">{product.material}</p>
              </div>
              
              {product.sustainabilityScore && (
                <div>
                  <span className="block text-sm font-medium text-gray-900 mb-1">Sustainability</span>
                  <p className="text-sm text-green-600 font-medium">Tier {product.sustainabilityScore}</p>
                </div>
              )}

              <div>
                <span className="block text-sm font-medium text-gray-900 mb-1">Stock</span>
                <p className={`text-sm font-medium ${availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {availableStock > 0 ? 'In available' : 'Out of stock'}
                </p>
              </div>

              {product.dimensions && (
                <div>
                  <span className="block text-sm font-medium text-gray-900 mb-1">Dimensions</span>
                  <p className="text-sm text-gray-600">{product.dimensions}</p>
                </div>
              )}
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0 || addingToCart}
                  className="flex-1 bg-stellamaris-600 text-white py-3 px-6 rounded-lg hover:bg-stellamaris-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {addingToCart ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : addedToCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      <span>{availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading || !isAuthenticated}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wishlistLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  ) : (
                    <Heart 
                      className={`h-5 w-5 transition-colors ${
                        isInWishlist 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-600 hover:text-red-500'
                      }`} 
                    />
                  )}
                </button>
              </div>

              {availableStock < 10 && availableStock > 0 && (
                <p className="text-sm text-orange-600">
                  Only {availableStock} left in stock!
                </p>
              )}
            </div>

            {/* Sustainability Features */}
            {product.sustainableFeatures && product.sustainableFeatures.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sustainability Features</h3>
                <ul className="space-y-2">
                  {product.sustainableFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Care Instructions */}
            {product.careInstructions && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Care Instructions</h3>
                <p className="text-sm text-gray-600">{product.careInstructions}</p>
              </div>
            )}

            {/* Return Policy */}
            <ReturnPolicy compact={true} showTitle={false} />

            {/* Share this product */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this product</h3>
              <div className="flex items-center space-x-3">
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                  aria-label="Share on WhatsApp"
                >
                  <MessageCircle size={18} />
                </button>

                {/* Telegram */}
                <button
                  onClick={handleTelegramShare}
                  className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                  aria-label="Share on Telegram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.54-.44.67-.89.42l-2.46-1.81-1.19 1.14c-.13.13-.24.24-.49.24l.17-2.43 4.47-4.03c.19-.17-.04-.27-.3-.1l-5.52 3.47-2.38-.74c-.52-.16-.53-.52.11-.77l9.3-3.58c.43-.16.81.1.67.76z"/>
                  </svg>
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={handleXShare}
                  className="flex items-center justify-center w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full transition-colors"
                  aria-label="Share on X"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center w-10 h-10 transition-colors rounded-full ${
                    linkCopied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  aria-label="Copy link"
                >
                  {linkCopied ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              {linkCopied && (
                <p className="text-sm text-green-600 mt-2 font-medium">Link copied to clipboard!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recently Viewed Section */}
        {recentlyViewedProducts && recentlyViewedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <Link 
                to="/recently-viewed" 
                className="text-2xl font-bold text-gray-900 hover:text-stellamaris-600 transition-colors cursor-pointer"
              >
                Recently Viewed
              </Link>
              <Link 
                to="/recently-viewed" 
                className="text-sm text-stellamaris-600 hover:text-stellamaris-700 font-medium"
              >
                View All ({recentlyViewedProducts.length})
              </Link>
            </div>
            
            {/* Horizontal Scrollable Container */}
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {recentlyViewedProducts.map((recentProduct) => (
                  <Link
                    key={recentProduct._id}
                    to={`/product/${recentProduct.slug}`}
                    className="group flex-shrink-0 w-64"
                  >
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src={recentProduct.primaryImageUrl || 'https://via.placeholder.com/300x400'}
                          alt={recentProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-stellamaris-600 transition-colors line-clamp-2">
                          {recentProduct.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">Recently viewed</p>
                        <div className="flex items-center space-x-2">
                          {recentProduct.salePrice ? (
                            <>
                              <span className="font-bold text-gray-900">${recentProduct.salePrice}</span>
                              <span className="text-sm text-gray-500 line-through">${recentProduct.basePrice}</span>
                            </>
                          ) : (
                            <span className="font-bold text-gray-900">${recentProduct.basePrice}</span>
                          )}
                        </div>
                        {recentProduct.averageRating && recentProduct.totalReviews > 0 && (
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(recentProduct.averageRating || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600 ml-1">
                              ({recentProduct.totalReviews})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Scroll indicator */}
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="mt-16">
          <ReviewSection 
            productId={product._id} 
            productName={product.name} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;