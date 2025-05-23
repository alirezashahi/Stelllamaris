import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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
    materials: v.optional(v.array(v.string())),
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
        if (args.materials && !args.materials.includes(product.material)) return null;

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