import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import Stripe from "stripe";

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

    // Check if there's already ANY return request for this order (user can only submit 1 return request per purchase)
    const existingRequest = await ctx.db
      .query("returnRequests")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (existingRequest) {
      return { 
        canReturn: false, 
        reason: "You have already submitted a return request for this order. Only one return request is allowed per purchase.",
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
    type: v.literal("return"), // Only allow 'return' type
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
    evidenceUrls: v.array(v.string()), // Make evidence URLs required
  },
  returns: v.id("returnRequests"),
  handler: async (ctx, args) => {
    // Verify order exists and belongs to user
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== args.userId) {
      throw new Error("Order not found or access denied");
    }

    // Validate evidence URLs are provided
    if (!args.evidenceUrls || args.evidenceUrls.length === 0) {
      throw new Error("At least one evidence image is required for return requests");
    }

    // Check return eligibility
    const eligibility = canRequestReturn(order);
    if (!eligibility.canReturn) {
      throw new Error(eligibility.reason || "Return not allowed");
    }

    // Check for existing return request (user can only submit 1 return request per purchase)
    const existingRequest = await ctx.db
      .query("returnRequests")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (existingRequest) {
      throw new Error("You have already submitted a return request for this order. Only one return request is allowed per purchase.");
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
        
        // Resolve evidence URLs from storage IDs
        let resolvedEvidenceUrls: string[] = [];
        if (request.evidenceUrls && request.evidenceUrls.length > 0) {
          resolvedEvidenceUrls = await Promise.all(
            request.evidenceUrls.map(async (url) => {
              // Check if it's a storage ID (starts with kg) or already a URL
              if (url.startsWith('kg')) {
                try {
                  const resolvedUrl = await ctx.storage.getUrl(url as any);
                  return resolvedUrl || url;
                } catch {
                  return url; // Return original if resolution fails
                }
              }
              return url; // Already a URL
            })
          );
        }
        
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
          evidenceUrls: resolvedEvidenceUrls,
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

    // If approving the return, attempt Stripe refund automatically
    if (args.status === "approved") {
      // Load the return request and its order
      const returnRequest = await ctx.db.get(args.returnRequestId);
      if (!returnRequest) {
        throw new Error("Return request not found");
      }
      const order = await ctx.db.get(returnRequest.orderId as Id<"orders">);
      if (!order) {
        throw new Error("Associated order not found");
      }

      // Only attempt refund if the order has a Stripe payment intent id
      if (order.stripePaymentIntentId) {
        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
          throw new Error("STRIPE_SECRET_KEY is not configured in Convex environment");
        }

        const stripe = new Stripe(secret);

        // Determine refund amount (in cents). If not provided, default to full order total
        const orderTotalCents = Math.round((order.totalAmount || 0) * 100);
        const approvedAmountCents = Math.round(
          (args.approvedAmount ?? returnRequest.approvedAmount ?? order.totalAmount || 0) * 100
        );
        const refundAmountCents = Math.min(approvedAmountCents || orderTotalCents, orderTotalCents);

        // Create refund (supports partial refunds)
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: refundAmountCents > 0 ? refundAmountCents : undefined,
        });

        // Persist refund metadata to the return request and possibly update the order status
        updateData.approvedAmount = (args.approvedAmount ?? returnRequest.approvedAmount ?? order.totalAmount);
        updateData.stripeRefundId = refund.id as any;

        // If full refund, mark order as refunded
        if (refundAmountCents >= orderTotalCents) {
          await ctx.db.patch(order._id as Id<"orders">, {
            paymentStatus: "refunded",
            status: "refunded",
            adminNotes: `Refunded via Stripe refund ${refund.id}`,
          } as any);
        } else {
          // For partial refunds, at least annotate the order
          const note = `Partial refund of $${(refundAmountCents / 100).toFixed(2)} via Stripe refund ${refund.id}`;
          await ctx.db.patch(order._id as Id<"orders">, {
            adminNotes: order.adminNotes ? `${order.adminNotes}\n${note}` : note,
          } as any);
        }
      }
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

/**
 * Delete return request (user - only pending requests)
 */
export const deleteReturnRequest = mutation({
  args: {
    returnRequestId: v.id("returnRequests"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const returnRequest = await ctx.db.get(args.returnRequestId);
    
    if (!returnRequest || returnRequest.userId !== args.userId) {
      throw new Error("Return request not found or access denied");
    }

    if (returnRequest.status !== "pending") {
      throw new Error("Can only delete pending return requests");
    }

    // Delete all messages associated with this return request
    const messages = await ctx.db
      .query("returnMessages")
      .withIndex("by_return_request", (q) => q.eq("returnRequestId", args.returnRequestId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the return request
    await ctx.db.delete(args.returnRequestId);
    return null;
  },
});

/**
 * Get messages for a return request
 */
export const getReturnMessages = query({
  args: { 
    returnRequestId: v.id("returnRequests"),
    userId: v.id("users")
  },
  returns: v.array(v.object({
    _id: v.id("returnMessages"),
    _creationTime: v.number(),
    senderId: v.id("users"),
    senderType: v.string(),
    senderName: v.string(),
    message: v.string(),
    messageType: v.string(),
    isRead: v.boolean(),
    attachments: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    // Verify user has access to this return request
    const returnRequest = await ctx.db.get(args.returnRequestId);
    if (!returnRequest || returnRequest.userId !== args.userId) {
      throw new Error("Access denied");
    }

    const messages = await ctx.db
      .query("returnMessages")
      .withIndex("by_return_request", (q) => q.eq("returnRequestId", args.returnRequestId))
      .order("asc")
      .collect();

    // Enrich with sender information and resolve attachment URLs
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        
        // Resolve attachment URLs from storage IDs
        let resolvedAttachments: string[] = [];
        if (message.attachments && message.attachments.length > 0) {
          resolvedAttachments = await Promise.all(
            message.attachments.map(async (url) => {
              // Check if it's a storage ID (starts with kg) or already a URL
              if (url.startsWith('kg')) {
                try {
                  const resolvedUrl = await ctx.storage.getUrl(url as any);
                  return resolvedUrl || url;
                } catch {
                  return url; // Return original if resolution fails
                }
              }
              return url; // Already a URL
            })
          );
        }
        
        return {
          _id: message._id,
          _creationTime: message._creationTime,
          senderId: message.senderId,
          senderType: message.senderType,
          senderName: sender?.name || "Unknown",
          message: message.message,
          messageType: message.messageType,
          isRead: message.isRead,
          attachments: resolvedAttachments,
        };
      })
    );

    // Note: Messages are marked as read via separate mutation

    return enrichedMessages;
  },
});

/**
 * Get messages for a return request (admin view)
 */
export const getReturnMessagesAdmin = query({
  args: { 
    returnRequestId: v.id("returnRequests")
  },
  returns: v.array(v.object({
    _id: v.id("returnMessages"),
    _creationTime: v.number(),
    senderId: v.id("users"),
    senderType: v.string(),
    senderName: v.string(),
    message: v.string(),
    messageType: v.string(),
    isRead: v.boolean(),
    attachments: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented

    const messages = await ctx.db
      .query("returnMessages")
      .withIndex("by_return_request", (q) => q.eq("returnRequestId", args.returnRequestId))
      .order("asc")
      .collect();

    // Enrich with sender information and resolve attachment URLs
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        
        // Resolve attachment URLs from storage IDs
        let resolvedAttachments: string[] = [];
        if (message.attachments && message.attachments.length > 0) {
          resolvedAttachments = await Promise.all(
            message.attachments.map(async (url) => {
              // Check if it's a storage ID (starts with kg) or already a URL
              if (url.startsWith('kg')) {
                try {
                  const resolvedUrl = await ctx.storage.getUrl(url as any);
                  return resolvedUrl || url;
                } catch {
                  return url; // Return original if resolution fails
                }
              }
              return url; // Already a URL
            })
          );
        }
        
        return {
          _id: message._id,
          _creationTime: message._creationTime,
          senderId: message.senderId,
          senderType: message.senderType,
          senderName: sender?.name || "Unknown",
          message: message.message,
          messageType: message.messageType,
          isRead: message.isRead,
          attachments: resolvedAttachments,
        };
      })
    );

    // Note: Messages are marked as read via separate mutation

    return enrichedMessages;
  },
});

/**
 * Send a message in a return request
 */
export const sendReturnMessage = mutation({
  args: {
    returnRequestId: v.id("returnRequests"),
    senderId: v.id("users"),
    message: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("status_update"), v.literal("admin_response"))),
    attachments: v.optional(v.array(v.string())),
  },
  returns: v.id("returnMessages"),
  handler: async (ctx, args) => {
    // Verify user has access to this return request
    const returnRequest = await ctx.db.get(args.returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Determine sender type
    const sender = await ctx.db.get(args.senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    // Check if sender is customer or admin
    const senderType = sender.role === "admin" ? "admin" : "customer";
    
    // Verify access: customers can only send messages to their own return requests
    if (senderType === "customer" && returnRequest.userId !== args.senderId) {
      throw new Error("Access denied");
    }

    const messageId = await ctx.db.insert("returnMessages", {
      returnRequestId: args.returnRequestId,
      senderId: args.senderId,
      senderType,
      message: args.message,
      messageType: args.messageType || "text",
      isRead: false,
      attachments: args.attachments,
    });

    return messageId;
  },
});

/**
 * Get unread message count for user's return requests
 */
export const getUnreadReturnMessageCount = query({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Get all return requests for user
    const returnRequests = await ctx.db
      .query("returnRequests")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    let unreadCount = 0;
    
    for (const request of returnRequests) {
      const unreadMessages = await ctx.db
        .query("returnMessages")
        .withIndex("by_return_and_read", (q) => 
          q.eq("returnRequestId", request._id).eq("isRead", false)
        )
        .filter((q) => q.eq(q.field("senderType"), "admin"))
        .collect();
      
      unreadCount += unreadMessages.length;
    }

    return unreadCount;
  },
});

/**
 * Mark messages as read for a return request (user marking admin messages as read)
 */
export const markReturnMessagesAsRead = mutation({
  args: {
    returnRequestId: v.id("returnRequests"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify user has access to this return request
    const returnRequest = await ctx.db.get(args.returnRequestId);
    if (!returnRequest || returnRequest.userId !== args.userId) {
      throw new Error("Access denied");
    }

    // Get unread admin messages
    const unreadAdminMessages = await ctx.db
      .query("returnMessages")
      .withIndex("by_return_and_read", (q) => 
        q.eq("returnRequestId", args.returnRequestId).eq("isRead", false)
      )
      .filter((q) => q.eq(q.field("senderType"), "admin"))
      .collect();

    // Mark them as read
    for (const message of unreadAdminMessages) {
      await ctx.db.patch(message._id, { isRead: true });
    }

    return null;
  },
});

/**
 * Mark customer messages as read (admin)
 */
export const markCustomerMessagesAsRead = mutation({
  args: {
    returnRequestId: v.id("returnRequests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented

    // Get unread customer messages
    const unreadCustomerMessages = await ctx.db
      .query("returnMessages")
      .withIndex("by_return_and_read", (q) => 
        q.eq("returnRequestId", args.returnRequestId).eq("isRead", false)
      )
      .filter((q) => q.eq(q.field("senderType"), "customer"))
      .collect();

    // Mark them as read
    for (const message of unreadCustomerMessages) {
      await ctx.db.patch(message._id, { isRead: true });
    }

    return null;
  },
});

/**
 * Get the first available admin user for system operations
 */
export const getSystemAdminUser = query({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();
    
    return adminUser?._id || null;
  },
});

/**
 * Get unread customer message counts for all return requests (admin view)
 */
export const getUnreadCustomerMessageCounts = query({
  args: {},
  returns: v.object({
    total: v.number(),
    byReturnRequest: v.array(v.object({
      returnRequestId: v.id("returnRequests"),
      unreadCount: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented

    // Get all return requests
    const returnRequests = await ctx.db
      .query("returnRequests")
      .order("desc")
      .collect();

    let totalUnread = 0;
    const byReturnRequest = [];

    for (const request of returnRequests) {
      const unreadMessages = await ctx.db
        .query("returnMessages")
        .withIndex("by_return_and_read", (q) => 
          q.eq("returnRequestId", request._id).eq("isRead", false)
        )
        .filter((q) => q.eq(q.field("senderType"), "customer"))
        .collect();

      const unreadCount = unreadMessages.length;
      totalUnread += unreadCount;

      if (unreadCount > 0) {
        byReturnRequest.push({
          returnRequestId: request._id,
          unreadCount,
        });
      }
    }

    return {
      total: totalUnread,
      byReturnRequest,
    };
  },
}); 