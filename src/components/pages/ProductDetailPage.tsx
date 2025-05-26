import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, Image, Palette } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';
import ReviewSection from '../reviews/ReviewSection';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Id<"productVariants">>>({});
  const [imageMode, setImageMode] = useState<'general' | 'variant'>('general');
  const prevSelectedColorVariantRef = useRef<Id<"productVariants"> | undefined>();

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

  // Group variants by type
  const variantsByType = productVariants?.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, typeof productVariants>) || {};

  // Determine which images to display based on mode and availability
  const displayImages = (() => {
    if (imageMode === 'variant') {
      // If in variant mode, attempt to show variantImages.
      // These are fetched based on selectedColorVariant.
      // If they are not available (null, undefined, or empty array), show empty.
      return (selectedColorVariant && variantImages?.length) ? variantImages : [];
    } else { // imageMode === 'general'
      // If in general mode, attempt to show productImages.
      // If not available, show empty.
      return productImages?.length ? productImages : [];
    }
  })();

  // Auto-switch to variant mode when a new color variant with images is selected
  useEffect(() => {
    if (selectedColorVariant && selectedColorVariant !== prevSelectedColorVariantRef.current) {
      // A new color variant has been selected.
      // Switch to 'variant' mode. displayImages will handle showing images if they exist.
      setImageMode('variant');
      setSelectedImageIndex(0); // Reset index for the new set of images
    }
    // Update the ref *after* processing to correctly detect a change next time.
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
      setSelectedImageIndex(0); // Reset index when clearing color variant
    }
  }, [selectedColorVariant]);

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
    
    // If variants are selected, find the minimum stock among selected variants
    let minStock = product.totalStock;
    Object.values(selectedVariants).forEach(variantId => {
      const variant = productVariants?.find(v => v._id === variantId);
      if (variant && variant.stockQuantity < minStock) {
        minStock = variant.stockQuantity;
      }
    });
    
    return minStock;
  };

  const availableStock = getSelectedVariantStock();

      return (    <div className="container mx-auto px-4 py-8">      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">        {/* Image Gallery */}        <div className="space-y-4">          {/* Main Image */}          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
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

                                    {/* Image Mode Indicator */}            {displayImages && displayImages.length > 0 && (              <div className="absolute top-4 left-4 bg-stellamaris-600 text-white text-xs px-2 py-1 rounded">                {imageMode === 'variant' && selectedColorVariant                  ? `${productVariants?.find(v => v._id === selectedColorVariant)?.name} Images`                  : 'General Images'                }              </div>            )}
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
                  aria-label={`View image ${index + 1} of ${product.name}${image.altText ? ': ' + image.altText : ''}`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Image Mode Switch Buttons */}
          {((imageMode === 'variant' && productImages?.length > 0 && selectedColorVariant) ||
            (imageMode === 'general' && selectedColorVariant && variantImages?.length > 0 && productImages?.length > 0)
          ) && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {imageMode === 'variant' && productImages && productImages.length > 0 && selectedColorVariant && (
                <button
                  onClick={() => { setImageMode('general'); setSelectedImageIndex(0); }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label={`View general product photos. Currently showing ${productVariants?.find(v => v._id === selectedColorVariant)?.name} photos.`}
                >
                  <Image className="h-4 w-4" />
                  <span>View General Photos ({productImages.length})</span>
                </button>
              )}
              {imageMode === 'general' && selectedColorVariant && variantImages && variantImages.length > 0 && productImages && productImages.length > 0 && (
                <button
                  onClick={() => { setImageMode('variant'); setSelectedImageIndex(0); }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label={`View photos for ${productVariants?.find(v => v._id === selectedColorVariant)?.name}. Currently showing general photos.`}
                >
                  <Palette className="h-4 w-4" />
                  <span>View {productVariants?.find(v => v._id === selectedColorVariant)?.name} Photos ({variantImages.length})</span>
                </button>
              )}
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
                      aria-hidden="true" // Decorative stars
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  ({product.totalReviews} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Product Variants */}
          {Object.keys(variantsByType).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Options</h3>
              
              {Object.entries(variantsByType).map(([type, variants]) => (
                <div key={type}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {type}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleVariantSelect(type, variant._id)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                          selectedVariants[type] === variant._id
                            ? 'border-stellamaris-500 bg-stellamaris-50 text-stellamaris-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        } ${
                          variant.stockQuantity === 0 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                        disabled={variant.stockQuantity === 0}
                        aria-pressed={selectedVariants[type] === variant._id}
                        aria-label={`Select ${type}: ${variant.name}${variant.priceAdjustment !== 0 ? ` (${variant.priceAdjustment > 0 ? '+' : ''}$${variant.priceAdjustment.toFixed(2)})` : ''}${variant.stockQuantity === 0 ? ' (Out of stock)' : ''}`}
                      >
                        {variant.name}
                        {variant.priceAdjustment !== 0 && (
                          <span className="ml-1 text-xs">
                            ({variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)})
                          </span>
                        )}
                        {variant.stockQuantity === 0 && (
                          <span className="ml-1 text-xs">(Out of stock)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-900">Material:</span>
              <p className="text-sm text-gray-600">{product.material}</p>
            </div>
            
            {product.sustainabilityScore && (
              <div>
                <span className="text-sm font-medium text-gray-900">Sustainability:</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-green-500" aria-hidden="true" />
                  <span className="text-sm text-green-600 font-medium">
                    {product.sustainabilityScore}/10
                  </span>
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-900">Stock:</span>
              <p className="text-sm text-gray-600">
                {availableStock > 0 ? `${availableStock} available` : 'Out of stock'}
              </p>
            </div>

            {product.dimensions && (
              <div>
                <span className="text-sm font-medium text-gray-900">Dimensions:</span>
                <p className="text-sm text-gray-600">{product.dimensions}</p>
              </div>
            )}
          </div>

          {/* Add to Cart Section */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                disabled={availableStock === 0}
                className="flex-1 bg-stellamaris-600 text-white py-3 px-6 rounded-lg hover:bg-stellamaris-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                aria-label={availableStock === 0 ? 'Product is out of stock' : 'Add to cart'}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>
                  {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </span>
              </button>
              
              <button 
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {availableStock < 10 && availableStock > 0 && (
              <p className="text-sm text-orange-600">
                Only {availableStock} left in stock!
              </p>
            )}

            {/* Selected Variants Summary */}
            {Object.keys(selectedVariants).length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Selected Options:</h5>
                <div className="space-y-1">
                  {Object.entries(selectedVariants).map(([type, variantId]) => {
                    const variant = productVariants?.find(v => v._id === variantId);
                    return variant ? (
                      <div key={type} className="text-sm text-gray-600">
                        <span className="capitalize font-medium">{type}:</span> {variant.name}
                        {variant.priceAdjustment !== 0 && (
                          <span className="ml-1">
                            ({variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)})
                          </span>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sustainability Features */}
          {product.sustainableFeatures && product.sustainableFeatures.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sustainability Features</h3>
              <ul className="space-y-2">
                {product.sustainableFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-green-500" aria-hidden="true"/>
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
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-16">
        <ReviewSection 
          productId={product._id} 
          productName={product.name} 
        />
      </div>
    </div>
  );
};

export default ProductDetailPage;