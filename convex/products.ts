import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

// Get featured products for homepage
export const getFeaturedProducts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    totalReviews: v.number(),
    sustainabilityScore: v.optional(v.number()),
    primaryImageUrl: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(8);

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: product._id,
          _creationTime: product._creationTime,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          sustainabilityScore: product.sustainabilityScore,
          primaryImageUrl: primaryImage?.imageUrl,
        };
      })
    );

    return productsWithImages;
  },
});

// Get new arrival products
export const getNewArrivals = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    totalReviews: v.number(),
    sustainabilityScore: v.optional(v.number()),
    primaryImageUrl: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_new_arrival", (q) => q.eq("isNewArrival", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(8);

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: product._id,
          _creationTime: product._creationTime,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          sustainabilityScore: product.sustainabilityScore,
          primaryImageUrl: primaryImage?.imageUrl,
        };
      })
    );

    return productsWithImages;
  },
});

// Get product by slug
export const getProductBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.string(),
      shortDescription: v.optional(v.string()),
      basePrice: v.number(),
      salePrice: v.optional(v.number()),
      sku: v.string(),
      categoryId: v.id("categories"),
      material: v.string(),
      dimensions: v.optional(v.string()),
      weight: v.optional(v.number()),
      careInstructions: v.optional(v.string()),
      sustainabilityScore: v.optional(v.number()),
      sustainableFeatures: v.optional(v.array(v.string())),
      totalStock: v.number(),
      averageRating: v.optional(v.number()),
      totalReviews: v.number(),
      images: v.array(v.object({
        _id: v.id("productImages"),
        _creationTime: v.number(),
        productId: v.id("products"),
        imageUrl: v.string(),
        altText: v.optional(v.string()),
        sortOrder: v.number(),
        isPrimary: v.boolean(),
      })),
      variants: v.array(v.object({
        _id: v.id("productVariants"),
        _creationTime: v.number(),
        productId: v.id("products"),
        name: v.string(),
        type: v.string(),
        value: v.string(),
        priceAdjustment: v.number(),
        stockQuantity: v.number(),
        sku: v.string(),
        imageUrl: v.optional(v.string()),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!product) {
      return null;
    }

    const [images, variants] = await Promise.all([
      ctx.db
        .query("productImages")
        .withIndex("by_product_id", (q) => q.eq("productId", product._id))
        .collect(),
      ctx.db
        .query("productVariants")
        .withIndex("by_product_id", (q) => q.eq("productId", product._id))
        .collect(),
    ]);

    return {
      _id: product._id,
      _creationTime: product._creationTime,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      sku: product.sku,
      categoryId: product.categoryId,
      material: product.material,
      dimensions: product.dimensions,
      weight: product.weight,
      careInstructions: product.careInstructions,
      sustainabilityScore: product.sustainabilityScore,
      sustainableFeatures: product.sustainableFeatures,
      totalStock: product.totalStock,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      images: images.sort((a, b) => a.sortOrder - b.sortOrder),
      variants,
    };
  },
});

// Search and filter products
export const searchProducts = query({
  args: {
    searchQuery: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("name"),
      v.literal("price_low_high"),
      v.literal("price_high_low"),
      v.literal("rating"),
      v.literal("newest")
    )),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      basePrice: v.number(),
      salePrice: v.optional(v.number()),
      averageRating: v.optional(v.number()),
      totalReviews: v.number(),
      sustainabilityScore: v.optional(v.number()),
      primaryImageUrl: v.optional(v.string()),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    let result;
    
    // Apply filters and search
    if (args.searchQuery) {
      result = await ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) => 
          q.search("name", args.searchQuery!)
            .eq("status", "active")
        )
        .paginate(args.paginationOpts);
    } else {
      // Build base query with filters
      let filteredQuery = ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("status"), "active"));

      if (args.categoryId) {
        filteredQuery = filteredQuery.filter((q) => q.eq(q.field("categoryId"), args.categoryId));
      }

      // Apply sorting and paginate
      if (args.sortBy === "price_high_low" || args.sortBy === "newest") {
        result = await filteredQuery.order("desc").paginate(args.paginationOpts);
      } else {
        result = await filteredQuery.order("asc").paginate(args.paginationOpts);
      }
    }

    const productsWithImages = await Promise.all(
      result.page.map(async (product) => {
        // Apply additional filters
        if (args.minPrice && product.basePrice < args.minPrice) return null;
        if (args.maxPrice && product.basePrice > args.maxPrice) return null;

        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: product._id,
          _creationTime: product._creationTime,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          sustainabilityScore: product.sustainabilityScore,
          primaryImageUrl: primaryImage?.imageUrl,
        };
      })
    );

    const filteredProducts = productsWithImages.filter(p => p !== null) as any[];

    return {
      page: filteredProducts,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// Get related products
export const getRelatedProducts = query({
  args: { 
    productId: v.id("products"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    totalReviews: v.number(),
    sustainabilityScore: v.optional(v.number()),
    primaryImageUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    const limit = args.limit || 4;
    
    const relatedProducts = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", product.categoryId))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "active"),
          q.neq(q.field("_id"), args.productId)
        )
      )
      .take(limit);

    const productsWithImages = await Promise.all(
      relatedProducts.map(async (relatedProduct) => {
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", relatedProduct._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: relatedProduct._id,
          _creationTime: relatedProduct._creationTime,
          name: relatedProduct.name,
          slug: relatedProduct.slug,
          basePrice: relatedProduct.basePrice,
          salePrice: relatedProduct.salePrice,
          averageRating: relatedProduct.averageRating,
          totalReviews: relatedProduct.totalReviews,
          sustainabilityScore: relatedProduct.sustainabilityScore,
          primaryImageUrl: primaryImage?.imageUrl,
        };
      })
    );

    return productsWithImages;
  },
});

/**
 * Get all products for admin management
 */
export const getAllProducts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    sku: v.string(),
    categoryId: v.id("categories"),
    sustainabilityScore: v.optional(v.number()),
    sustainableFeatures: v.optional(v.array(v.string())),
    material: v.string(),
    dimensions: v.optional(v.string()),
    weight: v.optional(v.number()),
    careInstructions: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("draft"), v.literal("archived")),
    totalStock: v.number(),
    lowStockThreshold: v.number(),
    totalSales: v.number(),
    averageRating: v.optional(v.number()),
    totalReviews: v.number(),
    isFeatured: v.boolean(),
    isNewArrival: v.boolean(),
  })),
  handler: async (ctx) => {
    // TODO: Add admin role check when authentication is fully implemented
    return await ctx.db.query("products").order("desc").collect();
  },
});

/**
 * Create a new product (admin only)
 */
export const createProduct = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    sustainabilityScore: v.number(),
    materials: v.array(v.string()),
    tags: v.array(v.string()),
    stockQuantity: v.number(),
    isActive: v.boolean(),
    images: v.array(v.string()),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Validate slug uniqueness
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existingProduct) {
      throw new Error(`A product with slug "${args.slug}" already exists. Please use a different slug.`);
    }

    // Create the product
    const productId = await ctx.db.insert("products", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      basePrice: args.price,
      salePrice: args.compareAtPrice,
      categoryId: args.categoryId,
      sustainabilityScore: args.sustainabilityScore,
      material: args.materials.join(', '), // Convert array to string
      totalStock: args.stockQuantity,
      status: args.isActive ? "active" : "draft",
      sku: `SKU-${Date.now()}`,
      averageRating: undefined,
      totalReviews: 0,
      isFeatured: false,
      isNewArrival: false,
      lowStockThreshold: 10,
      totalSales: 0,
    });

    return productId;
  },
});

/**
 * Update a product (admin only)
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    sustainabilityScore: v.optional(v.number()),
    materials: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    stockQuantity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const updates: any = {};
    
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    
    if (args.slug !== undefined) {
      // Check if slug is unique (exclude current product)
      const existingProduct = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();
      
      if (existingProduct && existingProduct._id !== args.productId) {
        throw new Error(`A product with slug "${args.slug}" already exists. Please use a different slug.`);
      }
      
      updates.slug = args.slug;
    }
    
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.basePrice = args.price;
    if (args.compareAtPrice !== undefined) updates.salePrice = args.compareAtPrice;
    if (args.categoryId !== undefined) updates.categoryId = args.categoryId;
    if (args.sustainabilityScore !== undefined) updates.sustainabilityScore = args.sustainabilityScore;
    if (args.materials !== undefined) updates.material = args.materials.join(', ');
    if (args.stockQuantity !== undefined) updates.totalStock = args.stockQuantity;
    if (args.isActive !== undefined) updates.status = args.isActive ? "active" : "draft";

    await ctx.db.patch(args.productId, updates);
    return null;
  },
});

/**
 * Delete a product (admin only)
 */
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Check if product has orders
    const orders = await ctx.db
      .query("orderItems")
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .take(1);

    if (orders.length > 0) {
      // Don't delete, just archive if it has orders
      await ctx.db.patch(args.productId, { status: "archived" });
    } else {
      // Safe to delete if no orders
      await ctx.db.delete(args.productId);
    }

    return null;
  },
});

/**
 * Get product statistics (admin only)
 */
export const getProductStats = query({
  args: {},
  returns: v.object({
    totalProducts: v.number(),
    activeProducts: v.number(),
    inactiveProducts: v.number(),
    lowStockProducts: v.number(),
    outOfStockProducts: v.number(),
    totalValue: v.number(),
  }),
  handler: async (ctx) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const products = await ctx.db.query("products").collect();
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === "active").length;
    const inactiveProducts = products.filter(p => p.status !== "active").length;
    const lowStockProducts = products.filter(p => p.totalStock > 0 && p.totalStock < 10).length;
    const outOfStockProducts = products.filter(p => p.totalStock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.basePrice * p.totalStock), 0);
    
    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
    };
  },
});

/**
 * Get product images for a specific product (general images only, no variant-specific)
 */
export const getProductImages = query({
  args: {
    productId: v.id("products"),
  },
  returns: v.array(v.object({
    _id: v.id("productImages"),
    _creationTime: v.number(),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    imageUrl: v.string(),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimary: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("productImages")
      .withIndex("by_product_and_variant", (q) => 
        q.eq("productId", args.productId).eq("variantId", undefined)
      )
      .collect();
    
    return images.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get images for a specific product variant
 */
export const getVariantImages = query({
  args: {
    productId: v.id("products"),
    variantId: v.id("productVariants"),
  },
  returns: v.array(v.object({
    _id: v.id("productImages"),
    _creationTime: v.number(),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    imageUrl: v.string(),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimary: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("productImages")
      .withIndex("by_product_and_variant", (q) => 
        q.eq("productId", args.productId).eq("variantId", args.variantId)
      )
      .collect();
    
    return images.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get all images for a product (including variant-specific images)
 */
export const getAllProductImages = query({
  args: {
    productId: v.id("products"),
  },
  returns: v.array(v.object({
    _id: v.id("productImages"),
    _creationTime: v.number(),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    imageUrl: v.string(),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimary: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("productImages")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .collect();
    
    return images.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get product variants
 */
export const getProductVariants = query({
  args: {
    productId: v.id("products"),
  },
  returns: v.array(v.object({
    _id: v.id("productVariants"),
    _creationTime: v.number(),
    productId: v.id("products"),
    name: v.string(),
    type: v.string(),
    value: v.string(),
    priceAdjustment: v.number(),
    stockQuantity: v.number(),
    sku: v.string(),
    imageUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productVariants")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .collect();
  },
});

/**
 * Create a new product variant (admin only)
 */
export const createProductVariant = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    type: v.string(),
    value: v.string(),
    priceAdjustment: v.number(),
    stockQuantity: v.number(),
  },
  returns: v.id("productVariants"),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Generate SKU for variant
    const baseProduct = await ctx.db.get(args.productId);
    if (!baseProduct) {
      throw new Error("Product not found");
    }
    
    const variantSku = `${baseProduct.sku}-${args.type}-${args.value}`.replace(/\s+/g, '-').toUpperCase();
    
    return await ctx.db.insert("productVariants", {
      productId: args.productId,
      name: args.name,
      type: args.type,
      value: args.value,
      priceAdjustment: args.priceAdjustment,
      stockQuantity: args.stockQuantity,
      sku: variantSku,
    });
  },
});

/**
 * Update a product variant (admin only)
 */
export const updateProductVariant = mutation({
  args: {
    variantId: v.id("productVariants"),
    name: v.optional(v.string()),
    priceAdjustment: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.priceAdjustment !== undefined) updates.priceAdjustment = args.priceAdjustment;
    if (args.stockQuantity !== undefined) updates.stockQuantity = args.stockQuantity;
    
    await ctx.db.patch(args.variantId, updates);
    return null;
  },
});

/**
 * Delete a product variant (admin only)
 */
export const deleteProductVariant = mutation({
  args: {
    variantId: v.id("productVariants"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role check when authentication is fully implemented
    
    // Delete associated images first
    const variantImages = await ctx.db
      .query("productImages")
      .withIndex("by_variant_id", (q) => q.eq("variantId", args.variantId))
      .collect();
    
    for (const image of variantImages) {
      await ctx.db.delete(image._id);
    }
    
    // Delete the variant
    await ctx.db.delete(args.variantId);
    return null;
  },
});

/**
 * Track recently viewed products for a user
 */
export const trackRecentlyViewedProduct = mutation({
  args: {
    userId: v.optional(v.id("users")),
    productId: v.id("products"),
    sessionId: v.optional(v.string()), // For guest users
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if this product view already exists for this user/session
    let existingView;
    
    if (args.userId) {
      existingView = await ctx.db
        .query("recentlyViewedProducts")
        .withIndex("by_user_product", (q) => 
          q.eq("userId", args.userId).eq("productId", args.productId)
        )
        .first();
    } else if (args.sessionId) {
      existingView = await ctx.db
        .query("recentlyViewedProducts")
        .withIndex("by_session_product", (q) => 
          q.eq("sessionId", args.sessionId).eq("productId", args.productId)
        )
        .first();
    }

    if (existingView) {
      // Update the timestamp
      await ctx.db.patch(existingView._id, {
        viewedAt: Date.now(),
      });
    } else {
      // Create new view record
      await ctx.db.insert("recentlyViewedProducts", {
        userId: args.userId,
        sessionId: args.sessionId,
        productId: args.productId,
        viewedAt: Date.now(),
      });
    }

    // Clean up old entries - keep only last 50 per user/session
    let allViews;
    if (args.userId) {
      allViews = await ctx.db
        .query("recentlyViewedProducts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    } else if (args.sessionId) {
      allViews = await ctx.db
        .query("recentlyViewedProducts")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .order("desc")
        .collect();
    }

    if (allViews && allViews.length > 50) {
      const toDelete = allViews.slice(50);
      for (const view of toDelete) {
        await ctx.db.delete(view._id);
      }
    }

    return null;
  },
});

/**
 * Get recently viewed products for a user
 */
export const getRecentlyViewedProducts = query({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
    excludeProductId: v.optional(v.id("products")), // Exclude current product
  },
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    totalReviews: v.number(),
    sustainabilityScore: v.optional(v.number()),
    primaryImageUrl: v.optional(v.string()),
    viewedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 8;
    
    let recentViews;
    if (args.userId) {
      recentViews = await ctx.db
        .query("recentlyViewedProducts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit + 1); // Take one extra in case we need to exclude current product
    } else if (args.sessionId) {
      recentViews = await ctx.db
        .query("recentlyViewedProducts")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .order("desc")
        .take(limit + 1);
    } else {
      return [];
    }

    // Filter out excluded product and get unique products
    const uniqueProductIds = new Set<string>();
    const filteredViews = recentViews.filter(view => {
      if (args.excludeProductId && view.productId === args.excludeProductId) {
        return false;
      }
      if (uniqueProductIds.has(view.productId)) {
        return false;
      }
      uniqueProductIds.add(view.productId);
      return true;
    }).slice(0, limit);

    // Get product details with images
    const productsWithImages = await Promise.all(
      filteredViews.map(async (view) => {
        const product = await ctx.db.get(view.productId);
        if (!product || product.status !== "active") {
          return null;
        }

        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_id", (q) => q.eq("productId", product._id))
          .filter((q) => q.eq(q.field("isPrimary"), true))
          .first();

        return {
          _id: product._id,
          _creationTime: product._creationTime,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          sustainabilityScore: product.sustainabilityScore,
          primaryImageUrl: primaryImage?.imageUrl,
          viewedAt: view.viewedAt,
        };
      })
    );

    // Filter out null products and return
    return productsWithImages.filter(Boolean) as any[];
  },
});



 