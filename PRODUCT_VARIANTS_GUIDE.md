# Product Variants & Image Management System

## Overview
The Stellamaris e-commerce platform now includes a comprehensive product variant system that allows products to have multiple options (colors, sizes, materials) with variant-specific images. When customers select a red bag, they'll see images specific to the red variant.

## 🎯 Key Features

### For Administrators
- **Product Variants**: Create color, size, material, and style variants
- **Variant-Specific Images**: Upload different images for each variant
- **Price Adjustments**: Set price differences for variants (e.g., red +$50, small -$20)
- **Stock Management**: Independent stock tracking per variant
- **Image Management**: Separate image galleries for general product and each variant

### For Customers
- **Interactive Variants**: Select colors/sizes to see different images
- **Dynamic Pricing**: Prices update based on selected variants
- **Stock Awareness**: Real-time stock levels per variant combination
- **Visual Feedback**: Clear indication of selected options

## 🛠️ Admin Guide

### Creating Product Variants

1. **Access Product Management**
   - Go to Admin Dashboard → Products
   - Edit an existing product or create a new one

2. **Navigate to Variants Tab**
   - In the product form, go to "Product Images & Variants"
   - Click on "Variant Images" tab
   - Click "Add Variant" button

3. **Create Variant**
   - **Name**: Display name (e.g., "Red", "Large", "Leather")
   - **Type**: Category (color, size, material, style)
   - **Value**: Internal value (e.g., "red", "xl", "leather")
   - **Price Adjustment**: +/- amount from base price
   - **Stock Quantity**: Available inventory for this variant

### Managing Variant Images

1. **Upload Variant-Specific Images**
   - Select a variant from the variant grid
   - Use drag & drop or click to upload images
   - Images will be associated with the selected variant

2. **General vs Variant Images**
   - **General Images**: Show when no variant is selected
   - **Variant Images**: Show when specific variant is selected
   - **Fallback**: If variant has no images, general images are shown

3. **Image Management Features**
   - Set primary image per variant
   - Reorder images within each variant
   - Delete unwanted images
   - Visual indicators for primary images

### Example Workflow

```
Product: "Luxury Handbag"
├── General Images (3 photos)
│   ├── Primary: Main product shot
│   ├── Detail: Close-up of craftsmanship
│   └── Lifestyle: Model carrying bag
│
├── Color Variants:
│   ├── Black (+$0)
│   │   ├── Black handbag photos (4 images)
│   │   └── Stock: 15
│   ├── Brown (+$25)
│   │   ├── Brown handbag photos (3 images)
│   │   └── Stock: 12
│   └── Red (+$50)
│       ├── Red handbag photos (5 images)
│       └── Stock: 8
│
└── Size Variants:
    ├── Small (-$20, Stock: 10)
    ├── Medium ($0, Stock: 20)
    └── Large (+$30, Stock: 15)
```

## 📱 Customer Experience

### Product Detail Page Behavior

1. **Initial Load**
   - Shows general product images
   - Displays base price
   - Shows all available variants

2. **Variant Selection**
   - **Color Selection**: Changes images to variant-specific ones
   - **Price Updates**: Shows new price with adjustments
   - **Stock Updates**: Shows minimum stock across selected variants
   - **Visual Feedback**: Selected variants highlighted

3. **Image Gallery**
   - **Variant Indicator**: Badge showing which variant's images are displayed
   - **Smooth Transitions**: Images change when variants are selected
   - **Navigation**: Arrows and thumbnails work with current image set

### Pricing Logic
```typescript
// Base price: $200
// Selected: Red (+$50) + Large (+$30)
// Final price: $200 + $50 + $30 = $280
```

### Stock Logic
```typescript
// Product total stock: 100
// Red variant: 8 in stock
// Large variant: 15 in stock
// Available stock: min(8, 15) = 8
```

## 🔧 Technical Implementation

### Database Schema

#### productVariants Table
```typescript
{
  _id: Id<"productVariants">,
  productId: Id<"products">,
  name: string,           // "Red", "Large"
  type: string,           // "color", "size"
  value: string,          // "red", "xl"
  priceAdjustment: number, // +50, -20
  stockQuantity: number,   // 15
  sku: string,            // "SKU-123-COLOR-RED"
  _creationTime: number
}
```

#### Enhanced productImages Table
```typescript
{
  _id: Id<"productImages">,
  productId: Id<"products">,
  variantId?: Id<"productVariants">, // NEW: Associates with specific variant
  imageUrl: string,
  altText?: string,
  sortOrder: number,
  isPrimary: boolean,
  _creationTime: number
}
```

### Key API Functions

#### Backend (Convex)
```typescript
// Create variant
api.products.createProductVariant({
  productId,
  name: "Red",
  type: "color",
  value: "red",
  priceAdjustment: 50,
  stockQuantity: 8
})

// Upload variant image
api.fileUpload.saveProductImage({
  productId,
  variantId,  // Associates with specific variant
  storageId,
  altText: "Red handbag front view"
})

// Get variant images
api.products.getVariantImages({ productId, variantId })

// Get product variants
api.products.getProductVariants({ productId })
```

#### Frontend Components
- `ProductImageManager`: Admin interface for variant and image management
- `ProductDetailPage`: Customer-facing variant selection and image display
- `ProductCard`: Shows general product images with variant count

## 🚀 Getting Started

### For Testing

1. **Add Sample Variants**
   ```bash
   # In Convex dashboard, run:
   api.sampleVariantData.addSampleVariants()
   ```

2. **Upload Variant Images**
   - Go to Admin → Products → Edit Product
   - Switch to "Variant Images" tab
   - Select a variant and upload images

3. **Test Customer Experience**
   - Visit product detail page
   - Select different color variants
   - Observe image and price changes

### For Production

1. **Create Product Variants**
   - Use admin interface to create variants for each product
   - Set appropriate price adjustments and stock levels

2. **Upload Variant Images**
   - Take photos of each variant
   - Upload via admin interface
   - Set primary images for each variant

3. **Quality Assurance**
   - Test all variant combinations
   - Verify image switching works correctly
   - Check price calculations

## 🐛 Troubleshooting

### Common Issues

1. **Images Not Switching**
   - Verify variant has images uploaded
   - Check if variant type is "color" (only color variants switch images)
   - Ensure images are marked as primary

2. **Price Not Updating**
   - Check variant price adjustments are set correctly
   - Verify variant selection logic in frontend

3. **Stock Issues**
   - Ensure variant stock quantities are set
   - Check stock calculation logic accounts for all selected variants

### Image Upload Issues

1. **Wrong Product Association**
   - Verify correct product is selected when uploading
   - Check if variant is selected for variant-specific uploads

2. **Images Not Displaying**
   - Confirm upload completed successfully
   - Check image URLs are valid
   - Verify database associations are correct

## 🎨 Customization

### Adding New Variant Types

1. **Backend**: Update variant creation to accept new types
2. **Frontend**: Add new type options in variant form
3. **Logic**: Update image switching logic if needed

### Custom Pricing Rules

1. Modify price calculation in `ProductDetailPage`
2. Add complex pricing logic (e.g., size + material combinations)
3. Update admin interface for pricing rules

### Enhanced Stock Management

1. Add inventory tracking per variant combination
2. Implement low stock alerts per variant
3. Add automated reordering for variants

## 📈 Future Enhancements

- **Variant Combinations**: Handle size + color combinations with specific images
- **Bulk Variant Creation**: Create variants for multiple products at once
- **Variant Analytics**: Track which variants are most popular
- **A/B Testing**: Test different variant presentations
- **3D/360° Views**: Support for interactive product views per variant

## ✅ Benefits

### For Business
- **Higher Conversion**: Customers see exactly what they're buying
- **Reduced Returns**: Accurate representation reduces disappointment
- **Increased AOV**: Premium variants with higher prices
- **Better Inventory**: Granular stock management

### For Customers
- **Visual Clarity**: See actual product variant images
- **Informed Decisions**: Know exact pricing and availability
- **Seamless Experience**: Smooth variant selection and image switching
- **Trust Building**: Transparent representation builds confidence

---

## Quick Reference

### Admin Actions
- Create variants: Admin → Products → Edit → Variant Images → Add Variant
- Upload variant images: Select variant → Upload images
- Set primary image: Click star icon on image

### Customer Experience
- Select color: Changes images automatically
- Select size: Updates price and stock
- View gallery: Navigate with arrows or thumbnails

### API Endpoints
- `products.createProductVariant`
- `products.getProductVariants`
- `products.getVariantImages`
- `fileUpload.saveProductImage` (with variantId)

### Database Tables
- `productVariants`: Stores variant data
- `productImages`: Enhanced with variantId field
- `products`: Base product information 