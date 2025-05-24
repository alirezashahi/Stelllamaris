import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, X, Star, Image as ImageIcon, Trash2, Plus } from 'lucide-react';

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
  type: 'color' | 'size' | 'material' | 'style';
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
  // Main state
  const [activeTab, setActiveTab] = useState<'general' | 'variants'>('general');
  const [generalImages, setGeneralImages] = useState<TempImage[]>([]);
  const [variants, setVariants] = useState<TempVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form state - separate variables for stability
  const [formData, setFormData] = useState({
    name: '',
    type: 'color' as const,
    value: '',
    priceAdjustment: 0,
    stockQuantity: 0
  });

  // Effect to clear parent's temp images/variants on mount
  useEffect(() => {
    onImagesChange([]);
    onVariantsChange([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs only on mount and unmount

  // Helper to generate unique IDs
  const generateId = useCallback(() => `temp-${Date.now()}-${Math.random()}`, []);

  // Create temp image from file
  const createTempImage = useCallback((file: File, index: number): TempImage => ({
    id: generateId(),
    file,
    preview: URL.createObjectURL(file),
    isPrimary: false,
    altText: `${productName} image ${index + 1}`
  }), [generateId, productName]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return `${file.name} is not an image file`;
    }
    if (file.size > 5 * 1024 * 1024) {
      return `${file.name} is too large (max 5MB)`;
    }
    return null;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: TempImage[] = [];
    const errors: string[] = [];

    fileArray.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        return;
      }
      newImages.push(createTempImage(file, index));
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newImages.length === 0) return;

    if (activeTab === 'general') {
      setGeneralImages(prev => {
        const updated = [...prev, ...newImages];
        // Set first image as primary if no primary exists
        if (prev.length === 0 && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        onImagesChange(updated);
        return updated;
      });
    } else if (selectedVariantId) {
      setVariants(prev => {
        const updated = prev.map(variant => {
          if (variant.id === selectedVariantId) {
            const variantImages = [...variant.images, ...newImages];
            // Set first image as primary if no primary exists
            if (variant.images.length === 0 && variantImages.length > 0) {
              variantImages[0].isPrimary = true;
            }
            return { ...variant, images: variantImages };
        }
        return variant;
        });
        onVariantsChange(updated);
        return updated;
      });
    }
  }, [activeTab, selectedVariantId, validateFile, createTempImage, onImagesChange, onVariantsChange]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
      e.target.value = '';
    }
  }, [handleFileUpload]);

  // Set primary image
  const handleSetPrimary = useCallback((imageId: string) => {
    if (activeTab === 'general') {
      setGeneralImages(prev => {
        const updated = prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
        onImagesChange(updated);
        return updated;
      });
    } else if (selectedVariantId) {
      setVariants(prev => {
        const updated = prev.map(variant => {
          if (variant.id === selectedVariantId) {
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
        onVariantsChange(updated);
        return updated;
      });
    }
  }, [activeTab, selectedVariantId, onImagesChange, onVariantsChange]);

  // Delete image
  const handleDeleteImage = useCallback((imageId: string) => {
    if (activeTab === 'general') {
      setGeneralImages(prev => {
        const updated = prev.filter(img => img.id !== imageId);
        // Auto-assign primary if deleted image was primary
        if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
          updated[0].isPrimary = true;
        }
        onImagesChange(updated);
        return updated;
      });
    } else if (selectedVariantId) {
      setVariants(prev => {
        const updated = prev.map(variant => {
          if (variant.id === selectedVariantId) {
          const filteredImages = variant.images.filter(img => img.id !== imageId);
            // Auto-assign primary if deleted image was primary
          if (filteredImages.length > 0 && !filteredImages.some(img => img.isPrimary)) {
            filteredImages[0].isPrimary = true;
          }
            return { ...variant, images: filteredImages };
        }
        return variant;
        });
        onVariantsChange(updated);
        return updated;
      });
    }
  }, [activeTab, selectedVariantId, onImagesChange, onVariantsChange]);

  // Create variant
  const handleCreateVariant = useCallback((e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      // CRITICAL: Prevent any event propagation
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Variant name is required');
      return;
    }
    
    if (!formData.value.trim()) {
      alert('Variant value is required');
      return;
    }
    
    if (formData.stockQuantity < 0) {
      alert('Stock quantity cannot be negative');
      return;
    }
    
    try {
      const newVariant: TempVariant = {
        id: generateId(),
        name: formData.name.trim(),
        type: formData.type,
        value: formData.value.trim(),
        priceAdjustment: formData.priceAdjustment,
        stockQuantity: formData.stockQuantity,
        images: []
      };

      setVariants(prev => {
        const updated = [...prev, newVariant];
        onVariantsChange(updated);
        return updated;
      });

      // Reset form
      setFormData({
        name: '',
        type: 'color',
        value: '',
        priceAdjustment: 0,
        stockQuantity: 0
      });
      setShowVariantForm(false);
    } catch (error) {
      console.error('Error creating variant:', error);
    }
  }, [formData, generateId, onVariantsChange]);

  // Delete variant
  const handleDeleteVariant = useCallback((variantId: string) => {
    if (!confirm('Delete this variant and all its images?')) return;
    
    setVariants(prev => {
      const updated = prev.filter(v => v.id !== variantId);
      onVariantsChange(updated);
      return updated;
    });
    
    if (selectedVariantId === variantId) {
      setSelectedVariantId(null);
    }
  }, [selectedVariantId, onVariantsChange]);

  // Add variant form button handler
  const handleAddVariantClick = useCallback(() => {
    setShowVariantForm(true);
  }, []);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    setShowVariantForm(false);
  }, []);

  // Form input change handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, type: e.target.value as any }));
  }, []);

  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, value: e.target.value }));
  }, []);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }));
  }, []);

  const handleStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }));
  }, []);

  // Get current images based on active tab and selection
  const currentImages = useMemo(() => {
    if (activeTab === 'general') {
      return generalImages;
    }
    if (selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId);
      return variant?.images || [];
    }
    return [];
  }, [activeTab, selectedVariantId, generalImages, variants]);

  // Upload area component
  const UploadArea = useMemo(() => (
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
        <label className="cursor-pointer">
          <span className="mt-2 block text-sm font-medium text-gray-900">
            Click to upload or drag and drop
          </span>
          <span className="mt-2 block text-sm text-gray-500">
            PNG, JPG, GIF up to 5MB each
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/*"
            onChange={handleFileInput}
          />
        </label>
      </div>
    </div>
  ), [dragActive, handleDrop, handleDragOver, handleDragLeave, handleFileInput]);

  // Images grid component
  const ImagesGrid = useMemo(() => {
    if (currentImages.length === 0) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentImages.map((image, index) => (
          <div key={image.id} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
              <img
                src={image.preview}
                alt={image.altText}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Controls */}
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleSetPrimary(image.id)}
                className={`p-1 rounded-full ${
                  image.isPrimary 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white bg-opacity-80 text-gray-700 hover:bg-yellow-500 hover:text-white'
                }`}
                title={image.isPrimary ? 'Primary image' : 'Set as primary'}
              >
                <Star className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteImage(image.id)}
                className="p-1 rounded-full bg-white bg-opacity-80 text-gray-700 hover:bg-red-500 hover:text-white"
                title="Delete image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            {/* Badge */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-70 text-white">
                {index + 1}
              </span>
              {image.isPrimary && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                  Primary
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [currentImages, handleSetPrimary, handleDeleteImage]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
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
            type="button"
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
            <p className="text-sm text-gray-500">Shown when no variant is selected</p>
          </div>
          {UploadArea}
          {ImagesGrid}
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">Product Variants & Images</h4>
            <button
              type="button"
              onClick={handleAddVariantClick}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-stellamaris-600 hover:bg-stellamaris-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </button>
          </div>

          {/* Variants Grid */}
          {variants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedVariantId === variant.id
                      ? 'border-stellamaris-500 bg-stellamaris-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVariantId(
                    selectedVariantId === variant.id ? null : variant.id
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{variant.name}</h5>
                      <p className="text-sm text-gray-500 capitalize">{variant.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVariant(variant.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Value: {variant.value}</p>
                    <p>Price: {variant.priceAdjustment >= 0 ? '+' : ''}${variant.priceAdjustment}</p>
                    <p>Stock: {variant.stockQuantity}</p>
                    <p>Images: {variant.images.length}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No variants created yet</p>
              <p className="text-sm">Create variants to upload variant-specific images</p>
            </div>
          )}

          {/* Selected Variant Images */}
          {selectedVariantId && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-sm font-medium text-gray-900">
                  Images for: {variants.find(v => v.id === selectedVariantId)?.name}
                </h5>
                <p className="text-sm text-gray-500">Upload variant-specific images</p>
              </div>
              {UploadArea}
              {ImagesGrid}
            </div>
          )}
        </div>
      )}

      {/* Variant Form Modal */}
      {showVariantForm && (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
            // Prevent clicks on backdrop from bubbling
            e.stopPropagation();
        if (e.target === e.currentTarget) {
              setShowVariantForm(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from bubbling
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Product Variant</h3>
        
            {/* CRITICAL: Use div instead of form to prevent nesting, handle submission manually */}
            <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name *
            </label>
            <input
              type="text"
              required
                  value={formData.name}
                  onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
              placeholder="e.g., Red, Large, Cotton"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Type *
            </label>
            <select
              required
                  value={formData.type}
                  onChange={handleTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  onKeyDown={(e) => e.stopPropagation()}
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
                  value={formData.value}
                  onChange={handleValueChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
              placeholder="e.g., red, xl, cotton"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Adjustment ($)
            </label>
            <input
              type="number"
              step="0.01"
                  value={formData.priceAdjustment}
                  onChange={handlePriceChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
              placeholder="0.00"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
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
                  value={formData.stockQuantity}
                  onChange={handleStockChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
                  onClick={handleModalClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                    handleCreateVariant(e);
                  }}
                  className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-md hover:bg-stellamaris-700 transition-colors"
                >
                  Add Variant
                            </button>
                          </div>
                        </div>
                      </div>
          </div>
        )}
      </div>
  );
};

export default CreateProductImageVariantManager; 