import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Helper function to check if user can request return for an order
 */
const canRequestReturn = (order: any): { canReturn: boolean; reason?: string } => {
  // Check if order is delivered
  if (order.status !== "delivered") {
    return { canReturn: false, reason: "Order must be delivered to request a return" };
  }

  // Check if order is within return window (30 days for domestic)
  const deliveredDate = order.deliveredAt || order._creationTime;
  const daysSinceDelivery = (Date.now() - deliveredDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceDelivery > 30) {
    return { canReturn: false, reason: "Return window has expired (30 days)" };
  }

  return { canReturn: true };
};

/**
 * Get return requests for a user
 */
export const getUserReturnRequests = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("returnRequests"),
    _creationTime: v.number(),
    orderId: v.id("orders"),
    orderNumber: v.string(),
    type: v.string(),
    reason: v.string(),
    description: v.string(),
    status: v.string(),
    requestedAmount: v.optional(v.number()),
    approvedAmount: v.optional(v.number()),
    rmaNumber: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    returnItems: v.array(v.object({
      orderItemIndex: v.number(),
      quantity: v.number(),
      reason: v.string(),
    })),
  })),
  handler: async (ctx, args) => {
    const returnRequests = await ctx.db
      .query("returnRequests")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    // Enrich with order information
    const enrichedRequests = await Promise.all(
      returnRequests.map(async (request) => {
        const order = await ctx.db.get(request.orderId);
        return {
          _id: request._id,
          _creationTime: request._creationTime,
          orderId: request.orderId,
          orderNumber: order?.orderNumber || "Unknown",
          type: request.type,
          reason: request.reason,
          description: request.description,
          status: request.status,
          requestedAmount: request.requestedAmount,
          approvedAmount: request.approvedAmount,
          rmaNumber: request.rmaNumber,
          submittedAt: request.submittedAt,
          reviewedAt: request.reviewedAt,
          completedAt: request.completedAt,
          returnItems: request.returnItems,
        };
      })
    );

    return enrichedRequests;
  },
});

/**
 * Check if user can request return for a specific order
 */
export const canRequestReturnForOrder = query({
  args: { 
    orderId: v.id("orders"),
    userId: v.id("users")
  },
  returns: v.object({
    canReturn: v.boolean(),
    reason: v.optional(v.string()),
    existingRequest: v.optional(v.id("returnRequests")),
  }),
  handler: async (ctx, args) => {
    // Get the order
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== args.userId) {
      return { canReturn: false, reason: "Order not found or access denied" };
    }

    // Check if there's already an active return request
    const existingRequest = await ctx.db
      .query("returnRequests")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "approved"),
          q.eq(q.field("status"), "processing")
        )
      )
      .first();

    if (existingRequest) {
      return { 
        canReturn: false, 
        reason: "Return request already exists for this order",
        existingRequest: existingRequest._id
      };
    }

    // Check return eligibility
    const eligibility = canRequestReturn(order);
    return {
      canReturn: eligibility.canReturn,
      reason: eligibility.reason,
    };
  },
});

/**
 * Create a new return request
 */
export const createReturnRequest = mutation({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    type: v.union(v.literal("return"), v.literal("exchange"), v.literal("refund"), v.literal("dispute")),
    reason: v.union(
      v.literal("defective"),
      v.literal("wrong_item"),
      v.literal("not_as_described"),
      v.literal("change_of_mind"),
      v.literal("damaged_in_shipping"),
      v.literal("size_issue"),
      v.literal("quality_issue"),
      v.literal("other")
    ),
    description: v.string(),
    returnItems: v.array(v.object({
      orderItemIndex: v.number(),
      quantity: v.number(),
      reason: v.string(),
    })),
    requestedAmount: v.optional(v.number()),
    evidenceUrls: v.optional(v.array(v.string())),
  },
  returns: v.id("returnRequests"),
  handler: async (ctx, args) => {
    // Verify order exists and belongs to user
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== args.userId) {
      throw new Error("Order not found or access denied");
    }

    // Check return eligibility
    const eligibility = canRequestReturn(order);
    if (!eligibility.canReturn) {
      throw new Error(eligibility.reason || "Return not allowed");
    }

    // Check for existing active return request
    const existingRequest = await ctx.db
      .query("returnRequests")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "approved"),
          q.eq(q.field("status"), "processing")
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("Return request already exists for this order");
    }

    // Generate RMA number
    const rmaNumber = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create return request
    const returnRequestId = await ctx.db.insert("returnRequests", {
      orderId: args.orderId,
      userId: args.userId,
      type: args.type,
      reason: args.reason,
      description: args.description,
      status: "pending",
      requestedAmount: args.requestedAmount,
      rmaNumber,
      returnItems: args.returnItems,
      evidenceUrls: args.evidenceUrls,
      submittedAt: Date.now(),
    });

    return returnRequestId;
  },
});

/**
 * Get all return requests for admin management
 */
export const getAllReturnRequests = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("returnRequests"),
    _creationTime: v.number(),
    orderId: v.id("orders"),
    orderNumber: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    type: v.string(),
    reason: v.string(),
    description: v.string(),
    status: v.string(),
    requestedAmount: v.optional(v.number()),
    approvedAmount: v.optional(v.number()),
    rmaNumber: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    returnItems: v.array(v.object({
      orderItemIndex: v.number(),
      quantity: v.number(),
      reason: v.string(),
    })),
    evidenceUrls: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    let returnRequests;
    
    if (args.status && args.status !== "all") {
      returnRequests = await ctx.db
        .query("returnRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .take(args.limit || 50);
    } else {
      returnRequests = await ctx.db
        .query("returnRequests")
        .order("desc")
        .take(args.limit || 50);
    }

    // Enrich with order and user information
    const enrichedRequests = await Promise.all(
      returnRequests.map(async (request) => {
        const order = await ctx.db.get(request.orderId);
        const user = await ctx.db.get(request.userId);
        
        return {
          _id: request._id,
          _creationTime: request._creationTime,
          orderId: request.orderId,
          orderNumber: order?.orderNumber || "Unknown",
          userEmail: user?.email || order?.email || "Unknown",
          userName: user?.name || "Unknown",
          type: request.type,
          reason: request.reason,
          description: request.description,
          status: request.status,
          requestedAmount: request.requestedAmount,
          approvedAmount: request.approvedAmount,
          rmaNumber: request.rmaNumber,
          submittedAt: request.submittedAt,
          reviewedAt: request.reviewedAt,
          completedAt: request.completedAt,
          returnItems: request.returnItems,
          evidenceUrls: request.evidenceUrls,
        };
      })
    );

    return enrichedRequests;
  },
});

/**
 * Update return request status (admin only)
 */
export const updateReturnRequestStatus = mutation({
  args: {
    returnRequestId: v.id("returnRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    approvedAmount: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  },
  returns: v.id("returnRequests"),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const updateData: any = {
      status: args.status,
    };

    if (args.approvedAmount !== undefined) {
      updateData.approvedAmount = args.approvedAmount;
    }

    if (args.adminNotes !== undefined) {
      updateData.adminNotes = args.adminNotes;
    }

    if (args.trackingNumber !== undefined) {
      updateData.trackingNumber = args.trackingNumber;
    }

    // Add timestamps based on status
    if (args.status === "approved" || args.status === "rejected") {
      updateData.reviewedAt = Date.now();
    }

    if (args.status === "completed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(args.returnRequestId, updateData);
    return args.returnRequestId;
  },
});

/**
 * Cancel return request (user)
 */
export const cancelReturnRequest = mutation({
  args: {
    returnRequestId: v.id("returnRequests"),
    userId: v.id("users"),
  },
  returns: v.id("returnRequests"),
  handler: async (ctx, args) => {
    const returnRequest = await ctx.db.get(args.returnRequestId);
    
    if (!returnRequest || returnRequest.userId !== args.userId) {
      throw new Error("Return request not found or access denied");
    }

    if (returnRequest.status !== "pending") {
      throw new Error("Can only cancel pending return requests");
    }

    await ctx.db.patch(args.returnRequestId, {
      status: "cancelled",
      completedAt: Date.now(),
    });

    return args.returnRequestId;
  },
}); 