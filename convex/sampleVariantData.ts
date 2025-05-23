import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add sample variants to existing products for testing
 * This should be run once to populate variant data
 */
export const addSampleVariants = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get all products
    const products = await ctx.db.query("products").collect();
    
    if (products.length === 0) {
      console.log("No products found to add variants to");
      return null;
    }

    // Add color variants to the first few products
    for (let i = 0; i < Math.min(3, products.length); i++) {
      const product = products[i];
      
      // Add color variants
      await ctx.db.insert("productVariants", {
        productId: product._id,
        name: "Black",
        type: "color",
        value: "black",
        priceAdjustment: 0,
        stockQuantity: 15,
        sku: `${product.sku}-COLOR-BLACK`,
      });

      await ctx.db.insert("productVariants", {
        productId: product._id,
        name: "Brown",
        type: "color",
        value: "brown",
        priceAdjustment: 25,
        stockQuantity: 12,
        sku: `${product.sku}-COLOR-BROWN`,
      });

      await ctx.db.insert("productVariants", {
        productId: product._id,
        name: "Red",
        type: "color",
        value: "red",
        priceAdjustment: 50,
        stockQuantity: 8,
        sku: `${product.sku}-COLOR-RED`,
      });

      // Add size variants
      await ctx.db.insert("productVariants", {
        productId: product._id,
        name: "Small",
        type: "size",
        value: "small",
        priceAdjustment: -20,
        stockQuantity: 10,
        sku: `${product.sku}-SIZE-SMALL`,
      });

      await ctx.db.insert("productVariants", {
        productId: product._id,
        name: "Medium",
        type: "size",
        value: "medium",
        priceAdjustment: 0,
        stockQuantity: 20,
        sku: `${product.sku}-SIZE-MEDIUM`,
      });

      await ctx.db.insert("productVariants", {
        productId: product._id,
        name: "Large",
        type: "size",
        value: "large",
        priceAdjustment: 30,
        stockQuantity: 15,
        sku: `${product.sku}-SIZE-LARGE`,
      });
    }

    console.log(`Added variants to ${Math.min(3, products.length)} products`);
    return null;
  },
});

/**
 * Clean up sample variants (for testing)
 */
export const removeSampleVariants = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const variants = await ctx.db.query("productVariants").collect();
    
    for (const variant of variants) {
      // Delete associated images first
      const variantImages = await ctx.db
        .query("productImages")
        .withIndex("by_variant_id", (q) => q.eq("variantId", variant._id))
        .collect();
      
      for (const image of variantImages) {
        await ctx.db.delete(image._id);
      }
      
      // Delete the variant
      await ctx.db.delete(variant._id);
    }

    console.log(`Removed ${variants.length} variants and their images`);
    return null;
  },
}); 