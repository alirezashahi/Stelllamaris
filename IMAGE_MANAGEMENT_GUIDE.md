# Image Management System Guide

## Overview
The Stellamaris e-commerce platform now includes a comprehensive image management system that allows admins to upload multiple product images, set primary images, and provides customers with an image gallery experience.

## For Administrators

### Uploading Product Images

1. **Access Product Management**
   - Navigate to the Admin Dashboard
   - Click on "Products" in the sidebar
   - Create a new product or edit an existing one

2. **Adding Images**
   - In the product edit form, scroll to the "Product Images" section
   - **Drag & Drop**: Drag image files directly into the upload area
   - **Click to Upload**: Click "Click to upload" to select files
   - **Multiple Upload**: Select multiple images at once (up to 5MB each)
   - **Supported Formats**: PNG, JPG, GIF

3. **Managing Images**
   - **Set Primary Image**: Click the star (⭐) button to set an image as primary
   - **Reorder Images**: Use up/down arrow buttons to change image order
   - **Delete Images**: Click the trash button to remove unwanted images
   - **View Order**: Images are numbered to show their display order

4. **Image Guidelines**
   - First uploaded image automatically becomes primary
   - Primary image is shown on product listing pages
   - Images appear in the order you set them
   - High-quality images (min 800x800px) recommended

### Image Management Features

- **Primary Image Selection**: The starred image appears as the main product image
- **Automatic Management**: When primary image is deleted, system auto-assigns new primary
- **Drag & Drop Upload**: Easy bulk image upload
- **Real-time Preview**: See images immediately after upload
- **Image Counter**: Shows total number of images per product

## For Customers

### Product Image Gallery

1. **Product Listing Page**
   - Primary image displayed for each product
   - "+X more" badge shows when multiple images exist
   - Hover effects for better interaction

2. **Product Detail Page**
   - **Main Image Display**: Large primary image with navigation arrows
   - **Thumbnail Gallery**: Small clickable thumbnails below main image
   - **Navigation**: Click arrows or thumbnails to view different images
   - **Image Counter**: Shows current image position (e.g., "2 / 5")
   - **Primary Badge**: Star indicates which image is marked as primary

3. **Gallery Features**
   - **Arrow Navigation**: Previous/Next buttons on main image
   - **Thumbnail Navigation**: Click any thumbnail to view that image
   - **Responsive Design**: Works on desktop, tablet, and mobile
   - **Smooth Transitions**: Animated image changes

## Technical Implementation

### Backend (Convex)

#### File Upload System
```typescript
// Generate secure upload URL
const uploadUrl = await generateUploadUrl();

// Save image with metadata
await saveProductImage({
  productId: "product_id",
  storageId: "storage_id", 
  altText: "Product image description",
  isPrimary: true // Set as primary image
});
```

#### Image Management Queries
```typescript
// Get all images for a product
const images = await getProductImages({ productId: "product_id" });

// Update image order and primary status
await updateProductImageOrder({
  imageId: "image_id",
  sortOrder: 1,
  isPrimary: true
});
```

### Frontend Components

#### ProductImageManager (Admin)
- Handles drag & drop upload
- Provides image management interface
- Manages primary selection and ordering
- Located: `src/components/admin/ProductImageManager.tsx`

#### ProductCard (Customer)
- Displays primary image with fallback
- Shows image count badge
- Located: `src/components/common/ProductCard.tsx`

#### ProductDetailPage (Customer)
- Full image gallery with navigation
- Thumbnail grid with main image display
- Located: `src/components/pages/ProductDetailPage.tsx`

### Database Schema

#### productImages Table
```typescript
{
  _id: Id<"productImages">,
  productId: Id<"products">,
  imageUrl: string,
  altText?: string,
  sortOrder: number,
  isPrimary: boolean,
  _creationTime: number
}
```

## Best Practices

### For Admins
1. **Upload high-quality images** (minimum 800x800px)
2. **Use descriptive alt text** for accessibility
3. **Set meaningful primary images** that represent the product well
4. **Upload multiple angles** to show product details
5. **Keep file sizes reasonable** (under 5MB each)

### For Developers
1. **Always handle loading states** when querying images
2. **Provide fallbacks** for products without images
3. **Optimize image loading** with proper lazy loading
4. **Use semantic alt text** for accessibility
5. **Test on multiple devices** for responsive behavior

## Troubleshooting

### Common Issues

1. **Images not uploading**
   - Check file size (max 5MB)
   - Verify file format (PNG, JPG, GIF only)
   - Ensure stable internet connection

2. **Primary image not displaying**
   - Verify at least one image is marked as primary
   - Check if product has any images uploaded

3. **Gallery not working**
   - Ensure product has multiple images
   - Check JavaScript console for errors

### Error Messages

- **"File too large"**: Reduce image file size below 5MB
- **"Invalid file type"**: Use PNG, JPG, or GIF formats only
- **"Upload failed"**: Check internet connection and try again

## Future Enhancements

Planned improvements include:
- Image optimization and resizing
- Bulk image operations
- Image variations (zoom, 360° view)
- AI-powered alt text generation
- Image SEO optimization 