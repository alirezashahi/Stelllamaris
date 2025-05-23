import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addSampleData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear existing data (optional)
    console.log("Adding sample data...");

    // Create top-level categories first
    const bagsCategory = await ctx.db.insert("categories", {
      name: "Bags",
      slug: "bags",
      description: "Premium handbags and accessories for every occasion",
      imageUrl: "https://via.placeholder.com/300x200",
      isActive: true,
      sortOrder: 1,
    });

    const shoesCategory = await ctx.db.insert("categories", {
      name: "Shoes",
      slug: "shoes", 
      description: "Sustainable footwear collection",
      imageUrl: "https://via.placeholder.com/300x200",
      isActive: true,
      sortOrder: 2,
    });

    const accessoriesCategory = await ctx.db.insert("categories", {
      name: "Accessories",
      slug: "accessories",
      description: "Eco-friendly accessories to complete your look",
      imageUrl: "https://via.placeholder.com/300x200", 
      isActive: true,
      sortOrder: 3,
    });

    // Create subcategories for Bags
    const toteCategory = await ctx.db.insert("categories", {
      name: "Tote Bags",
      slug: "tote-bags",
      description: "Spacious and versatile tote bags perfect for everyday use",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: bagsCategory,
      isActive: true,
      sortOrder: 1,
    });

    const crossbodyCategory = await ctx.db.insert("categories", {
      name: "Crossbody Bags",
      slug: "crossbody-bags",
      description: "Hands-free convenience with modern style",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: bagsCategory,
      isActive: true,
      sortOrder: 2,
    });

    const clutchCategory = await ctx.db.insert("categories", {
      name: "Clutch Bags",
      slug: "clutch-bags",
      description: "Elegant evening bags for special occasions",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: bagsCategory,
      isActive: true,
      sortOrder: 3,
    });

    const backpackCategory = await ctx.db.insert("categories", {
      name: "Backpacks",
      slug: "backpacks",
      description: "Functional and stylish backpacks for work and travel",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: bagsCategory,
      isActive: true,
      sortOrder: 4,
    });

    // Create subcategories for Shoes
    const sneakersCategory = await ctx.db.insert("categories", {
      name: "Sneakers",
      slug: "sneakers",
      description: "Sustainable sneakers for active lifestyles",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: shoesCategory,
      isActive: true,
      sortOrder: 1,
    });

    const heelsCategory = await ctx.db.insert("categories", {
      name: "Heels",
      slug: "heels",
      description: "Elegant heels made from eco-friendly materials",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: shoesCategory,
      isActive: true,
      sortOrder: 2,
    });

    const flatsCategory = await ctx.db.insert("categories", {
      name: "Flats",
      slug: "flats",
      description: "Comfortable flats for everyday wear",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: shoesCategory,
      isActive: true,
      sortOrder: 3,
    });

    // Create subcategories for Accessories
    const jewelryCategory = await ctx.db.insert("categories", {
      name: "Jewelry",
      slug: "jewelry",
      description: "Sustainable jewelry made from recycled materials",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: accessoriesCategory,
      isActive: true,
      sortOrder: 1,
    });

    const scarvesCategory = await ctx.db.insert("categories", {
      name: "Scarves",
      slug: "scarves", 
      description: "Luxurious scarves from organic and sustainable fabrics",
      imageUrl: "https://via.placeholder.com/300x200",
      parentCategoryId: accessoriesCategory,
      isActive: true,
      sortOrder: 2,
    });

    // Create products with proper category assignments
    const product1 = await ctx.db.insert("products", {
      name: "The Sustainability Tote",
      slug: "sustainability-tote",
      description: "Our flagship tote bag made from 100% recycled ocean plastic. This spacious bag features multiple compartments and is perfect for work, shopping, or travel. Each purchase helps remove plastic waste from our oceans.",
      shortDescription: "Spacious tote made from recycled ocean plastic",
      basePrice: 1250,
      sku: "ST-001",
      material: "Recycled Ocean Plastic",
      dimensions: "15\" W x 12\" H x 6\" D", 
      weight: 1.8,
      careInstructions: "Wipe clean with damp cloth. Air dry only.",
      sustainabilityScore: 10,
      sustainableFeatures: ["100% recycled ocean plastic", "Carbon neutral shipping", "Zero waste packaging"],
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
      categoryId: backpackCategory,
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

    console.log("Sample data added successfully!");
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

/**
 * Create predefined promo codes
 */
export const createPromoCodes = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000); // 1 year validity

    const predefinedCodes = [
      {
        code: "WELCOME10",
        type: "percentage" as const,
        value: 10,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 50,
        maxUsagePerUser: 1,
        maxUsageCount: 1000,
      },
      {
        code: "SAVE15",
        type: "percentage" as const,
        value: 15,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 100,
        maxUsageCount: 500,
      },
      {
        code: "FIRST20",
        type: "percentage" as const,
        value: 20,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 150,
        maxUsagePerUser: 1,
        maxUsageCount: 200,
      },
      {
        code: "STELLAMARIS",
        type: "percentage" as const,
        value: 25,
        validFrom: now,
        validUntil: oneYearFromNow,
        minimumOrderAmount: 200,
        maxUsageCount: 100,
      },
    ];

    for (const codeData of predefinedCodes) {
      // Check if already exists
      const existing = await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", codeData.code))
        .unique();

      if (!existing) {
        await ctx.db.insert("promoCodes", {
          ...codeData,
          isActive: true,
          currentUsageCount: 0,
        });
        console.log(`Created promo code: ${codeData.code}`);
      } else {
        console.log(`Promo code already exists: ${codeData.code}`);
      }
    }

    return null;
  },
}); 