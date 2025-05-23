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

// Detect card type from card number
function detectCardType(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, '');
  
  if (number.match(/^4/)) return 'visa';
  if (number.match(/^5[1-5]/) || number.match(/^2[2-7]/)) return 'mastercard';
  if (number.match(/^3[47]/)) return 'amex';
  if (number.match(/^6/)) return 'discover';
  
  return 'unknown';
}

export const getUserPaymentMethods = query({
  args: { clerkUserId: v.string() },
  returns: v.array(v.object({
    _id: v.id("userPaymentMethods"),
    _creationTime: v.number(),
    userId: v.id("users"),
    cardType: v.string(),
    last4Digits: v.string(),
    expiryMonth: v.string(),
    expiryYear: v.string(),
    nameOnCard: v.string(),
    isDefault: v.boolean(),
    stripePaymentMethodId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    if (!convexUserId) {
      return [];
    }

    const paymentMethods = await ctx.db
      .query("userPaymentMethods")
      .withIndex("by_user_id", (q) => q.eq("userId", convexUserId))
      .collect();

    return paymentMethods.map(method => ({
      _id: method._id,
      _creationTime: method._creationTime,
      userId: method.userId,
      cardType: method.cardType,
      last4Digits: method.last4Digits,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      nameOnCard: method.nameOnCard,
      isDefault: method.isDefault,
      stripePaymentMethodId: method.stripePaymentMethodId,
    }));
  },
});

export const addPaymentMethod = mutation({
  args: {
    clerkUserId: v.string(),
    cardNumber: v.string(),
    expiryDate: v.string(), // MM/YY format
    nameOnCard: v.string(),
    isDefault: v.boolean(),
    stripePaymentMethodId: v.optional(v.string()),
  },
  returns: v.id("userPaymentMethods"),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    if (!convexUserId) {
      throw new Error("User not found");
    }

    // Extract last 4 digits
    const last4Digits = args.cardNumber.replace(/\s/g, '').slice(-4);
    
    // Detect card type
    const cardType = detectCardType(args.cardNumber);
    
    // Parse expiry date
    const [expiryMonth, expiryYear] = args.expiryDate.split('/');

    // If this is being set as default, unset all other default payment methods for this user
    if (args.isDefault) {
      const existingMethods = await ctx.db
        .query("userPaymentMethods")
        .withIndex("by_user_id", (q) => q.eq("userId", convexUserId))
        .collect();

      for (const method of existingMethods) {
        if (method.isDefault) {
          await ctx.db.patch(method._id, { isDefault: false });
        }
      }
    }

    const paymentMethodId = await ctx.db.insert("userPaymentMethods", {
      userId: convexUserId,
      cardType,
      last4Digits,
      expiryMonth,
      expiryYear,
      nameOnCard: args.nameOnCard,
      isDefault: args.isDefault,
      stripePaymentMethodId: args.stripePaymentMethodId,
    });

    return paymentMethodId;
  },
});

export const updatePaymentMethod = mutation({
  args: {
    paymentMethodId: v.id("userPaymentMethods"),
    expiryDate: v.string(),
    nameOnCard: v.string(),
    isDefault: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const paymentMethod = await ctx.db.get(args.paymentMethodId);
    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    // Parse expiry date
    const [expiryMonth, expiryYear] = args.expiryDate.split('/');

    // If this is being set as default, unset all other default payment methods for this user
    if (args.isDefault) {
      const existingMethods = await ctx.db
        .query("userPaymentMethods")
        .withIndex("by_user_id", (q) => q.eq("userId", paymentMethod.userId))
        .collect();

      for (const method of existingMethods) {
        if (method.isDefault && method._id !== args.paymentMethodId) {
          await ctx.db.patch(method._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(args.paymentMethodId, {
      expiryMonth,
      expiryYear,
      nameOnCard: args.nameOnCard,
      isDefault: args.isDefault,
    });

    return null;
  },
});

export const deletePaymentMethod = mutation({
  args: { paymentMethodId: v.id("userPaymentMethods") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const paymentMethod = await ctx.db.get(args.paymentMethodId);
    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    await ctx.db.delete(args.paymentMethodId);

    // If we deleted the default payment method, make the first remaining method default
    if (paymentMethod.isDefault) {
      const remainingMethods = await ctx.db
        .query("userPaymentMethods")
        .withIndex("by_user_id", (q) => q.eq("userId", paymentMethod.userId))
        .first();

      if (remainingMethods) {
        await ctx.db.patch(remainingMethods._id, { isDefault: true });
      }
    }

    return null;
  },
}); 