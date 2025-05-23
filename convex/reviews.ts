import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Get all approved reviews for a product
 */
export const getProductReviews = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("reviews"),
    _creationTime: v.number(),
    productId: v.id("products"),
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    rating: v.number(),
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
    isVerifiedPurchase: v.boolean(),
    isApproved: v.boolean(),
    userName: v.string(),
    adminResponse: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("isApproved"), true))
      .order("desc")
      .take(args.limit || 50);

    const reviewsWithUserNames = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          userName: user?.name || "Anonymous",
        };
      })
    );

    return reviewsWithUserNames;
  },
});

/**
 * Get review statistics for a product
 */
export const getProductReviewStats = query({
  args: {
    productId: v.id("products"),
  },
  returns: v.object({
    averageRating: v.number(),
    totalReviews: v.number(),
    ratingDistribution: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("isApproved"), true))
      .collect();

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating.toString()]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  },
});

/**
 * Check if user can review a product (has purchased it)
 */
export const canUserReviewProduct = query({
  args: {
    productId: v.id("products"),
    clerkUserId: v.string(),
  },
  returns: v.object({
    canReview: v.boolean(),
    hasExistingReview: v.boolean(),
    hasPurchased: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get Convex user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) {
      return {
        canReview: false,
        hasExistingReview: false,
        hasPurchased: false,
      };
    }

    // Check if user has already reviewed this product
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    // Check if user has purchased this product (check orders directly since we store items there)
    const userOrders = await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.or(q.eq(q.field("status"), "delivered"), q.eq(q.field("status"), "confirmed")))
      .collect();

    let hasPurchased = false;
    for (const order of userOrders) {
      // Check if any order items contain this product
      const orderItems = await ctx.db
        .query("orderItems")
        .withIndex("by_order_id", (q) => q.eq("orderId", order._id))
        .filter((q) => q.eq(q.field("productId"), args.productId))
        .take(1);
      
      if (orderItems.length > 0) {
        hasPurchased = true;
        break;
      }
    }

    return {
      canReview: hasPurchased && !existingReview,
      hasExistingReview: !!existingReview,
      hasPurchased,
    };
  },
});

/**
 * Submit a new review
 */
export const submitReview = mutation({
  args: {
    productId: v.id("products"),
    clerkUserId: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
  },
  returns: v.id("reviews"),
  handler: async (ctx, args) => {
    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Get or create Convex user from Clerk ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) {
      throw new Error("User not found. Please sign in again.");
    }

    // Check if user can review this product
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // Check if user has purchased this product (check orders directly)
    const userOrders = await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.or(q.eq(q.field("status"), "delivered"), q.eq(q.field("status"), "confirmed")))
      .collect();

    let purchaseOrder: any = undefined;
    let isVerifiedPurchase = false;

    for (const order of userOrders) {
      const orderItems = await ctx.db
        .query("orderItems")
        .withIndex("by_order_id", (q) => q.eq("orderId", order._id))
        .filter((q) => q.eq(q.field("productId"), args.productId))
        .take(1);
      
      if (orderItems.length > 0) {
        purchaseOrder = order._id;
        isVerifiedPurchase = true;
        break;
      }
    }

    if (!isVerifiedPurchase) {
      throw new Error("You can only review products you have purchased and received");
    }

    // Create the review
    const reviewId = await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: user._id,
      orderId: purchaseOrder,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      isVerifiedPurchase,
      isApproved: true, // Auto-approve for now; could add moderation later
    });

    // Update product's average rating and review count
    await updateProductRatingStats(ctx, args.productId);

    return reviewId;
  },
});

/**
 * Update a review (only by the author)
 */
export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    userId: v.id("users"),
    rating: v.optional(v.number()),
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== args.userId) {
      throw new Error("You can only update your own reviews");
    }

    if (args.rating && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    const updates: Partial<typeof review> = {};
    if (args.rating !== undefined) updates.rating = args.rating;
    if (args.title !== undefined) updates.title = args.title;
    if (args.comment !== undefined) updates.comment = args.comment;

    await ctx.db.patch(args.reviewId, updates);

    // Update product's average rating if rating changed
    if (args.rating !== undefined) {
      await updateProductRatingStats(ctx, review.productId);
    }

    return null;
  },
});

/**
 * Delete a review (only by the author)
 */
export const deleteReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== args.userId) {
      throw new Error("You can only delete your own reviews");
    }

    const productId = review.productId;
    await ctx.db.delete(args.reviewId);

    // Update product's average rating
    await updateProductRatingStats(ctx, productId);

    return null;
  },
});

/**
 * Helper function to update product rating statistics
 */
async function updateProductRatingStats(
  ctx: MutationCtx,
  productId: Id<"products">
) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_product_id", (q) => q.eq("productId", productId))
    .filter((q) => q.eq(q.field("isApproved"), true))
    .collect();

  const totalReviews = reviews.length;
  let averageRating = 0;

  if (totalReviews > 0) {
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    averageRating = totalRating / totalReviews;
  }

  await ctx.db.patch(productId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  });
} 