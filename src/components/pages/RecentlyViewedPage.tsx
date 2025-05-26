import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Star, ShoppingCart, Heart, Check, ArrowLeft, Trash2, Grid, List } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const RecentlyViewedPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({});
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({});
  const [wishlistLoading, setWishlistLoading] = useState<{ [key: string]: boolean }>({});
  
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Get current user's Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkUserId: user.id } : "skip"
  );

  // Wishlist mutations
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);

  // Get all recently viewed products
  const recentlyViewedProducts = useQuery(
    api.products.getRecentlyViewedProducts,
    convexUser ? { 
      userId: convexUser._id, 
      limit: 50 // Get all recent products
    } : user ? {
      sessionId: `guest_${user.id}`,
      limit: 50
    } : "skip"
  );

  // Get user's wishlist to check which products are favorited
  const userWishlist = useQuery(
    api.wishlist.getUserWishlist,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const handleAddToCart = async (product: any) => {
    const productKey = product._id;
    setAddingToCart(prev => ({ ...prev, [productKey]: true }));
    
    try {
      const currentPrice = product.salePrice || product.basePrice;
      
      addToCart({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        basePrice: currentPrice,
        imageUrl: product.primaryImageUrl || '',
        quantity: 1
      });

      setAddedToCart(prev => ({ ...prev, [productKey]: true }));
      setTimeout(() => {
        setAddedToCart(prev => ({ ...prev, [productKey]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productKey]: false }));
    }
  };

  const handleWishlistToggle = async (product: any) => {
    if (!isAuthenticated || !convexUser) return;

    const productKey = product._id;
    setWishlistLoading(prev => ({ ...prev, [productKey]: true }));

    try {
      await toggleWishlist({
        userId: convexUser._id,
        productId: product._id,
      });
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productKey]: false }));
    }
  };

  const ProductCard = ({ product, isListView = false }: { product: any, isListView?: boolean }) => {
    const productKey = product._id;
    const isAdding = addingToCart[productKey];
    const wasAdded = addedToCart[productKey];
    const isWishlistLoading = wishlistLoading[productKey];
    const isInWishlist = userWishlist?.some(item => item.productId === product._id) || false;
    
    if (isListView) {
      return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex">
          <div className="w-48 aspect-[3/4] flex-shrink-0 overflow-hidden">
            <img
              src={product.primaryImageUrl || 'https://via.placeholder.com/300x400'}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1">
              <Link 
                to={`/product/${product.slug}`}
                className="text-lg font-semibold text-gray-900 hover:text-stellamaris-600 transition-colors line-clamp-2 mb-2"
              >
                {product.name}
              </Link>
              
              <p className="text-sm text-gray-600 mb-3">
                Viewed on {new Date(product.viewedAt).toLocaleDateString()}
              </p>

              {/* Rating */}
              {product.averageRating && product.totalReviews > 0 && (
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
              )}

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
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleAddToCart(product)}
                disabled={isAdding}
                className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
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
              </button>
              <Link 
                to={`/product/${product.slug}`} 
                className="btn-outline px-4 py-2 text-center"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 group">
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={product.primaryImageUrl || 'https://via.placeholder.com/300x400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => handleWishlistToggle(product)}
              disabled={isWishlistLoading || !isAuthenticated}
              className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {isWishlistLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Heart 
                  size={16} 
                  className={`transition-colors ${
                    isInWishlist 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-600 hover:text-red-500'
                  }`} 
                />
              )}
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <Link 
            to={`/product/${product.slug}`}
            className="text-lg font-semibold text-gray-900 hover:text-stellamaris-600 transition-colors line-clamp-2 mb-2"
          >
            {product.name}
          </Link>
          
          <p className="text-sm text-gray-600 mb-3">
            Viewed on {new Date(product.viewedAt).toLocaleDateString()}
          </p>
          
          {/* Rating */}
          {product.averageRating && product.totalReviews > 0 && (
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
          )}

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
              onClick={() => handleAddToCart(product)}
              disabled={isAdding}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
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
            <Link 
              to={`/product/${product.slug}`} 
              className="btn-outline block text-center w-full"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-600 hover:text-stellamaris-600 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Shopping
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recently Viewed</h1>
              <p className="text-gray-600 mt-2">
                {recentlyViewedProducts?.length || 0} products you've recently viewed
              </p>
            </div>
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Products */}
        {!recentlyViewedProducts || recentlyViewedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={32} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Recently Viewed Products</h2>
              <p className="text-gray-600 mb-8">
                Start browsing our collection to see your recently viewed products here.
              </p>
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-6'
          }`}>
            {recentlyViewedProducts.map((product) => (
              <ProductCard 
                key={product._id} 
                product={product} 
                isListView={viewMode === 'list'} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyViewedPage; 