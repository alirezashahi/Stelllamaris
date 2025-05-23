import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Upload, X, Star, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Plus, Edit3 } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface ProductImage {
  _id: Id<"productImages">;
  _creationTime: number;
  productId: Id<"products">;
  variantId?: Id<"productVariants">;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface ProductVariant {
  _id: Id<"productVariants">;
  _creationTime: number;
  productId: Id<"products">;
  name: string;
  type: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
  sku: string;
  imageUrl?: string;
}

interface ProductImageManagerProps {
  productId: Id<"products">;
  productName: string;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({ productId, productName }) => {
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'variants'>('general');
  const [selectedVariant, setSelectedVariant] = useState<Id<"productVariants"> | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    type: 'color',
    value: '',
    priceAdjustment: 0,
    stockQuantity: 0,
  });

  // Queries
  const productImages = useQuery(api.products.getProductImages, { productId });
  const productVariants = useQuery(api.products.getProductVariants, { productId });
  const variantImages = useQuery(
    api.products.getVariantImages,
    selectedVariant ? { productId, variantId: selectedVariant } : "skip"
  );

  // Mutations
  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);
  const saveProductImage = useMutation(api.fileUpload.saveProductImage);
  const deleteProductImage = useMutation(api.fileUpload.deleteProductImage);
  const updateProductImageOrder = useMutation(api.fileUpload.updateProductImageOrder);
  const createProductVariant = useMutation(api.products.createProductVariant);
  const deleteProductVariant = useMutation(api.products.deleteProductVariant);

  const handleFileUpload = async (files: File[], variantId?: Id<"productVariants">) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File "${file.name}" is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 5MB`);
          continue;
        }
        
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        
        const { storageId } = await result.json();
        
        // Save image info to database
        await saveProductImage({
          productId,
          variantId,
          storageId,
          altText: `${productName} ${variantId ? 'variant' : ''} image ${i + 1}`,
          isPrimary: i === 0, // First image is primary
        });
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProductVariant({
        productId,
        name: variantFormData.name,
        type: variantFormData.type,
        value: variantFormData.value,
        priceAdjustment: variantFormData.priceAdjustment,
        stockQuantity: variantFormData.stockQuantity,
      });
      
      setShowVariantForm(false);
      setVariantFormData({
        name: '',
        type: 'color',
        value: '',
        priceAdjustment: 0,
        stockQuantity: 0,
      });
    } catch (error) {
      console.error('Failed to create variant:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const variantId = activeTab === 'variants' ? selectedVariant : undefined;
      handleFileUpload(Array.from(e.target.files), variantId || undefined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      const variantId = activeTab === 'variants' ? selectedVariant : undefined;
      handleFileUpload(Array.from(e.dataTransfer.files), variantId || undefined);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSetPrimary = async (imageId: Id<"productImages">) => {
    try {
      await updateProductImageOrder({
        imageId,
        sortOrder: 1,
        isPrimary: true,
      });
    } catch (error) {
      console.error('Failed to set primary image:', error);
    }
  };

  const handleDeleteImage = async (imageId: Id<"productImages">) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteProductImage({ imageId });
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };

  const getCurrentImages = () => {
    if (activeTab === 'general') {
      return productImages || [];
    } else if (selectedVariant && variantImages) {
      return variantImages;
    }
    return [];
  };

  const currentImages = getCurrentImages();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images & Variants</h3>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'general'
                ? 'bg-white text-stellamaris-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            General Images ({productImages?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'variants'
                ? 'bg-white text-stellamaris-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Variant Images ({productVariants?.length || 0} variants)
          </button>
        </div>

        {/* Variant Selector for Variant Tab */}
        {activeTab === 'variants' && (
          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Manage Variant Images</h4>
              <button
                onClick={() => setShowVariantForm(true)}
                className="flex items-center space-x-2 bg-stellamaris-600 text-white px-3 py-1 rounded-md hover:bg-stellamaris-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Variant</span>
              </button>
            </div>
            
            {productVariants && productVariants.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {productVariants.map((variant) => (
                  <button
                    key={variant._id}
                    onClick={() => setSelectedVariant(variant._id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedVariant === variant._id
                        ? 'border-stellamaris-500 bg-stellamaris-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{variant.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{variant.type}: {variant.value}</div>
                    <div className="text-xs text-gray-400">Stock: {variant.stockQuantity}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No variants created yet</p>
                <p className="text-sm">Create variants to manage variant-specific images</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Area - Only show if general tab or variant selected */}
        {(activeTab === 'general' || (activeTab === 'variants' && selectedVariant)) && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive
                ? 'border-stellamaris-500 bg-stellamaris-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-stellamaris-600 hover:text-stellamaris-700 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={uploadingImages}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG, GIF up to 5MB each
                {activeTab === 'variants' && selectedVariant && (
                  <span className="block">Uploading to selected variant</span>
                )}
              </p>
              {uploadingImages && (
                <p className="text-stellamaris-600 mt-2">Uploading images...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {currentImages.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            {activeTab === 'general' ? 'General Images' : 'Variant Images'} ({currentImages.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentImages.map((image, index) => (
              <div
                key={image._id}
                className="relative group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square">
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {image.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Primary</span>
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-2">
                      {!image.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(image._id)}
                          className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-colors"
                          title="Set as primary image"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteImage(image._id)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Variant Form */}
      {showVariantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Variant</h3>
            
            <form onSubmit={handleCreateVariant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant Name *
                </label>
                <input
                  type="text"
                  required
                  value={variantFormData.name}
                  onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                  placeholder="e.g., Red, Large"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={variantFormData.type}
                  onChange={(e) => setVariantFormData({ ...variantFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                >
                  <option value="color">Color</option>
                  <option value="size">Size</option>
                  <option value="material">Material</option>
                  <option value="style">Style</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  type="text"
                  required
                  value={variantFormData.value}
                  onChange={(e) => setVariantFormData({ ...variantFormData, value: e.target.value })}
                  placeholder="e.g., red, xl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Adjustment ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={variantFormData.priceAdjustment}
                  onChange={(e) => setVariantFormData({ ...variantFormData, priceAdjustment: parseFloat(e.target.value) || 0 })}
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
                  value={variantFormData.stockQuantity}
                  onChange={(e) => setVariantFormData({ ...variantFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVariantForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-md hover:bg-stellamaris-700 transition-colors"
                >
                  Create Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Images State */}
      {currentImages.length === 0 && (activeTab === 'general' || selectedVariant) && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium">No images uploaded yet</p>
          <p className="text-sm">
            {activeTab === 'general' 
              ? 'Upload general product images' 
              : 'Upload images for the selected variant'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductImageManager; 