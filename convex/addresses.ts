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

export const getUserAddresses = query({
  args: { clerkUserId: v.string() },
  returns: v.array(v.object({
    _id: v.id("userAddresses"),
    _creationTime: v.number(),
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  })),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    if (!convexUserId) {
      return []; // Return empty array if user not found
    }

    const addresses = await ctx.db
      .query("userAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", convexUserId))
      .collect();

    return addresses.map(address => ({
      _id: address._id,
      _creationTime: address._creationTime,
      userId: address.userId,
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    }));
  },
});

export const addAddress = mutation({
  args: {
    clerkUserId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  },
  returns: v.id("userAddresses"),
  handler: async (ctx, args) => {
    // Get Convex user ID from Clerk user ID
    const convexUserId = await getConvexUserId(ctx, args.clerkUserId);
    if (!convexUserId) {
      throw new Error("User not found");
    }

    // If this is being set as default, unset all other default addresses for this user
    if (args.isDefault) {
      const existingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_user_id", (q) => q.eq("userId", convexUserId))
        .collect();

      for (const address of existingAddresses) {
        if (address.isDefault) {
          await ctx.db.patch(address._id, { isDefault: false });
        }
      }
    }

    const addressId = await ctx.db.insert("userAddresses", {
      userId: convexUserId,
      firstName: args.firstName,
      lastName: args.lastName,
      addressLine1: args.addressLine1,
      addressLine2: args.addressLine2,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      country: args.country,
      isDefault: args.isDefault,
    });

    return addressId;
  },
});

export const updateAddress = mutation({
  args: {
    addressId: v.id("userAddresses"),
    firstName: v.string(),
    lastName: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const address = await ctx.db.get(args.addressId);
    if (!address) {
      throw new Error("Address not found");
    }

    // If this is being set as default, unset all other default addresses for this user
    if (args.isDefault) {
      const existingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_user_id", (q) => q.eq("userId", address.userId))
        .collect();

      for (const addr of existingAddresses) {
        if (addr.isDefault && addr._id !== args.addressId) {
          await ctx.db.patch(addr._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(args.addressId, {
      firstName: args.firstName,
      lastName: args.lastName,
      addressLine1: args.addressLine1,
      addressLine2: args.addressLine2,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      country: args.country,
      isDefault: args.isDefault,
    });

    return null;
  },
});

export const deleteAddress = mutation({
  args: { addressId: v.id("userAddresses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const address = await ctx.db.get(args.addressId);
    if (!address) {
      throw new Error("Address not found");
    }

    await ctx.db.delete(args.addressId);

    // If we deleted the default address, make the first remaining address default
    if (address.isDefault) {
      const remainingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_user_id", (q) => q.eq("userId", address.userId))
        .first();

      if (remainingAddresses) {
        await ctx.db.patch(remainingAddresses._id, { isDefault: true });
      }
    }

    return null;
  },
});

export const getDefaultAddress = query({
  args: { userId: v.id("users") },
  returns: v.union(v.object({
    _id: v.id("userAddresses"),
    _creationTime: v.number(),
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    const defaultAddress = await ctx.db
      .query("userAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (!defaultAddress) {
      return null;
    }

    return {
      _id: defaultAddress._id,
      _creationTime: defaultAddress._creationTime,
      userId: defaultAddress.userId,
      firstName: defaultAddress.firstName,
      lastName: defaultAddress.lastName,
      addressLine1: defaultAddress.addressLine1,
      addressLine2: defaultAddress.addressLine2,
      city: defaultAddress.city,
      state: defaultAddress.state,
      zipCode: defaultAddress.zipCode,
      country: defaultAddress.country,
      isDefault: defaultAddress.isDefault,
    };
  },
}); 