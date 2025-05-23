import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all categories
 */
export const getAllCategories = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    isActive: v.boolean(),
    sortOrder: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("categories").order("asc").collect();
  },
});

/**
 * Create a new category (admin only)
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Generate slug from name
    const slug = args.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if category with this slug already exists
    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existingCategory) {
      throw new Error("A category with this name already exists");
    }

    return await ctx.db.insert("categories", {
      name: args.name,
      slug: slug,
      description: args.description,
      isActive: true,
      sortOrder: 0,
    });
  },
});

/**
 * Update a category (admin only)
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const updates: any = {};
    
    if (args.name !== undefined) {
      updates.name = args.name;
      updates.slug = args.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.categoryId, updates);
    return null;
  },
});

/**
 * Delete a category (admin only)
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Check if category has products
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .take(1);

    if (products.length > 0) {
      throw new Error("Cannot delete category that has products. Move products to another category first.");
    }

    await ctx.db.delete(args.categoryId);
    return null;
  },
});

/**
 * Get all categories with hierarchical structure
 */
export const getAllCategoriesHierarchical = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    isActive: v.boolean(),
    sortOrder: v.number(),
    children: v.array(v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      parentCategoryId: v.optional(v.id("categories")),
      isActive: v.boolean(),
      sortOrder: v.number(),
    })),
  })),
  handler: async (ctx) => {
    const allCategories = await ctx.db.query("categories").collect();
    
    // Get top-level categories (no parent)
    const topLevelCategories = allCategories.filter(cat => !cat.parentCategoryId);
    
    // Build hierarchical structure
    const hierarchicalCategories = topLevelCategories.map(parentCategory => {
      const children = allCategories
        .filter(cat => cat.parentCategoryId === parentCategory._id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      return {
        ...parentCategory,
        children,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
    
    return hierarchicalCategories;
  },
});

/**
 * Get categories for a specific parent (or top-level if no parent)
 */
export const getCategoriesByParent = query({
  args: {
    parentId: v.optional(v.id("categories")),
  },
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    isActive: v.boolean(),
    sortOrder: v.number(),
  })),
  handler: async (ctx, args) => {
    if (args.parentId) {
      return await ctx.db
        .query("categories")
        .withIndex("by_parent", (q) => q.eq("parentCategoryId", args.parentId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      return await ctx.db
        .query("categories")
        .filter((q) => 
          q.and(
            q.eq(q.field("isActive"), true),
            q.eq(q.field("parentCategoryId"), undefined)
          )
        )
        .collect();
    }
  },
});

/**
 * Get category path (breadcrumb) for a given category
 */
export const getCategoryPath = query({
  args: {
    categoryId: v.id("categories"),
  },
  returns: v.array(v.object({
    _id: v.id("categories"),
    name: v.string(),
    slug: v.string(),
  })),
  handler: async (ctx, args) => {
    const path = [];
    let currentCategory = await ctx.db.get(args.categoryId);
    
    while (currentCategory) {
      path.unshift({
        _id: currentCategory._id,
        name: currentCategory.name,
        slug: currentCategory.slug,
      });
      
      if (currentCategory.parentCategoryId) {
        currentCategory = await ctx.db.get(currentCategory.parentCategoryId);
      } else {
        currentCategory = null;
      }
    }
    
    return path;
  },
}); 