import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Get all active promo codes (admin only)
 */
export const getAllPromoCodes = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("promoCodes"),
    _creationTime: v.number(),
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed_amount"), v.literal("free_shipping")),
    value: v.number(),
    isActive: v.boolean(),
    validFrom: v.number(),
    validUntil: v.number(),
    minimumOrderAmount: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    currentUsageCount: v.number(),
    maxUsagePerUser: v.optional(v.number()),
    applicableProductIds: v.optional(v.array(v.id("products"))),
    applicableCategoryIds: v.optional(v.array(v.id("categories"))),
  })),
  handler: async (ctx) => {
    // TODO: Add admin role check when authentication is fully implemented
    return await ctx.db.query("promoCodes").order("desc").collect();
  },
});

/**
 * Validate and get promo code details for checkout
 */
export const validatePromoCode = query({
  args: {
    code: v.string(),
    subtotal: v.number(),
    userId: v.optional(v.string()), // Clerk user ID
    productIds: v.optional(v.array(v.id("products"))),
  },
  returns: v.union(
    v.object({
      isValid: v.literal(true),
      promoCode: v.object({
        _id: v.id("promoCodes"),
        code: v.string(),
        type: v.union(v.literal("percentage"), v.literal("fixed_amount"), v.literal("free_shipping")),
        value: v.number(),
        minimumOrderAmount: v.optional(v.number()),
      }),
      discountAmount: v.number(),
      finalAmount: v.number(),
    }),
    v.object({
      isValid: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args): Promise<
    | {
        isValid: true;
        promoCode: {
          _id: Id<"promoCodes">;
          code: string;
          type: "percentage" | "fixed_amount" | "free_shipping";
          value: number;
          minimumOrderAmount?: number;
        };
        discountAmount: number;
        finalAmount: number;
      }
    | { isValid: false; error: string }
  > => {
    // Find promo code by code
    const promoCode = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!promoCode) {
      return { isValid: false, error: "Invalid promo code" };
    }

    // Check if active
    if (!promoCode.isActive) {
      return { isValid: false, error: "This promo code is no longer active" };
    }

    // Check date validity
    const now = Date.now();
    if (now < promoCode.validFrom) {
      return { isValid: false, error: "This promo code is not yet valid" };
    }
    if (now > promoCode.validUntil) {
      return { isValid: false, error: "This promo code has expired" };
    }

    // Check minimum order amount
    if (promoCode.minimumOrderAmount && args.subtotal < promoCode.minimumOrderAmount) {
      return { 
        isValid: false, 
        error: `Minimum order amount of $${promoCode.minimumOrderAmount!.toFixed(2)} required` 
      };
    }

    // Check maximum usage count
    if (promoCode.maxUsageCount && promoCode.currentUsageCount >= promoCode.maxUsageCount) {
      return { isValid: false, error: "This promo code has reached its usage limit" };
    }

    // Check user usage limit
    if (args.userId && promoCode.maxUsagePerUser) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.userId!))
        .unique();

      if (user) {
        const userUsage = await ctx.db
          .query("promoCodeUsage")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("promoCodeId"), promoCode._id))
          .collect();

        if (userUsage.length >= promoCode.maxUsagePerUser) {
          return { 
            isValid: false, 
            error: "You have reached the usage limit for this promo code" 
          };
        }
      }
    }

    // Check product/category applicability
    if (promoCode.applicableProductIds && args.productIds) {
      const hasApplicableProduct = args.productIds.some(productId => 
        promoCode.applicableProductIds!.includes(productId)
      );
      if (!hasApplicableProduct) {
        return { 
          isValid: false, 
          error: "This promo code is not applicable to items in your cart" 
        };
      }
    }

    if (promoCode.applicableCategoryIds && args.productIds) {
      // Check if any cart products are in applicable categories
      const products = await Promise.all(
        args.productIds.map(id => ctx.db.get(id))
      );
      const hasApplicableCategory = products.some(product => 
        product && promoCode.applicableCategoryIds!.includes(product.categoryId)
      );
      if (!hasApplicableCategory) {
        return { 
          isValid: false, 
          error: "This promo code is not applicable to items in your cart" 
        };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let finalAmount = args.subtotal;

    switch (promoCode.type) {
      case "percentage":
        discountAmount = Math.round((args.subtotal * promoCode.value / 100) * 100) / 100;
        finalAmount = args.subtotal - discountAmount;
        break;
      case "fixed_amount":
        discountAmount = Math.min(promoCode.value, args.subtotal);
        finalAmount = args.subtotal - discountAmount;
        break;
      case "free_shipping":
        // Free shipping doesn't affect subtotal, handled separately
        discountAmount = 0;
        finalAmount = args.subtotal;
        break;
    }

    return {
      isValid: true,
      promoCode: {
        _id: promoCode._id,
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        minimumOrderAmount: promoCode.minimumOrderAmount,
      },
      discountAmount,
      finalAmount,
    };
  },
});

/**
 * Apply promo code to an order (called during checkout)
 */
export const applyPromoCodeToOrder = mutation({
  args: {
    promoCodeId: v.id("promoCodes"),
    orderId: v.id("orders"),
    userId: v.optional(v.id("users")),
    discountAmount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update promo code usage count
    const promoCode = await ctx.db.get(args.promoCodeId);
    if (!promoCode) {
      throw new Error("Promo code not found");
    }

    await ctx.db.patch(args.promoCodeId, {
      currentUsageCount: promoCode.currentUsageCount + 1,
    });

    // Record usage
    await ctx.db.insert("promoCodeUsage", {
      promoCodeId: args.promoCodeId,
      orderId: args.orderId,
      userId: args.userId,
      discountAmount: args.discountAmount,
    });

    return null;
  },
});

/**
 * Create a new promo code (admin only)
 */
export const createPromoCode = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed_amount"), v.literal("free_shipping")),
    value: v.number(),
    validFrom: v.number(),
    validUntil: v.number(),
    minimumOrderAmount: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    maxUsagePerUser: v.optional(v.number()),
    applicableProductIds: v.optional(v.array(v.id("products"))),
    applicableCategoryIds: v.optional(v.array(v.id("categories"))),
  },
  returns: v.id("promoCodes"),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Check if code already exists
    const existingCode = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (existingCode) {
      throw new Error("Promo code already exists");
    }

    // Validate arguments
    if (args.type === "percentage" && (args.value <= 0 || args.value > 100)) {
      throw new Error("Percentage value must be between 1 and 100");
    }
    if (args.type === "fixed_amount" && args.value <= 0) {
      throw new Error("Fixed amount must be greater than 0");
    }
    if (args.validFrom >= args.validUntil) {
      throw new Error("Valid from date must be before valid until date");
    }

    return await ctx.db.insert("promoCodes", {
      code: args.code.toUpperCase(),
      type: args.type,
      value: args.value,
      isActive: true,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      minimumOrderAmount: args.minimumOrderAmount,
      maxUsageCount: args.maxUsageCount,
      currentUsageCount: 0,
      maxUsagePerUser: args.maxUsagePerUser,
      applicableProductIds: args.applicableProductIds,
      applicableCategoryIds: args.applicableCategoryIds,
    });
  },
});

/**
 * Update a promo code (admin only)
 */
export const updatePromoCode = mutation({
  args: {
    promoCodeId: v.id("promoCodes"),
    isActive: v.optional(v.boolean()),
    validUntil: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    maxUsagePerUser: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const updates: any = {};
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.validUntil !== undefined) updates.validUntil = args.validUntil;
    if (args.maxUsageCount !== undefined) updates.maxUsageCount = args.maxUsageCount;
    if (args.maxUsagePerUser !== undefined) updates.maxUsagePerUser = args.maxUsagePerUser;

    await ctx.db.patch(args.promoCodeId, updates);
    return null;
  },
});

/**
 * Delete a promo code (admin only)
 */
export const deletePromoCode = mutation({
  args: {
    promoCodeId: v.id("promoCodes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Check if promo code has been used
    const usage = await ctx.db
      .query("promoCodeUsage")
      .withIndex("by_promo_code", (q) => q.eq("promoCodeId", args.promoCodeId))
      .take(1);

    if (usage.length > 0) {
      // Don't delete, just deactivate if it has been used
      await ctx.db.patch(args.promoCodeId, { isActive: false });
    } else {
      // Safe to delete if never used
      await ctx.db.delete(args.promoCodeId);
    }

    return null;
  },
});

/**
 * Get promo code usage statistics (admin only)
 */
export const getPromoCodeStats = query({
  args: {
    promoCodeId: v.id("promoCodes"),
  },
  returns: v.object({
    totalUsage: v.number(),
    totalDiscountGiven: v.number(),
    recentUsage: v.array(v.object({
      _id: v.id("promoCodeUsage"),
      _creationTime: v.number(),
      orderId: v.id("orders"),
      discountAmount: v.number(),
      orderNumber: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const usage = await ctx.db
      .query("promoCodeUsage")
      .withIndex("by_promo_code", (q) => q.eq("promoCodeId", args.promoCodeId))
      .collect();

    const totalUsage = usage.length;
    const totalDiscountGiven = usage.reduce((sum, u) => sum + u.discountAmount, 0);

    // Get recent usage with order details
    const recentUsage = await Promise.all(
      usage.slice(-10).map(async (u) => {
        const order = await ctx.db.get(u.orderId);
        return {
          _id: u._id,
          _creationTime: u._creationTime,
          orderId: u.orderId,
          discountAmount: u.discountAmount,
          orderNumber: order?.orderNumber,
        };
      })
    );

    return {
      totalUsage,
      totalDiscountGiven,
      recentUsage: recentUsage.reverse(), // Most recent first
    };
  },
});

/**
 * Initialize predefined promo codes (run once)
 */
export const initializePredefinedPromoCodes = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000); // 1 year validity

    const predefinedCodes = [
      {
        code: "WELCOME10",
        type: "percentage" as const,
        value: 10,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 50,
        maxUsagePerUser: 1,
        maxUsageCount: 1000,
      },
      {
        code: "SAVE15",
        type: "percentage" as const,
        value: 15,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 100,
        maxUsageCount: 500,
      },
      {
        code: "FIRST20",
        type: "percentage" as const,
        value: 20,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 150,
        maxUsagePerUser: 1,
        maxUsageCount: 200,
      },
      {
        code: "STELLAMARIS",
        type: "percentage" as const,
        value: 25,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 200,
        maxUsageCount: 100,
      },
    ];

    for (const codeData of predefinedCodes) {
      // Check if already exists
      const existing = await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", codeData.code))
        .unique();

      if (!existing) {
        await ctx.db.insert("promoCodes", {
          ...codeData,
          isActive: true,
          currentUsageCount: 0,
        });
      }
    }

    return null;
  },
}); 