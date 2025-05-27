import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate upload URL for product images
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save uploaded file information to product images
 */
export const saveProductImage = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    storageId: v.id("_storage"),
    altText: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
  },
  returns: v.id("productImages"),
  handler: async (ctx, args) => {
    // Get the file URL
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    // Get existing images for this product/variant to determine sort order
    const query = ctx.db
      .query("productImages")
      .withIndex("by_product_and_variant", (q) => 
        q.eq("productId", args.productId).eq("variantId", args.variantId)
      );
    
    const existingImages = await query.collect();

    // If this is set as primary, remove primary from other images in the same variant scope
    if (args.isPrimary) {
      for (const image of existingImages) {
        if (image.isPrimary) {
          await ctx.db.patch(image._id, { isPrimary: false });
        }
      }
    }

    // Create the product image record
    const imageId = await ctx.db.insert("productImages", {
      productId: args.productId,
      variantId: args.variantId,
      imageUrl: fileUrl,
      altText: args.altText || `${args.variantId ? 'Variant' : 'Product'} image ${existingImages.length + 1}`,
      sortOrder: existingImages.length + 1,
      isPrimary: args.isPrimary || existingImages.length === 0, // First image is primary by default
    });

    return imageId;
  },
});

/**
 * Delete a product image
 */
export const deleteProductImage = mutation({
  args: {
    imageId: v.id("productImages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    // TODO: Add admin role check when authentication is fully implemented
    
    await ctx.db.delete(args.imageId);

    // If this was the primary image, make another image in the same variant scope primary
    if (image.isPrimary) {
      const remainingImages = await ctx.db
        .query("productImages")
        .withIndex("by_product_and_variant", (q) => 
          q.eq("productId", image.productId).eq("variantId", image.variantId)
        )
        .collect();

      if (remainingImages.length > 0) {
        const firstImage = remainingImages.sort((a, b) => a.sortOrder - b.sortOrder)[0];
        await ctx.db.patch(firstImage._id, { isPrimary: true });
      }
    }

    return null;
  },
});

/**
 * Update image order and primary status
 */
export const updateProductImageOrder = mutation({
  args: {
    imageId: v.id("productImages"),
    sortOrder: v.number(),
    isPrimary: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    // TODO: Add admin role check when authentication is fully implemented

    // If setting as primary, remove primary from other images in the same variant scope
    if (args.isPrimary) {
      const existingImages = await ctx.db
        .query("productImages")
        .withIndex("by_product_and_variant", (q) => 
          q.eq("productId", image.productId).eq("variantId", image.variantId)
        )
        .collect();

      for (const otherImage of existingImages) {
        if (otherImage._id !== args.imageId && otherImage.isPrimary) {
          await ctx.db.patch(otherImage._id, { isPrimary: false });
        }
      }
    }

    const updates: any = { sortOrder: args.sortOrder };
    if (args.isPrimary !== undefined) {
      updates.isPrimary = args.isPrimary;
    }

    await ctx.db.patch(args.imageId, updates);
    return null;
  },
});

/**
 * Save uploaded file as review image
 */
export const saveReviewImage = mutation({
  args: {
    storageId: v.id("_storage"),
    altText: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Get the file URL
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    return fileUrl;
  },
});

/**
 * Save uploaded file as return evidence image
 */
export const saveReturnEvidenceImage = mutation({
  args: {
    storageId: v.id("_storage"),
    altText: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Get the file URL
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    return fileUrl;
  },
});

/**
 * Save uploaded file as return message attachment
 */
export const saveReturnMessageAttachment = mutation({
  args: {
    storageId: v.id("_storage"),
    altText: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Get the file URL
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    return fileUrl;
  },
}); 