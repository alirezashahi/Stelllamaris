import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Package } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  sustainabilityScore?: number;
  material: string;
  status: string;
  totalStock: number;
  averageRating?: number;
  totalReviews: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  categoryId: Id<"categories">;
}

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const productImages = useQuery(api.products.getProductImages, { productId: product._id });
  
  const discountPercentage = product.salePrice 
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  const price = product.salePrice || product.basePrice;
  
  // Get primary image or first image
  const primaryImage = productImages?.find(img => img.isPrimary) || productImages?.[0];

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {/* Image */}
          <div className="w-48 h-48 flex-shrink-0">
            <Link to={`/products/${product.slug}`}>
              {primaryImage ? (
                <img
                  src={primaryImage.imageUrl}
                  alt={primaryImage.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-stellamaris-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 mt-2 line-clamp-2">
                  {product.shortDescription || product.description}
                </p>

                <div className="flex items-center mt-3 space-x-4">
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${price.toFixed(2)}
                    </span>
                    {product.salePrice && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          ${product.basePrice.toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                          -{discountPercentage}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Sustainability Score */}
                  {product.sustainabilityScore && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">
                        {product.sustainabilityScore}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Material */}
                <p className="text-sm text-gray-500 mt-2">
                  Material: {product.material}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="bg-stellamaris-600 text-white p-2 rounded-lg hover:bg-stellamaris-700 transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <Link to={`/products/${product.slug}`}>
          {primaryImage ? (
            <img
              src={primaryImage.imageUrl}
              alt={primaryImage.altText || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 space-y-1">
          {product.isNewArrival && (
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
              New
            </span>
          )}
          {product.salePrice && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
          {productImages && productImages.length > 1 && (
            <span className="bg-black bg-opacity-70 text-white text-xs font-medium px-2 py-1 rounded">
              +{productImages.length - 1} more
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col space-y-2">
            <button className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Add to Cart Overlay */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="w-full bg-stellamaris-600 text-white py-2 px-4 rounded-lg hover:bg-stellamaris-700 transition-colors flex items-center justify-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/products/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-stellamaris-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
          {product.shortDescription || product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              ${price.toFixed(2)}
            </span>
            {product.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Sustainability Score */}
          {product.sustainabilityScore && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">
                {product.sustainabilityScore}/10
              </span>
            </div>
          )}
        </div>

        {/* Material */}
        <p className="text-xs text-gray-500 mt-2">
          {product.material}
        </p>

        {/* Reviews */}
        {product.totalReviews > 0 && (
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.averageRating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              ({product.totalReviews})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 