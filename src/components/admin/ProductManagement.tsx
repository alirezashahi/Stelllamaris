import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Package, 
  DollarSign, 
  Tag, 
  Search,
  Filter,
  Upload,
  Star,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';
import ProductImageManager from './ProductImageManager';
import CreateProductImageVariantManager from './CreateProductImageVariantManager';

interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  sku: string;
  categoryId: Id<"categories">;
  sustainabilityScore?: number;
  sustainableFeatures?: string[];
  material: string;
  dimensions?: string;
  weight?: number;
  careInstructions?: string;
  status: "active" | "draft" | "archived";
  totalStock: number;
  lowStockThreshold: number;
  totalSales: number;
  averageRating?: number;
  totalReviews: number;
  isFeatured: boolean;
  isNewArrival: boolean;
}

interface Category {
  _id: Id<"categories">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: Id<"categories">;
  isActive: boolean;
  sortOrder: number;
}

interface HierarchicalCategory {
  _id: Id<"categories">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: Id<"categories">;
  isActive: boolean;
  sortOrder: number;
  children: Category[];
}

interface TempImage {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  altText?: string;
}

interface TempVariant {
  id: string;
  name: string;
  type: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
  images: TempImage[];
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  sustainabilityScore: string;
  materials: string;
  tags: string;
  stockQuantity: string;
  isActive: boolean;
}

interface ProductRowProps {
  product: Product;
  getCategoryName: (categoryId: Id<"categories">) => string;
  getStatusColor: (product: Product) => string;
  getStatusText: (product: Product) => string;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (productId: Id<"products">, isActive: boolean) => void;
  onDelete: (productId: Id<"products">) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  getCategoryName,
  getStatusColor,
  getStatusText,
  onView,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  // Get primary image for this product
  const productImages = useQuery(api.products.getProductImages, { productId: product._id });
  const primaryImage = productImages?.find(img => img.isPrimary) || productImages?.[0];

  return (
    <tr key={product._id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {primaryImage ? (
              <img
                src={primaryImage.imageUrl}
                alt={primaryImage.altText || product.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Star className="h-3 w-3 text-yellow-400 mr-1" />
              {product.sustainabilityScore ? product.sustainabilityScore.toString() : 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {getCategoryName(product.categoryId)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">${product.basePrice.toFixed(2)}</div>
        {product.salePrice && (
          <div className="text-sm text-gray-500 line-through">
            ${product.salePrice.toFixed(2)}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.totalStock}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product)}`}>
          {getStatusText(product)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => onView(product)}
          className="text-stellamaris-600 hover:text-stellamaris-700"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(product)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggleStatus(product._id, product.status !== 'active')}
          className={`${product.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
        >
          <Package className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(product._id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

const ProductManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [tempVariants, setTempVariants] = useState<TempVariant[]>([]);
  
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    compareAtPrice: '',
    categoryId: '',
    sustainabilityScore: '5',
    materials: '',
    tags: '',
    stockQuantity: '0',
    isActive: true,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    parentCategoryId: '',
  });

  // Queries
  const products = useQuery(api.products.getAllProducts);
  const hierarchicalCategories = useQuery(api.categories.getAllCategoriesHierarchical);
  const productStats = useQuery(api.products.getProductStats);
  
  // Helper to get primary image for a product
  const getProductPrimaryImage = (productId: Id<"products">) => {
    return useQuery(api.products.getProductImages, { productId });
  };

  // Mutations
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const createCategory = useMutation(api.categories.createCategory);
  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);
  const saveProductImage = useMutation(api.fileUpload.saveProductImage);
  const createProductVariant = useMutation(api.products.createProductVariant);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        // Update existing product
        await updateProduct({
          productId: editingProduct._id,
          name: productFormData.name,
          slug: productFormData.slug,
          description: productFormData.description,
          price: parseFloat(productFormData.price),
          compareAtPrice: productFormData.compareAtPrice ? parseFloat(productFormData.compareAtPrice) : undefined,
          categoryId: productFormData.categoryId as Id<"categories">,
          sustainabilityScore: parseInt(productFormData.sustainabilityScore),
          materials: productFormData.materials.split(',').map(m => m.trim()).filter(m => m),
          stockQuantity: parseInt(productFormData.stockQuantity),
          isActive: productFormData.isActive,
        });
      } else {
        // Create new product
        const productId = await createProduct({
          name: productFormData.name,
          slug: productFormData.slug,
          description: productFormData.description,
          price: parseFloat(productFormData.price),
          compareAtPrice: productFormData.compareAtPrice ? parseFloat(productFormData.compareAtPrice) : undefined,
          categoryId: productFormData.categoryId as Id<"categories">,
          sustainabilityScore: parseInt(productFormData.sustainabilityScore),
          materials: productFormData.materials.split(',').map(m => m.trim()).filter(m => m),
          tags: productFormData.tags.split(',').map(t => t.trim()).filter(t => t),
          stockQuantity: parseInt(productFormData.stockQuantity),
          isActive: productFormData.isActive,
          images: [], // Will be uploaded after product creation
        });

        // Upload general images
        await uploadTempImages(productId, tempImages);

        // Create variants and upload their images
        await createTempVariants(productId, tempVariants);
      }
      
      setShowCreateForm(false);
      resetProductForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const uploadTempImages = async (productId: Id<"products">, images: TempImage[]) => {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": image.file.type },
          body: image.file,
        });
        
        const { storageId } = await result.json();
        
        // Save image info to database
        await saveProductImage({
          productId,
          storageId,
          altText: image.altText || `${productFormData.name} image ${i + 1}`,
          isPrimary: image.isPrimary,
        });
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error);
      }
    }
  };

  const createTempVariants = async (productId: Id<"products">, variants: TempVariant[]) => {
    for (const variant of variants) {
      try {
        // Create variant
        const variantId = await createProductVariant({
          productId,
          name: variant.name,
          type: variant.type,
          value: variant.value,
          priceAdjustment: variant.priceAdjustment,
          stockQuantity: variant.stockQuantity,
        });

        // Upload variant images
        for (let i = 0; i < variant.images.length; i++) {
          const image = variant.images[i];
          try {
            // Generate upload URL
            const uploadUrl = await generateUploadUrl();
            
            // Upload file
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": image.file.type },
              body: image.file,
            });
            
            const { storageId } = await result.json();
            
            // Save image info to database
            await saveProductImage({
              productId,
              variantId,
              storageId,
              altText: image.altText || `${variant.name} image ${i + 1}`,
              isPrimary: image.isPrimary,
            });
          } catch (error) {
            console.error(`Failed to upload variant image ${i + 1}:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to create variant ${variant.name}:`, error);
      }
    }
  };

  const handleUpdateProduct = async (productId: Id<"products">, updates: any) => {
    try {
      await updateProduct({ productId, ...updates });
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct({ productId });
        setSelectedProduct(null);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCategory({
        name: categoryFormData.name,
        description: categoryFormData.description || undefined,
      });
      
      setShowCategoryForm(false);
      setCategoryFormData({ name: '', description: '', parentCategoryId: '' });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      compareAtPrice: '',
      categoryId: '',
      sustainabilityScore: '5',
      materials: '',
      tags: '',
      stockQuantity: '0',
      isActive: true,
    });
    setTempImages([]);
    setTempVariants([]);
    setEditingProduct(null);
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.status === 'active') ||
                         (filterStatus === 'inactive' && product.status !== 'active') ||
                         (filterStatus === 'low-stock' && product.totalStock < 10);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryName = (categoryId: Id<"categories">) => {
    if (!hierarchicalCategories) return 'Unknown';
    
    // Find in parent categories
    for (const parent of hierarchicalCategories) {
      if (parent._id === categoryId) return parent.name;
      
      // Find in child categories
      for (const child of parent.children) {
        if (child._id === categoryId) return `${parent.name} > ${child.name}`;
      }
    }
    
    return 'Unknown';
  };

  const getAllCategoriesFlat = (): Category[] => {
    if (!hierarchicalCategories) return [];
    
    const flatCategories: Category[] = [];
    
    hierarchicalCategories.forEach(parent => {
      flatCategories.push(parent);
      flatCategories.push(...parent.children);
    });
    
    return flatCategories;
  };

  const getStatusColor = (product: Product) => {
    if (product.status !== 'active') return 'bg-gray-100 text-gray-800';
    if (product.totalStock === 0) return 'bg-red-100 text-red-800';
    if (product.totalStock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (product: Product) => {
    if (product.status !== 'active') return 'Inactive';
    if (product.totalStock === 0) return 'Out of Stock';
    if (product.totalStock < 10) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Tag className="h-4 w-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-stellamaris-600 text-white px-4 py-2 rounded-lg hover:bg-stellamaris-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products?.length || 0}</p>
            </div>
            <Package className="h-8 w-8 text-stellamaris-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600">
                {products?.filter(p => p.status === 'active').length || 0}
              </p>
            </div>
            <Eye className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products?.filter(p => p.totalStock < 10 && p.totalStock > 0).length || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {products?.filter(p => p.totalStock === 0).length || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {hierarchicalCategories?.map(parent => (
            <optgroup key={parent._id} label={parent.name}>
              <option value={parent._id}>{parent.name}</option>
              {parent.children.map(child => (
                <option key={child._id} value={child._id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low-stock">Low Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts?.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  getCategoryName={getCategoryName}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  onView={(p) => setSelectedProduct(p)}
                  onEdit={(p) => {
                    setEditingProduct(p);
                    setProductFormData({
                      name: p.name,
                      slug: p.slug,
                      description: p.description,
                      price: p.basePrice.toString(),
                      compareAtPrice: p.salePrice?.toString() || '',
                      categoryId: p.categoryId,
                      sustainabilityScore: p.sustainabilityScore?.toString() || '5',
                      materials: p.material,
                      tags: '',
                      stockQuantity: p.totalStock.toString(),
                      isActive: p.status === 'active',
                    });
                    // Clear temp data when editing existing product
                    setTempImages([]);
                    setTempVariants([]);
                    setShowCreateForm(true);
                  }}
                  onToggleStatus={(id, isActive) => handleUpdateProduct(id, { isActive })}
                  onDelete={(id) => handleDeleteProduct(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Product Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </h3>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productFormData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setProductFormData({ 
                        ...productFormData, 
                        name: newName,
                        slug: generateSlug(newName)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={productFormData.slug}
                    onChange={(e) => setProductFormData({ ...productFormData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    placeholder="auto-generated-from-name"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly version of the product name</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={productFormData.categoryId}
                    onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  >
                    <option value="">Select Category</option>
                    {hierarchicalCategories?.map(parent => (
                      <optgroup key={parent._id} label={parent.name}>
                        <option value={parent._id}>{parent.name}</option>
                        {parent.children.map(child => (
                          <option key={child._id} value={child._id}>
                            {child.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare At Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productFormData.compareAtPrice}
                    onChange={(e) => setProductFormData({ ...productFormData, compareAtPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productFormData.stockQuantity}
                    onChange={(e) => setProductFormData({ ...productFormData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sustainability Score (1-10) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={productFormData.sustainabilityScore}
                  onChange={(e) => setProductFormData({ ...productFormData, sustainabilityScore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materials *
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.materials}
                  onChange={(e) => setProductFormData({ ...productFormData, materials: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={productFormData.tags}
                  onChange={(e) => setProductFormData({ ...productFormData, tags: e.target.value })}
                  placeholder="sustainable, luxury, casual"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              {/* Image Upload Section */}
              {editingProduct ? (
                <ProductImageManager
                  productId={editingProduct._id}
                  productName={editingProduct.name}
                />
              ) : (
                <CreateProductImageVariantManager
                  onImagesChange={setTempImages}
                  onVariantsChange={setTempVariants}
                  productName={productFormData.name || 'New Product'}
                />
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={productFormData.isActive}
                  onChange={(e) => setProductFormData({ ...productFormData, isActive: e.target.checked })}
                  className="text-stellamaris-600 focus:ring-stellamaris-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Product is active and visible to customers
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetProductForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-md hover:bg-stellamaris-700 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Category</h3>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={categoryFormData.parentCategoryId}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, parentCategoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                >
                  <option value="">Top Level Category</option>
                  {hierarchicalCategories?.map(parent => (
                    <option key={parent._id} value={parent._id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryFormData({ name: '', description: '', parentCategoryId: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-md hover:bg-stellamaris-700 transition-colors"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 