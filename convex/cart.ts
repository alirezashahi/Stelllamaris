import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get Convex user ID from Clerk user ID
async function getConvexUserId(ctx: any, clerkUserId: string) {
  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkUserId"), clerkUserId))
    .unique();
  
  return user?._id;
}

// Guest cart item validator for frontend integration
const guestCartItemValidator = v.object({
  productId: v.id("products"),
  productName: v.string(),
  productSlug: v.string(),
  variant: v.optional(v.object({
    id: v.string(),
    name: v.string(),
    priceAdjustment: v.number(),
  })),
  quantity: v.number(),
  basePrice: v.number(),
  imageUrl: v.optional(v.string()),
});

/**
 * Get or create user's cart
 */
export const getOrCreateUserCart = mutation({
  args: { userId: v.id("users") },
  returns: v.id("carts"),
  handler: async (ctx, args) => {
    // Look for existing active cart
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!cart) {
      // Create new cart (expires in 30 days)
      const cartId = await ctx.db.insert("carts", {
        userId: args.userId,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      });
      return cartId;
    }

    return cart._id;
  },
});

/**
 * Get user's cart with product details
 */
export const getUserCart = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("cartItems"),
    _creationTime: v.number(),
    productId: v.id("products"),
    productName: v.string(),
    productSlug: v.string(),
    variant: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      priceAdjustment: v.number(),
    })),
    quantity: v.number(),
    basePrice: v.number(),
    imageUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get user's active cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!cart) {
      return [];
    }

    // Get cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart_id", (q) => q.eq("cartId", cart._id))
      .collect();

    // Enrich with product details
    const enrichedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;

    let variant = undefined as
      | { id: any; name: string; priceAdjustment: number }
      | undefined;
        if (item.variantId) {
          const productVariant = await ctx.db.get(item.variantId);
          if (productVariant) {
            variant = {
              id: productVariant._id,
              name: productVariant.name,
              priceAdjustment: productVariant.priceAdjustment,
            };
          }
        }

        // Get primary image
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: item._id,
          _creationTime: item._creationTime,
          productId: product._id,
          productName: product.name,
          productSlug: product.slug,
          variant,
          quantity: item.quantity,
          basePrice: product.salePrice || product.basePrice,
          imageUrl: primaryImage?.imageUrl,
        };
      })
    );

    return enrichedItems.filter(item => item !== null) as any[];
  },
});

/**
 * Add item to user's cart
 */
export const addToUserCart = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    quantity: v.number(),
  },
  returns: v.id("cartItems"),
  handler: async (ctx, args) => {
    // Get or create user's cart
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!cart) {
      // Create new cart (expires in 30 days)
      const cartId = await ctx.db.insert("carts", {
        userId: args.userId,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      });
      cart = await ctx.db.get(cartId);
      if (!cart) throw new Error("Failed to create cart");
    }

    // Get product to get current price
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let priceAtTime = product.salePrice || product.basePrice;
    
    // Add variant price adjustment if applicable
    if (args.variantId) {
      const variant = await ctx.db.get(args.variantId);
      if (variant) {
        priceAtTime += variant.priceAdjustment;
      }
    }

    // Check if item already exists in cart
    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_cart_id", (q) => q.eq("cartId", cart._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("productId"), args.productId),
          args.variantId 
            ? q.eq(q.field("variantId"), args.variantId)
            : q.eq(q.field("variantId"), undefined)
        )
      )
      .unique();

    if (existingItem) {
      // Update existing item quantity
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + args.quantity,
      });
      return existingItem._id;
    } else {
      // Create new cart item
      const cartItemId = await ctx.db.insert("cartItems", {
        cartId: cart._id,
        productId: args.productId,
        variantId: args.variantId,
        quantity: args.quantity,
        priceAtTime,
      });
      return cartItemId;
    }
  },
});

/**
 * Sync guest cart to user cart when user logs in
 */
export const syncGuestCart = mutation({
  args: {
    clerkUserId: v.string(), // Use Clerk user ID instead of Convex user ID
    guestCartItems: v.array(guestCartItemValidator),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    if (!convexUserId) {
      throw new Error("User not found");
    }

    if (args.guestCartItems.length === 0) {
      return null;
    }

    // Get or create user's cart
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_user_id", (q) => q.eq("userId", convexUserId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!cart) {
      // Create new cart (expires in 30 days)
      const cartId = await ctx.db.insert("carts", {
        userId: convexUserId,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      });
      cart = await ctx.db.get(cartId);
      if (!cart) throw new Error("Failed to create cart");
    }

    // Process each guest cart item
    for (const guestItem of args.guestCartItems) {
      // Get product to validate and get current price
      const product = await ctx.db.get(guestItem.productId);
      if (!product) continue; // Skip invalid products

      let priceAtTime = product.salePrice || product.basePrice;
      let variantId = undefined;

      // Handle variant if present
      if (guestItem.variant) {
        // Find variant by matching the guest variant data
        const variant = await ctx.db
          .query("productVariants")
          .withIndex("by_product_id", (q) => q.eq("productId", guestItem.productId))
          .filter((q) => q.eq(q.field("name"), guestItem.variant!.name))
          .first();

        if (variant) {
          variantId = variant._id;
          priceAtTime += variant.priceAdjustment;
        }
      }

      // Check if item already exists in user's cart
      const existingItem = await ctx.db
        .query("cartItems")
        .withIndex("by_cart_id", (q) => q.eq("cartId", cart._id))
        .filter((q) => 
          q.and(
            q.eq(q.field("productId"), guestItem.productId),
            variantId 
              ? q.eq(q.field("variantId"), variantId)
              : q.eq(q.field("variantId"), undefined)
          )
        )
        .unique();

      if (existingItem) {
        // Update existing item quantity (add guest quantity to existing)
        await ctx.db.patch(existingItem._id, {
          quantity: existingItem.quantity + guestItem.quantity,
        });
      } else {
        // Create new cart item
        await ctx.db.insert("cartItems", {
          cartId: cart._id,
          productId: guestItem.productId,
          variantId,
          quantity: guestItem.quantity,
          priceAtTime,
        });
      }
    }

    return "Guest cart synced successfully";
  },
});

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { cartItemId, quantity } = args;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await ctx.db.delete(cartItemId);
    } else {
      // Update quantity
      await ctx.db.patch(cartItemId, { quantity });
    }

    return null;
  },
});

/**
 * Remove item from cart
 */
export const removeFromUserCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cartItemId);
    return null;
  },
});

/**
 * Clear user's entire cart
 */
export const clearUserCart = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get user's active cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!cart) {
      return null;
    }

    // Delete all cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart_id", (q) => q.eq("cartId", cart._id))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return null;
  },
});

/**
 * Get cart summary (total items and price) for a user
 */
export const getCartSummary = query({
  args: { userId: v.id("users") },
  returns: v.object({
    totalItems: v.number(),
    totalPrice: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get user's active cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!cart) {
      return { totalItems: 0, totalPrice: 0 };
    }

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart_id", (q) => q.eq("cartId", cart._id))
      .collect();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + (item.priceAtTime * item.quantity);
    }, 0);

    return { totalItems, totalPrice };
  },
}); 