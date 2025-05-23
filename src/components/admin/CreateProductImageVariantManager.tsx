import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Upload, X, Star, Image as ImageIcon, Trash2, Plus, Edit3 } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

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

interface CreateProductImageVariantManagerProps {
  onImagesChange: (images: TempImage[]) => void;
  onVariantsChange: (variants: TempVariant[]) => void;
  productName: string;
}

const CreateProductImageVariantManager: React.FC<CreateProductImageVariantManagerProps> = ({
  onImagesChange,
  onVariantsChange,
  productName
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'variants'>('general');
  const [generalImages, setGeneralImages] = useState<TempImage[]>([]);
  const [variants, setVariants] = useState<TempVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    type: 'color',
    value: '',
    priceAdjustment: 0,
    stockQuantity: 0,
  });

  const handleFileUpload = (files: File[], targetVariantId?: string) => {
    const newImages: TempImage[] = [];
    
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
      
      const tempImage: TempImage = {
        id: `temp-${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
        isPrimary: false,
        altText: `${productName} image ${i + 1}`,
      };
      
      newImages.push(tempImage);
    }

    if (targetVariantId) {
      // Add to specific variant
      const updatedVariants = variants.map(variant => {
        if (variant.id === targetVariantId) {
          const updatedVariant = {
            ...variant,
            images: [...variant.images, ...newImages.map(img => ({
              ...img,
              isPrimary: variant.images.length === 0 && img === newImages[0]
            }))]
          };
          return updatedVariant;
        }
        return variant;
      });
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);
    } else {
      // Add to general images
      const updatedImages = [...generalImages, ...newImages.map(img => ({
        ...img,
        isPrimary: generalImages.length === 0 && img === newImages[0]
      }))];
      setGeneralImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newVariant: TempVariant = {
      id: `variant-${Date.now()}`,
      name: variantFormData.name,
      type: variantFormData.type,
      value: variantFormData.value,
      priceAdjustment: variantFormData.priceAdjustment,
      stockQuantity: variantFormData.stockQuantity,
      images: [],
    };
    
    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    onVariantsChange(updatedVariants);
    
    setShowVariantForm(false);
    setVariantFormData({
      name: '',
      type: 'color',
      value: '',
      priceAdjustment: 0,
      stockQuantity: 0,
    });
  };

  const handleSetPrimary = (imageId: string, variantId?: string) => {
    if (variantId) {
      const updatedVariants = variants.map(variant => {
        if (variant.id === variantId) {
          return {
            ...variant,
            images: variant.images.map(img => ({
              ...img,
              isPrimary: img.id === imageId
            }))
          };
        }
        return variant;
      });
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);
    } else {
      const updatedImages = generalImages.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }));
      setGeneralImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  const handleDeleteImage = (imageId: string, variantId?: string) => {
    if (variantId) {
      const updatedVariants = variants.map(variant => {
        if (variant.id === variantId) {
          const filteredImages = variant.images.filter(img => img.id !== imageId);
          // If deleted image was primary, make first image primary
          if (filteredImages.length > 0 && !filteredImages.some(img => img.isPrimary)) {
            filteredImages[0].isPrimary = true;
          }
          return {
            ...variant,
            images: filteredImages
          };
        }
        return variant;
      });
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);
    } else {
      const filteredImages = generalImages.filter(img => img.id !== imageId);
      // If deleted image was primary, make first image primary
      if (filteredImages.length > 0 && !filteredImages.some(img => img.isPrimary)) {
        filteredImages[0].isPrimary = true;
      }
      setGeneralImages(filteredImages);
      onImagesChange(filteredImages);
    }
  };

  const handleDeleteVariant = (variantId: string) => {
    if (window.confirm('Are you sure you want to delete this variant and all its images?')) {
      const updatedVariants = variants.filter(v => v.id !== variantId);
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);
      if (selectedVariant === variantId) {
        setSelectedVariant(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const targetVariantId = activeTab === 'variants' ? selectedVariant : undefined;
      handleFileUpload(Array.from(e.target.files), targetVariantId || undefined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      const targetVariantId = activeTab === 'variants' ? selectedVariant : undefined;
      handleFileUpload(Array.from(e.dataTransfer.files), targetVariantId || undefined);
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

  const getCurrentImages = () => {
    if (activeTab === 'general') {
      return generalImages;
    } else if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant);
      return variant?.images || [];
    }
    return [];
  };

  const resetVariantForm = () => {
    setShowVariantForm(false);
    setVariantFormData({
      name: '',
      type: 'color',
      value: '',
      priceAdjustment: 0,
      stockQuantity: 0,
    });
  };

  const currentImages = getCurrentImages();

  // Variant Form Modal Component (will be rendered using Portal)
  const VariantFormModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          resetVariantForm();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Product Variant</h3>
        
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
              placeholder="e.g., Red, Large, Cotton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Type *
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
              Variant Value *
            </label>
            <input
              type="text"
              required
              value={variantFormData.value}
              onChange={(e) => setVariantFormData({ ...variantFormData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
              placeholder="e.g., red, xl, cotton"
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
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">Amount to add/subtract from base price</p>
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
              onClick={resetVariantForm}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-md hover:bg-stellamaris-700 transition-colors"
            >
              Add Variant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return (
    <>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-stellamaris-500 text-stellamaris-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General Images ({generalImages.length})
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'variants'
                  ? 'border-stellamaris-500 text-stellamaris-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Variant Images ({variants.length} variants)
            </button>
          </nav>
        </div>

        {/* General Images Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-900">General Product Images</h4>
              <p className="text-sm text-gray-500">These images will be shown when no variant is selected</p>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-stellamaris-400 bg-stellamaris-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="general-file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload general product images
                  </span>
                  <span className="mt-2 block text-sm text-gray-500">
                    or drag and drop PNG, JPG, GIF up to 5MB each
                  </span>
                  <input
                    id="general-file-upload"
                    name="general-file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            {/* Images Grid */}
            {currentImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <img
                        src={image.preview}
                        alt={image.altText || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="absolute top-2 left-2 flex space-x-1">
                      <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      {image.isPrimary && (
                        <span className="bg-stellamaris-600 text-white text-xs px-2 py-1 rounded flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        {!image.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(image.id)}
                            className="bg-black bg-opacity-75 text-white p-1 rounded hover:bg-opacity-90"
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="bg-red-600 bg-opacity-75 text-white p-1 rounded hover:bg-opacity-90"
                          title="Delete image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-900">Product Variants</h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVariantForm(true);
                }}
                className="flex items-center space-x-2 bg-stellamaris-600 text-white px-3 py-1 rounded text-sm hover:bg-stellamaris-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Variant</span>
              </button>
            </div>

            {/* Variants List */}
            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVariant === variant.id
                        ? 'border-stellamaris-500 bg-stellamaris-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVariant(variant.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{variant.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {variant.type}: {variant.value}
                        </span>
                        {variant.priceAdjustment !== 0 && (
                          <span className={`text-sm ml-2 ${
                            variant.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 ml-2">
                          Stock: {variant.stockQuantity}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          Images: {variant.images.length}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVariant(variant.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Variant Images */}
            {selectedVariant && (
              <div className="space-y-4 border-t pt-4">
                <h5 className="text-sm font-medium text-gray-900">
                  Images for {variants.find(v => v.id === selectedVariant)?.name}
                </h5>

                {/* Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive 
                      ? 'border-stellamaris-400 bg-stellamaris-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="variant-file-upload" className="cursor-pointer">
                      <span className="block text-sm font-medium text-gray-900">
                        Upload variant images
                      </span>
                      <span className="block text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB each
                      </span>
                      <input
                        id="variant-file-upload"
                        name="variant-file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                </div>

                {/* Variant Images Grid */}
                {currentImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                          <img
                            src={image.preview}
                            alt={image.altText || `Variant image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="absolute top-2 left-2 flex space-x-1">
                          <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          {image.isPrimary && (
                            <span className="bg-stellamaris-600 text-white text-xs px-2 py-1 rounded flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              Primary
                            </span>
                          )}
                        </div>
                        
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            {!image.isPrimary && (
                              <button
                                onClick={() => handleSetPrimary(image.id, selectedVariant)}
                                className="bg-black bg-opacity-75 text-white p-1 rounded hover:bg-opacity-90"
                                title="Set as primary"
                              >
                                <Star className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteImage(image.id, selectedVariant)}
                              className="bg-red-600 bg-opacity-75 text-white p-1 rounded hover:bg-opacity-90"
                              title="Delete image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Modal using Portal */}
      {showVariantForm && createPortal(
        <VariantFormModal />,
        document.body
      )}
    </>
  );
};

export default CreateProductImageVariantManager; 