import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import ProductCard from '../common/ProductCard';
import { ChevronDown, Filter, X, Grid3X3, List, Star, Package } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';
import HierarchicalCategoryFilter from '../common/HierarchicalCategoryFilter';

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

interface Category {
  _id: Id<"categories">;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface Filters {
  category: string | null;
  priceRange: { min: number; max: number };
  materials: string[];
  sustainabilityScore: { min: number; max: number };
  sortBy: 'price-asc' | 'price-desc' | 'name' | 'sustainability' | 'newest';
}

const ProductListingPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [filters, setFilters] = useState<Filters>({
    category: null,
    priceRange: { min: 0, max: 2000 },
    materials: [],
    sustainabilityScore: { min: 1, max: 10 },
    sortBy: 'newest',
  });

  // Queries
  const products = useQuery(api.products.getAllProducts) as Product[] | undefined;
  const hierarchicalCategories = useQuery(api.categories.getAllCategoriesHierarchical);

  // Get unique materials from products
  const availableMaterials = useMemo(() => {
    if (!products) return [];
    const materials = new Set<string>();
    products.forEach(product => {
      if (product.material) {
        materials.add(product.material);
      }
    });
    return Array.from(materials).sort();
  }, [products]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter(product => {
      // Category filter
      if (filters.category && product.categoryId !== filters.category) {
        return false;
      }

      // Price range filter
      const price = product.salePrice || product.basePrice;
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }

      // Materials filter
      if (filters.materials.length > 0 && product.material) {
        if (!filters.materials.includes(product.material)) {
          return false;
        }
      }

      // Sustainability score filter
      if (product.sustainabilityScore) {
        if (product.sustainabilityScore < filters.sustainabilityScore.min || 
            product.sustainabilityScore > filters.sustainabilityScore.max) {
          return false;
        }
      }

      // Only show active products with stock
      return product.status === 'active' && product.totalStock > 0;
    });

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'sustainability':
        filtered.sort((a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
        break;
    }

    return filtered;
  }, [products, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCategorySelect = (categoryId: string | null) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
    setCurrentPage(1);
  };

  const handleMaterialToggle = (material: string) => {
    setFilters(prev => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter(m => m !== material)
        : [...prev.materials, material]
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: null,
      priceRange: { min: 0, max: 2000 },
      materials: [],
      sustainabilityScore: { min: 1, max: 10 },
      sortBy: 'newest',
    });
    setCurrentPage(1);
  };

  const getCategoryName = (categoryId: Id<"categories">) => {
    if (!hierarchicalCategories) return '';
    
    // Find in parent categories
    for (const parent of hierarchicalCategories) {
      if (parent._id === categoryId) return parent.name;
      
      // Find in child categories
      for (const child of parent.children) {
        if (child._id === categoryId) return `${parent.name} > ${child.name}`;
      }
    }
    
    return '';
  };

  if (!products) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {filters.category ? getCategoryName(filters.category as Id<"categories">) : 'All Products'}
            </h1>
            <p className="text-gray-600 mt-2">
              {filteredProducts.length} products found
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-stellamaris-100 text-stellamaris-600' : 'text-gray-400'}`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-stellamaris-100 text-stellamaris-600' : 'text-gray-400'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A-Z</option>
              <option value="sustainability">Most Sustainable</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              {(filters.category || filters.materials.length > 0) && (
                <span className="bg-stellamaris-100 text-stellamaris-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(filters.category ? 1 : 0) + filters.materials.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {(filters.category || filters.materials.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-stellamaris-600 hover:text-stellamaris-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Categories */}
                <HierarchicalCategoryFilter
                  selectedCategoryId={filters.category || undefined}
                  onCategorySelect={handleCategorySelect}
                  showCounts={false}
                />

                {/* Price Range */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={filters.priceRange.min}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Min"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        value={filters.priceRange.max}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: parseInt(e.target.value) || 2000 }
                        }))}
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Materials</h4>
                  <div className="space-y-2">
                    {availableMaterials.map(material => (
                      <label key={material} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.materials.includes(material)}
                          onChange={() => handleMaterialToggle(material)}
                          className="text-stellamaris-600 focus:ring-stellamaris-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sustainability Score */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sustainability Score</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={filters.sustainabilityScore.min}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          sustainabilityScore: { ...prev.sustainabilityScore, min: parseInt(e.target.value) }
                        }))}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-8">
                        {filters.sustainabilityScore.min}+
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Less Sustainable</span>
                      <span>More Sustainable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
                <button
                  onClick={clearFilters}
                  className="bg-stellamaris-600 text-white px-6 py-2 rounded-lg hover:bg-stellamaris-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Products */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {paginatedProducts.map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      layout={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-4 py-2 border rounded-lg ${
                            currentPage === i + 1
                              ? 'bg-stellamaris-600 text-white border-stellamaris-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListingPage; 