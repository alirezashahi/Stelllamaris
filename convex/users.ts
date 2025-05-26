import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by Clerk ID (the main lookup function)
export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    isActive: v.boolean(),
    preferredCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
  })),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), args.clerkUserId))
      .unique();

    return user;
  },
});

// Create or get user (called when user signs in)
export const createOrGetUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // First, try to find existing user
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), args.clerkUserId))
      .unique();

    if (existingUser) {
      // Update user info in case it changed, including role
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        role: args.role === 'admin' ? 'admin' : 'customer',
      });
      return existingUser._id;
    }

    // Try to create new user, but handle the case where another call created it
    try {
      const newUserId = await ctx.db.insert("users", {
        clerkUserId: args.clerkUserId,
        email: args.email,
        name: args.name,
        role: args.role === 'admin' ? 'admin' : 'customer',
        isActive: true,
      });
      return newUserId;
    } catch (error) {
      // If insert fails (likely due to concurrent creation), try to find the user again
      const retryUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkUserId"), args.clerkUserId))
        .unique();
      
      if (retryUser) {
        // User was created by another concurrent call, update and return it
        await ctx.db.patch(retryUser._id, {
          email: args.email,
          name: args.name,
          role: args.role === 'admin' ? 'admin' : 'customer',
        });
        return retryUser._id;
      }
      
      // If we still can't find the user, re-throw the original error
      throw error;
    }
  },
});

export const getCurrentUser = query({
  args: { userId: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    isActive: v.boolean(),
    preferredCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
  })),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .unique();

    return user;
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    clerkUserId: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const newUserId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      role: "customer",
      isActive: true,
    });

    return newUserId;
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    preferredCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      ...(args.name && { name: args.name }),
      ...(args.email && { email: args.email }),
      ...(args.phone && { phone: args.phone }),
      ...(args.preferredCharityType && { preferredCharityType: args.preferredCharityType }),
    });

    return args.userId;
  },
});

// User Address Management Functions

export const getUserAddresses = query({
  args: { userId: v.id("users") },
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
    const addresses = await ctx.db
      .query("userAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b._creationTime - a._creationTime;
    });
  },
});

export const addUserAddress = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.id("userAddresses"),
  handler: async (ctx, args) => {
    // If this is being set as default, remove default from other addresses
    if (args.isDefault) {
      const existingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect();

      for (const address of existingAddresses) {
        if (address.isDefault) {
          await ctx.db.patch(address._id, { isDefault: false });
        }
      }
    }

    // If this is the user's first address, make it default
    const existingAddressCount = await ctx.db
      .query("userAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const isDefault = args.isDefault ?? existingAddressCount.length === 0;

    const addressId = await ctx.db.insert("userAddresses", {
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      addressLine1: args.addressLine1,
      addressLine2: args.addressLine2,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      country: args.country,
      isDefault,
    });

    return addressId;
  },
});

export const updateUserAddress = mutation({
  args: {
    addressId: v.id("userAddresses"),
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify the address belongs to the user
    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== args.userId) {
      throw new Error("Address not found or access denied");
    }

    // If setting as default, remove default from other addresses
    if (args.isDefault) {
      const existingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect();

      for (const otherAddress of existingAddresses) {
        if (otherAddress._id !== args.addressId && otherAddress.isDefault) {
          await ctx.db.patch(otherAddress._id, { isDefault: false });
        }
      }
    }

    const updates: any = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.addressLine1 !== undefined) updates.addressLine1 = args.addressLine1;
    if (args.addressLine2 !== undefined) updates.addressLine2 = args.addressLine2;
    if (args.city !== undefined) updates.city = args.city;
    if (args.state !== undefined) updates.state = args.state;
    if (args.zipCode !== undefined) updates.zipCode = args.zipCode;
    if (args.country !== undefined) updates.country = args.country;
    if (args.isDefault !== undefined) updates.isDefault = args.isDefault;

    await ctx.db.patch(args.addressId, updates);
    return null;
  },
});

export const deleteUserAddress = mutation({
  args: {
    addressId: v.id("userAddresses"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify the address belongs to the user
    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== args.userId) {
      throw new Error("Address not found or access denied");
    }

    const wasDefault = address.isDefault;
    await ctx.db.delete(args.addressId);

    // If the deleted address was default, make another address default
    if (wasDefault) {
      const remainingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect();

      if (remainingAddresses.length > 0) {
        // Make the most recently created address the default
        const newestAddress = remainingAddresses.sort((a, b) => b._creationTime - a._creationTime)[0];
        await ctx.db.patch(newestAddress._id, { isDefault: true });
      }
    }

    return null;
  },
});

export const setDefaultAddress = mutation({
  args: {
    addressId: v.id("userAddresses"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify the address belongs to the user
    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== args.userId) {
      throw new Error("Address not found or access denied");
    }

    // Remove default from all other addresses
    const allAddresses = await ctx.db
      .query("userAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    for (const otherAddress of allAddresses) {
      if (otherAddress._id !== args.addressId && otherAddress.isDefault) {
        await ctx.db.patch(otherAddress._id, { isDefault: false });
      }
    }

    // Set the selected address as default
    await ctx.db.patch(args.addressId, { isDefault: true });
    return null;
  },
});

/**
 * Get all customers for admin management
 */
export const getAllCustomers = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    totalOrders: v.number(),
    totalSpent: v.number(),
    lastOrderDate: v.optional(v.number()),
  })),
  handler: async (ctx) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const users = await ctx.db.query("users").collect();
    
    // Get order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await ctx.db
          .query("orders")
          .filter((q) => q.eq(q.field("email"), user.email))
          .collect();
        
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const lastOrderDate = orders.length > 0 
          ? Math.max(...orders.map(o => o._creationTime))
          : undefined;
        
        return {
          _id: user._id,
          _creationTime: user._creationTime,
          clerkUserId: user.clerkUserId,
          name: user.name,
          email: user.email,
          totalOrders,
          totalSpent,
          lastOrderDate,
        };
      })
    );
    
    return usersWithStats.sort((a, b) => b.totalSpent - a.totalSpent);
  },
});

/**
 * Get customer statistics (admin only)
 */
export const getCustomerStats = query({
  args: {},
  returns: v.object({
    totalCustomers: v.number(),
    newThisMonth: v.number(),
    highValueCustomers: v.number(),
    frequentBuyers: v.number(),
    averageOrderValue: v.number(),
    customerLifetimeValue: v.number(),
  }),
  handler: async (ctx) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const users = await ctx.db.query("users").collect();
    const orders = await ctx.db.query("orders").collect();
    
    const totalCustomers = users.length;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const newThisMonth = users.filter(u => u._creationTime > thirtyDaysAgo).length;
    
    // Calculate user spending by email since orders use email field
    const userSpending = new Map<string, { totalSpent: number; orderCount: number }>();
    orders.forEach(order => {
      const existing = userSpending.get(order.email) || { totalSpent: 0, orderCount: 0 };
      userSpending.set(order.email, {
        totalSpent: existing.totalSpent + order.totalAmount,
        orderCount: existing.orderCount + 1,
      });
    });
    
    const highValueCustomers = Array.from(userSpending.values())
      .filter(stats => stats.totalSpent >= 500).length;
    const frequentBuyers = Array.from(userSpending.values())
      .filter(stats => stats.orderCount >= 5).length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    
    return {
      totalCustomers,
      newThisMonth,
      highValueCustomers,
      frequentBuyers,
      averageOrderValue,
      customerLifetimeValue,
    };
  },
}); 