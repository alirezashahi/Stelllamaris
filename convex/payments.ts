import { action } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

export const createPaymentIntent = action({
  args: {
    amount: v.number(), // amount in cents
    currency: v.string(),
    email: v.optional(v.string()),
    orderNumber: v.optional(v.string()),
  },
  returns: v.object({
    clientSecret: v.string(),
    paymentIntentId: v.string(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error("STRIPE_SECRET_KEY is not configured in Convex environment");
    }

    const stripe = new Stripe(secret);

    const intent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: args.currency,
      receipt_email: args.email,
      description: args.orderNumber ? `Order ${args.orderNumber}` : "Checkout payment",
      metadata: args.orderNumber ? { orderNumber: args.orderNumber } : undefined,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id,
      status: intent.status,
    };
  },
});