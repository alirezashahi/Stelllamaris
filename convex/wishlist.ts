import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user's wishlist items with product details
 */
export const getUserWishlist = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("wishlistItems"),
    _creationTime: v.number(),
    userId: v.id("users"),
    productId: v.id("products"),
    productName: v.string(),
    productSlug: v.string(),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    primaryImageUrl: v.optional(v.string()),
    sustainabilityScore: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const wishlistItems = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const itemsWithProductDetails = await Promise.all(
      wishlistItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;

        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: item._id,
          _creationTime: item._creationTime,
          userId: item.userId,
          productId: product._id,
          productName: product.name,
          productSlug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          primaryImageUrl: primaryImage?.imageUrl,
          sustainabilityScore: product.sustainabilityScore,
        };
      })
    );

    return itemsWithProductDetails.filter(item => item !== null) as any[];
  },
});

/**
 * Check if a product is in user's wishlist
 */
export const isProductInWishlist = query({
  args: { 
    userId: v.id("users"),
    productId: v.id("products")
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_and_product", (q) => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .unique();

    return !!item;
  },
});

/**
 * Add product to wishlist
 */
export const addToWishlist = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  returns: v.id("wishlistItems"),
  handler: async (ctx, args) => {
    // Check if item already exists
    const existingItem = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_and_product", (q) => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .unique();

    if (existingItem) {
      throw new Error("Product is already in wishlist");
    }

    // Verify product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const wishlistItemId = await ctx.db.insert("wishlistItems", {
      userId: args.userId,
      productId: args.productId,
    });

    return wishlistItemId;
  },
});

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_and_product", (q) => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .unique();

    if (!item) {
      throw new Error("Product not found in wishlist");
    }

    await ctx.db.delete(item._id);
    return null;
  },
});

/**
 * Toggle product in/out of wishlist
 */
export const toggleWishlist = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  returns: v.object({
    added: v.boolean(),
    itemId: v.optional(v.id("wishlistItems")),
  }),
  handler: async (ctx, args) => {
    const existingItem = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_and_product", (q) => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .unique();

    if (existingItem) {
      // Remove from wishlist
      await ctx.db.delete(existingItem._id);
      return { added: false };
    } else {
      // Add to wishlist
      const product = await ctx.db.get(args.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const itemId = await ctx.db.insert("wishlistItems", {
        userId: args.userId,
        productId: args.productId,
      });

      return { added: true, itemId };
    }
  },
}); 