import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get dashboard analytics data
 */
export const getDashboardStats = query({
  args: {},
  returns: v.object({
    totalOrders: v.number(),
    activeUsers: v.number(),
    totalProducts: v.number(),
    revenue: v.number(),
  }),
  handler: async (ctx) => {
    // Count total orders
    const orders = await ctx.db.query("orders").collect();
    const totalOrders = orders.length;

    // Count active users (users who have made at least one order)
    const usersWithOrders = new Set();
    orders.forEach(order => {
      usersWithOrders.add(order.userId);
    });
    const activeUsers = usersWithOrders.size;

    // Count total products
    const products = await ctx.db.query("products").collect();
    const totalProducts = products.length;

    // Calculate total revenue from completed orders
    let revenue = 0;
    for (const order of orders) {
      if (order.status === "delivered" || order.status === "confirmed") {
        revenue += order.totalAmount;
      }
    }

    return {
      totalOrders,
      activeUsers,
      totalProducts,
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
    };
  },
});

/**
 * Get enhanced admin product list with images and statistics
 */
export const getAdminProductsWithImages = query({
  args: {
    searchTerm: v.optional(v.string()),
    categoryFilter: v.optional(v.string()),
    statusFilter: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
      returns: v.array(v.object({    _id: v.id("products"),    _creationTime: v.number(),    name: v.string(),    basePrice: v.number(),    salePrice: v.optional(v.number()),    status: v.string(),    totalStock: v.number(),    totalSales: v.number(),    averageRating: v.optional(v.number()),    totalReviews: v.number(),    categoryName: v.optional(v.string()),    primaryImage: v.optional(v.object({      imageUrl: v.string(),      altText: v.optional(v.string()),    })),  })),
  handler: async (ctx, args) => {
    let query = ctx.db.query("products");

    // Apply filters
    if (args.statusFilter && args.statusFilter !== "all") {
      query = query.filter((q) => q.eq(q.field("status"), args.statusFilter));
    }

    let products = await query.collect();

    // Apply search filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (args.categoryFilter && args.categoryFilter !== "all") {
      products = products.filter(product => product.categoryId === args.categoryFilter);
    }

    // Get additional data for each product
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        // Get category name
        let categoryName = undefined;
        if (product.categoryId) {
          const category = await ctx.db.get(product.categoryId);
          categoryName = category?.name;
        }

        // Get primary image
        const images = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .take(1);

        const primaryImage = images[0] ? {
          imageUrl: images[0].imageUrl,
          altText: images[0].altText,
        } : undefined;

        return {
          ...product,
          categoryName,
          primaryImage,
        };
      })
    );

        // Apply sorting    if (args.sortBy && args.sortOrder) {      productsWithDetails.sort((a, b) => {        let aValue: any, bValue: any;                switch (args.sortBy) {          case "name":            aValue = a.name.toLowerCase();            bValue = b.name.toLowerCase();            break;          case "price":            aValue = a.salePrice || a.basePrice;            bValue = b.salePrice || b.basePrice;            break;          case "stock":            aValue = a.totalStock;            bValue = b.totalStock;            break;          case "sales":            aValue = a.totalSales;            bValue = b.totalSales;            break;          case "rating":            aValue = a.averageRating || 0;            bValue = b.averageRating || 0;            break;          case "created":            aValue = a._creationTime;            bValue = b._creationTime;            break;          default:            aValue = a._creationTime;            bValue = b._creationTime;        }        // Handle undefined values        if (aValue === undefined && bValue === undefined) return 0;        if (aValue === undefined) return 1;        if (bValue === undefined) return -1;        if (args.sortOrder === "desc") {          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;        } else {          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;        }      });    }

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    return productsWithDetails.slice(offset, offset + limit);
  },
}); 