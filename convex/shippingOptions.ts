import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get shipping options for a specific product
 */
export const getProductShippingOptions = query({
  args: { productId: v.id("products") },
  returns: v.array(v.object({
    _id: v.id("productShippingOptions"),
    _creationTime: v.number(),
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    estimatedDays: v.object({
      min: v.number(),
      max: v.number(),
    }),
    isActive: v.boolean(),
    sortOrder: v.number(),
    carrier: v.optional(v.string()),
    serviceType: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const shippingOptions = await ctx.db
      .query("productShippingOptions")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return shippingOptions.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get all shipping options for a product (admin view)
 */
export const getAllProductShippingOptions = query({
  args: { productId: v.id("products") },
  returns: v.array(v.object({
    _id: v.id("productShippingOptions"),
    _creationTime: v.number(),
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    estimatedDays: v.object({
      min: v.number(),
      max: v.number(),
    }),
    isActive: v.boolean(),
    sortOrder: v.number(),
    carrier: v.optional(v.string()),
    serviceType: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const shippingOptions = await ctx.db
      .query("productShippingOptions")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .collect();

    return shippingOptions.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Create a new shipping option for a product (admin only)
 */
export const createProductShippingOption = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    estimatedDays: v.object({
      min: v.number(),
      max: v.number(),
    }),
    carrier: v.optional(v.string()),
    serviceType: v.optional(v.string()),
  },
  returns: v.id("productShippingOptions"),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Get the current max sort order for this product
    const existingOptions = await ctx.db
      .query("productShippingOptions")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .collect();
    
    const maxSortOrder = existingOptions.length > 0 
      ? Math.max(...existingOptions.map(opt => opt.sortOrder))
      : 0;

    const shippingOptionId = await ctx.db.insert("productShippingOptions", {
      productId: args.productId,
      name: args.name,
      description: args.description,
      price: args.price,
      estimatedDays: args.estimatedDays,
      isActive: true,
      sortOrder: maxSortOrder + 1,
      carrier: args.carrier,
      serviceType: args.serviceType,
    });

    return shippingOptionId;
  },
});

/**
 * Update a shipping option (admin only)
 */
export const updateProductShippingOption = mutation({
  args: {
    shippingOptionId: v.id("productShippingOptions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    estimatedDays: v.optional(v.object({
      min: v.number(),
      max: v.number(),
    })),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    carrier: v.optional(v.string()),
    serviceType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const { shippingOptionId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(shippingOptionId, cleanUpdates);
    }

    return null;
  },
});

/**
 * Delete a shipping option (admin only)
 */
export const deleteProductShippingOption = mutation({
  args: { shippingOptionId: v.id("productShippingOptions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    await ctx.db.delete(args.shippingOptionId);
    return null;
  },
});

/**
 * Reorder shipping options (admin only)
 */
export const reorderShippingOptions = mutation({
  args: {
    productId: v.id("products"),
    orderedIds: v.array(v.id("productShippingOptions")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Update sort order for each shipping option
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        sortOrder: i + 1,
      });
    }

    return null;
  },
});

/**
 * Create default shipping options for a new product (admin only)
 */
export const createDefaultShippingOptions = mutation({
  args: { productId: v.id("products") },
  returns: v.array(v.id("productShippingOptions")),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const defaultOptions = [
      {
        name: "Standard Shipping",
        description: "5-7 business days",
        price: 500, // $5.00
        estimatedDays: { min: 5, max: 7 },
        carrier: "USPS",
        serviceType: "Ground",
        sortOrder: 1,
      },
      {
        name: "Express Shipping",
        description: "2-3 business days",
        price: 1200, // $12.00
        estimatedDays: { min: 2, max: 3 },
        carrier: "UPS",
        serviceType: "2-Day",
        sortOrder: 2,
      },
      {
        name: "Overnight Shipping",
        description: "1 business day",
        price: 2500, // $25.00
        estimatedDays: { min: 1, max: 1 },
        carrier: "FedEx",
        serviceType: "Overnight",
        sortOrder: 3,
      },
    ];

    const createdIds = [];
    for (const option of defaultOptions) {
      const id = await ctx.db.insert("productShippingOptions", {
        productId: args.productId,
        name: option.name,
        description: option.description,
        price: option.price,
        estimatedDays: option.estimatedDays,
        isActive: true,
        sortOrder: option.sortOrder,
        carrier: option.carrier,
        serviceType: option.serviceType,
      });
      createdIds.push(id);
    }

    return createdIds;
  },
}); 