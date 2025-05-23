import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addSampleData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear existing data (optional)
    // Note: In production, you wouldn't want to clear data like this

    // Add Categories
    const toteCategory = await ctx.db.insert("categories", {
      name: "Tote Bags",
      slug: "tote-bags",
      description: "Spacious and versatile tote bags perfect for everyday use",
      isActive: true,
      sortOrder: 1,
      imageUrl: "https://via.placeholder.com/300x200",
    });

    const clutchCategory = await ctx.db.insert("categories", {
      name: "Clutches",
      slug: "clutches",
      description: "Elegant clutches for special occasions",
      isActive: true,
      sortOrder: 2,
      imageUrl: "https://via.placeholder.com/300x200",
    });

    const crossbodyCategory = await ctx.db.insert("categories", {
      name: "Crossbody Bags",
      slug: "crossbody-bags",
      description: "Hands-free convenience with style",
      isActive: true,
      sortOrder: 3,
      imageUrl: "https://via.placeholder.com/300x200",
    });

    // Add Charity Organizations
    const animalCharity = await ctx.db.insert("charityOrganizations", {
      name: "Local Animal Shelter",
      description: "Supporting abandoned and rescued animals in our community",
      type: "animal_shelter",
      isActive: true,
      totalDonationsReceived: 15000,
      website: "https://example-animal-shelter.org",
      logoUrl: "https://via.placeholder.com/100x100",
    });

    const environmentCharity = await ctx.db.insert("charityOrganizations", {
      name: "Green Earth Foundation",
      description: "Fighting climate change and protecting our environment",
      type: "environmental",
      isActive: true,
      totalDonationsReceived: 8500,
      website: "https://example-green-earth.org",
      logoUrl: "https://via.placeholder.com/100x100",
    });

    // Add Sample Products
    const product1 = await ctx.db.insert("products", {
      name: "The Signature Tote",
      slug: "signature-tote",
      description: "Our flagship tote bag, handcrafted from premium sustainable leather. This spacious yet elegant bag is perfect for the modern professional who values both style and ethics. Features multiple compartments, a secure zipper closure, and reinforced handles for everyday durability.",
      shortDescription: "Handcrafted premium tote with sustainable materials",
      basePrice: 1250,
      sku: "ST-001",
      material: "Sustainable Vegan Leather",
      dimensions: "15\" W x 12\" H x 6\" D",
      weight: 2.5,
      careInstructions: "Wipe clean with a damp cloth. Avoid direct sunlight for extended periods.",
      sustainabilityScore: 9,
      sustainableFeatures: ["Vegan leather", "Recycled lining", "Carbon-neutral shipping"],
      categoryId: toteCategory,
      status: "active",
      isFeatured: true,
      isNewArrival: false,
      totalStock: 25,
      lowStockThreshold: 5,
      totalSales: 0,
      totalReviews: 0,
      averageRating: 0,
    });

    const product2 = await ctx.db.insert("products", {
      name: "The Classic Clutch",
      slug: "classic-clutch",
      description: "An timeless evening clutch that complements any outfit. Crafted with attention to detail using eco-friendly materials, this clutch features a sleek design with just enough space for your essentials.",
      shortDescription: "Elegant evening clutch with eco-friendly materials",
      basePrice: 890,
      sku: "CC-001",
      material: "Recycled Polyester",
      dimensions: "10\" W x 6\" H x 2\" D",
      weight: 0.8,
      careInstructions: "Spot clean only. Store in dust bag when not in use.",
      sustainabilityScore: 8,
      sustainableFeatures: ["Recycled materials", "Water-based dyes", "Biodegradable packaging"],
      categoryId: clutchCategory,
      status: "active",
      isFeatured: true,
      isNewArrival: false,
      totalStock: 30,
      lowStockThreshold: 5,
      totalSales: 0,
      totalReviews: 0,
      averageRating: 0,
    });

    const product3 = await ctx.db.insert("products", {
      name: "The Everyday Crossbody",
      slug: "everyday-crossbody",
      description: "The perfect companion for busy days. This crossbody bag offers hands-free convenience without compromising on style. Made from innovative sustainable materials with a modern design.",
      shortDescription: "Hands-free convenience with sustainable style",
      basePrice: 675,
      salePrice: 575,
      sku: "EC-001",
      material: "Cork Leather",
      dimensions: "9\" W x 7\" H x 3\" D",
      weight: 1.2,
      careInstructions: "Clean with mild soap and water. Air dry only.",
      sustainabilityScore: 9,
      sustainableFeatures: ["Cork leather", "Organic cotton lining", "Renewable materials"],
      categoryId: crossbodyCategory,
      status: "active",
      isFeatured: true,
      isNewArrival: false,
      totalStock: 20,
      lowStockThreshold: 5,
      totalSales: 0,
      totalReviews: 0,
      averageRating: 0,
    });

    const product4 = await ctx.db.insert("products", {
      name: "The City Satchel",
      slug: "city-satchel",
      description: "Urban sophistication meets sustainability. This structured satchel is designed for the city dweller who needs style and functionality in equal measure.",
      shortDescription: "Urban satchel with structured design",
      basePrice: 1100,
      sku: "CS-001",
      material: "Upcycled Leather",
      dimensions: "13\" W x 10\" H x 5\" D",
      weight: 2.1,
      careInstructions: "Condition leather monthly. Store in dust bag.",
      sustainabilityScore: 8,
      sustainableFeatures: ["Upcycled leather", "Recycled hardware", "Local craftsmanship"],
      categoryId: toteCategory,
      status: "active",
      isFeatured: false,
      isNewArrival: true,
      totalStock: 15,
      lowStockThreshold: 3,
      totalSales: 0,
      totalReviews: 0,
      averageRating: 0,
    });

    const product5 = await ctx.db.insert("products", {
      name: "The Travel Companion",
      slug: "travel-companion",
      description: "Designed for the conscious traveler. This spacious bag features multiple compartments and is made from durable, sustainable materials that can withstand any journey.",
      shortDescription: "Durable travel bag for conscious travelers",
      basePrice: 1500,
      sku: "TC-001",
      material: "Recycled Canvas",
      dimensions: "17\" W x 14\" H x 8\" D",
      weight: 3.2,
      careInstructions: "Machine washable on gentle cycle. Air dry.",
      sustainabilityScore: 10,
      sustainableFeatures: ["100% recycled canvas", "Solar-powered production", "Zero waste packaging"],
      categoryId: toteCategory,
      status: "active",
      isFeatured: false,
      isNewArrival: true,
      totalStock: 12,
      lowStockThreshold: 3,
      totalSales: 0,
      totalReviews: 0,
      averageRating: 0,
    });

    const product6 = await ctx.db.insert("products", {
      name: "The Mini Bag",
      slug: "mini-bag",
      description: "Small but mighty. This mini bag proves that sustainability doesn't mean sacrificing style. Perfect for minimal carry days when you only need the essentials.",
      shortDescription: "Compact mini bag for essentials",
      basePrice: 450,
      sku: "MB-001",
      material: "Organic Hemp",
      dimensions: "6\" W x 5\" H x 2\" D",
      weight: 0.5,
      careInstructions: "Hand wash in cold water. Air dry.",
      sustainabilityScore: 7,
      sustainableFeatures: ["Organic hemp", "Natural dyes", "Handmade"],
      categoryId: crossbodyCategory,
      status: "active",
      isFeatured: false,
      isNewArrival: true,
      totalStock: 40,
      lowStockThreshold: 10,
      totalSales: 0,
      totalReviews: 0,
      averageRating: 0,
    });

    // Add Product Images
    const productImages = [
      // Signature Tote Images
      { productId: product1, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", altText: "The Signature Tote - Front View", sortOrder: 1, isPrimary: true },
      { productId: product1, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", altText: "The Signature Tote - Side View", sortOrder: 2, isPrimary: false },
      
      // Classic Clutch Images
      { productId: product2, imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400", altText: "The Classic Clutch - Front View", sortOrder: 1, isPrimary: true },
      { productId: product2, imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400", altText: "The Classic Clutch - Interior", sortOrder: 2, isPrimary: false },
      
      // Everyday Crossbody Images
      { productId: product3, imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400", altText: "The Everyday Crossbody - Front View", sortOrder: 1, isPrimary: true },
      { productId: product3, imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400", altText: "The Everyday Crossbody - Worn", sortOrder: 2, isPrimary: false },
      
      // City Satchel Images
      { productId: product4, imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400", altText: "The City Satchel - Front View", sortOrder: 1, isPrimary: true },
      
      // Travel Companion Images
      { productId: product5, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", altText: "The Travel Companion - Front View", sortOrder: 1, isPrimary: true },
      
      // Mini Bag Images
      { productId: product6, imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400", altText: "The Mini Bag - Front View", sortOrder: 1, isPrimary: true },
    ];

    for (const image of productImages) {
      await ctx.db.insert("productImages", image);
    }

    // Add Product Variants (colors/sizes)
    const variants = [
      // Signature Tote Variants
      { productId: product1, name: "Black", type: "color", value: "Black", priceAdjustment: 0, stockQuantity: 10, sku: "ST-001-BLK" },
      { productId: product1, name: "Brown", type: "color", value: "Brown", priceAdjustment: 0, stockQuantity: 8, sku: "ST-001-BRN" },
      { productId: product1, name: "Navy", type: "color", value: "Navy", priceAdjustment: 0, stockQuantity: 7, sku: "ST-001-NVY" },
      
      // Classic Clutch Variants
      { productId: product2, name: "Black", type: "color", value: "Black", priceAdjustment: 0, stockQuantity: 15, sku: "CC-001-BLK" },
      { productId: product2, name: "Gold", type: "color", value: "Gold", priceAdjustment: 50, stockQuantity: 10, sku: "CC-001-GLD" },
      { productId: product2, name: "Silver", type: "color", value: "Silver", priceAdjustment: 50, stockQuantity: 5, sku: "CC-001-SLV" },
      
      // Everyday Crossbody Variants
      { productId: product3, name: "Tan", type: "color", value: "Tan", priceAdjustment: 0, stockQuantity: 10, sku: "EC-001-TAN" },
      { productId: product3, name: "Black", type: "color", value: "Black", priceAdjustment: 0, stockQuantity: 6, sku: "EC-001-BLK" },
      { productId: product3, name: "Forest Green", type: "color", value: "Forest Green", priceAdjustment: 0, stockQuantity: 4, sku: "EC-001-GRN" },
    ];

    for (const variant of variants) {
      await ctx.db.insert("productVariants", variant);
    }

    return null;
  },
});

export const clearData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // This function clears all data - use with caution!
    const tables = ["productImages", "productVariants", "products", "categories", "charityOrganizations"];
    
    for (const tableName of tables) {
      const items = await ctx.db.query(tableName as any).collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    }
    
    return null;
  },
}); 