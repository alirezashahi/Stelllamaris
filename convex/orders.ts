import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to get Convex user ID from Clerk user ID
async function getConvexUserId(ctx: any, clerkUserId: string) {
  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkUserId"), clerkUserId))
    .unique();
  
  return user?._id;
}

// Create a new order
export const createOrder = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    cartItems: v.array(v.object({
      productId: v.id("products"),
      variantId: v.optional(v.id("productVariants")),
      productName: v.string(),
      variantName: v.optional(v.string()),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      shippingOption: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        price: v.number(), // in cents
        estimatedDays: v.object({
          min: v.number(),
          max: v.number(),
        }),
      })),
    })),
    subtotal: v.number(),
    taxAmount: v.number(),
    shippingAmount: v.number(),
    discountAmount: v.number(),
    charityDonationAmount: v.number(),
    totalAmount: v.number(),
    shippingAddress: v.object({
      firstName: v.string(),
      lastName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    paymentMethod: v.string(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    stripePaymentIntentId: v.optional(v.string()),
    selectedCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
  },
  returns: v.object({
    orderId: v.id("orders"),
    orderNumber: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    
    // Generate order number
    const orderNumber = `SM${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create the order
    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      userId: convexUserId,
      email: args.email,
      status: "confirmed",
      subtotal: args.subtotal,
      taxAmount: args.taxAmount,
      shippingAmount: args.shippingAmount,
      discountAmount: args.discountAmount,
      charityDonationAmount: args.charityDonationAmount,
      totalAmount: args.totalAmount,
      shippingAddress: args.shippingAddress,
      paymentStatus: args.paymentStatus,
      paymentMethod: args.paymentMethod,
      stripePaymentIntentId: args.stripePaymentIntentId,
      selectedCharityType: args.selectedCharityType,
    });

    // Create order items
    for (const item of args.cartItems) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        shippingOption: item.shippingOption,
      });
    }

    return {
      orderId,
      orderNumber,
    };
  },
});

// Get user's orders
export const getUserOrders = query({
  args: { clerkUserId: v.string() },
  returns: v.array(v.object({
    _id: v.id("orders"),
    _creationTime: v.number(),
    orderNumber: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    totalAmount: v.number(),
    charityDonationAmount: v.number(),
    selectedCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
    shippingAddress: v.object({
      firstName: v.string(),
      lastName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    trackingNumber: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    items: v.array(v.object({
      productName: v.string(),
      variantName: v.optional(v.string()),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      productId: v.id("products"),
      variantId: v.optional(v.id("productVariants")),
      shippingOption: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        price: v.number(), // in cents
        estimatedDays: v.object({
          min: v.number(),
          max: v.number(),
        }),
      })),
    })),
  })),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    if (!convexUserId) {
      return [];
    }

    // Get orders for this user
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", convexUserId))
      .order("desc")
      .collect();

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order_id", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          charityDonationAmount: order.charityDonationAmount,
          selectedCharityType: order.selectedCharityType,
          shippingAddress: order.shippingAddress,
          trackingNumber: order.trackingNumber,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          items: items.map(item => ({
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            productId: item.productId,
            variantId: item.variantId,
            shippingOption: item.shippingOption,
          })),
        };
      })
    );

    return ordersWithItems;
  },
});

// Get a specific order by order number
export const getOrderByNumber = query({
  args: { orderNumber: v.string() },
  returns: v.union(v.object({
    _id: v.id("orders"),
    _creationTime: v.number(),
    orderNumber: v.string(),
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    subtotal: v.number(),
    taxAmount: v.number(),
    shippingAmount: v.number(),
    discountAmount: v.number(),
    charityDonationAmount: v.number(),
    totalAmount: v.number(),
    shippingAddress: v.object({
      firstName: v.string(),
      lastName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.string(),
    selectedCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
    trackingNumber: v.optional(v.string()),
    items: v.array(v.object({
      productName: v.string(),
      variantName: v.optional(v.string()),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      productId: v.id("products"),
      variantId: v.optional(v.id("productVariants")),
      shippingOption: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        price: v.number(), // in cents
        estimatedDays: v.object({
          min: v.number(),
          max: v.number(),
        }),
      })),
    })),
  }), v.null()),
  handler: async (ctx, args) => {
    // Get order by order number
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
      .unique();

    if (!order) {
      return null;
    }

    // Get order items
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order_id", (q) => q.eq("orderId", order._id))
      .collect();

    return {
      _id: order._id,
      _creationTime: order._creationTime,
      orderNumber: order.orderNumber,
      email: order.email,
      status: order.status,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      charityDonationAmount: order.charityDonationAmount,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      selectedCharityType: order.selectedCharityType,
      trackingNumber: order.trackingNumber,
      items: items.map(item => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productId: item.productId,
        variantId: item.variantId,
        shippingOption: item.shippingOption,
      })),
    };
  },
});

// Update order status (for admin)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    trackingNumber: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
    };

    if (args.trackingNumber) {
      updateData.trackingNumber = args.trackingNumber;
    }

    if (args.status === "shipped") {
      updateData.shippedAt = Date.now();
    }

    if (args.status === "delivered") {
      updateData.deliveredAt = Date.now();
    }

    await ctx.db.patch(args.orderId, updateData);
    return null;
  },
});

// Admin function to update order status and tracking
export const updateOrderTracking = mutation({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    )),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {};
    
    if (args.trackingNumber !== undefined) {
      updates.trackingNumber = args.trackingNumber;
    }
    
    if (args.status !== undefined) {
      updates.status = args.status;
      
      // Set timestamps based on status
      if (args.status === "shipped" && !updates.shippedAt) {
        updates.shippedAt = Date.now();
      }
      
      if (args.status === "delivered" && !updates.deliveredAt) {
        updates.deliveredAt = Date.now();
      }
    }
    
    await ctx.db.patch(args.orderId, updates);
    return null;
  },
});

// Admin function to get all orders
export const getAllOrders = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("orders"),
    _creationTime: v.number(),
    orderNumber: v.string(),
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    totalAmount: v.number(),
    trackingNumber: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    items: v.array(v.object({
      productName: v.string(),
      variantName: v.optional(v.string()),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      shippingOption: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        price: v.number(), // in cents
        estimatedDays: v.object({
          min: v.number(),
          max: v.number(),
        }),
      })),
    })),
  })),
  handler: async (ctx, args) => {
    let orders;
    
    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 100);
    } else {
      orders = await ctx.db
        .query("orders")
        .order("desc")
        .take(args.limit || 100);
    }

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order_id", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          orderNumber: order.orderNumber,
          email: order.email,
          status: order.status,
          totalAmount: order.totalAmount,
          trackingNumber: order.trackingNumber,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          items: items.map(item => ({
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            shippingOption: item.shippingOption,
          })),
        };
      })
    );

    return ordersWithItems;
  },
});