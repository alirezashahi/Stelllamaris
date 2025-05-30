import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for customer accounts
  users: defineTable({
    clerkUserId: v.string(), // Clerk authentication user ID
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    isActive: v.boolean(),
    // Charity preferences
    preferredCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_clerk_user_id", ["clerkUserId"]),

  // User addresses for shipping
  userAddresses: defineTable({
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
  }).index("by_user_id", ["userId"]),

  // User payment methods
  userPaymentMethods: defineTable({
    userId: v.id("users"),
    cardType: v.string(), // "visa", "mastercard", "amex", etc.
    last4Digits: v.string(),
    expiryMonth: v.string(),
    expiryYear: v.string(),
    nameOnCard: v.string(),
    isDefault: v.boolean(),
    // For future Stripe integration
    stripePaymentMethodId: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),

  // Categories for product organization
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    isActive: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentCategoryId"])
    .index("by_active_and_sort", ["isActive", "sortOrder"]),

  // Products table
  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    sku: v.string(),
    status: v.union(v.literal("active"), v.literal("draft"), v.literal("archived")),
    categoryId: v.id("categories"),
    
    // Product specifications
    material: v.string(),
    dimensions: v.optional(v.string()),
    weight: v.optional(v.number()),
    careInstructions: v.optional(v.string()),
    
    // Sustainability info
    sustainabilityScore: v.optional(v.number()), // 1-10 scale
    sustainableFeatures: v.optional(v.array(v.string())),
    
    // SEO
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    
    // Inventory
    totalStock: v.number(),
    lowStockThreshold: v.number(),
    
    // Product metrics
    averageRating: v.optional(v.number()),
    totalReviews: v.number(),
    totalSales: v.number(),
    
    isFeatured: v.boolean(),
    isNewArrival: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_featured", ["isFeatured"])
    .index("by_new_arrival", ["isNewArrival"])
    .index("by_status_and_category", ["status", "categoryId"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["status", "categoryId"]
    }),

  // Product images
  productImages: defineTable({
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")), // Associate with specific variant (null for general product images)
    imageUrl: v.string(),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimary: v.boolean(),
  })
    .index("by_product_id", ["productId"])
    .index("by_variant_id", ["variantId"])
    .index("by_product_and_variant", ["productId", "variantId"]),

  // Product variants (colors, sizes, etc.)
  productVariants: defineTable({
    productId: v.id("products"),
    name: v.string(), // e.g., "Black", "Large", etc.
    type: v.string(), // e.g., "color", "size"
    value: v.string(),
    priceAdjustment: v.number(), // +/- from base price
    stockQuantity: v.number(),
    sku: v.string(),
    imageUrl: v.optional(v.string()),
  }).index("by_product_id", ["productId"]),

  // Shopping cart
  carts: defineTable({
    userId: v.optional(v.id("users")), // null for guest carts
    sessionId: v.optional(v.string()), // for guest carts
    expiresAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_session_id", ["sessionId"]),

  // Cart items
  cartItems: defineTable({
    cartId: v.id("carts"),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    quantity: v.number(),
    priceAtTime: v.number(), // Price when added to cart
  }).index("by_cart_id", ["cartId"]),

  // Wishlist
  wishlistItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  // Orders
  orders: defineTable({
    orderNumber: v.string(),
    userId: v.optional(v.id("users")), // null for guest orders
    email: v.string(),
    
    // Order status
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    
    // Pricing
    subtotal: v.number(),
    taxAmount: v.number(),
    shippingAmount: v.number(),
    discountAmount: v.number(),
    charityDonationAmount: v.number(),
    totalAmount: v.number(),
    
    // Shipping info
    shippingAddress: v.object({
      firstName: v.string(),
      lastName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    
    // Selected shipping option
    shippingOption: v.optional(v.object({
      name: v.string(),
      description: v.string(),
      price: v.number(),
      estimatedDays: v.object({
        min: v.number(),
        max: v.number(),
      }),
      carrier: v.optional(v.string()),
      serviceType: v.optional(v.string()),
    })),
    
    // Payment info
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    
    // Charity selection
    selectedCharityType: v.optional(v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    )),
    
    // Tracking
    trackingNumber: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    
    // Notes
    customerNotes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
  })
    .index("by_order_number", ["orderNumber"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // Order items
  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    productName: v.string(), // Snapshot at time of order
    variantName: v.optional(v.string()),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    shippingOption: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      price: v.number(), // in cents
      estimatedDays: v.object({
        min: v.number(),
        max: v.number(),
      }),
    })),
  }).index("by_order_id", ["orderId"]),

  // Product reviews
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")), // Link to verified purchase
    rating: v.number(), // 1-5 stars
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
    isVerifiedPurchase: v.boolean(),
    isApproved: v.boolean(),
    adminResponse: v.optional(v.string()),
  })
    .index("by_product_id", ["productId"])
    .index("by_user_id", ["userId"])
    .index("by_approved", ["isApproved"]),

  // Review images
  reviewImages: defineTable({
    reviewId: v.id("reviews"),
    imageUrl: v.string(),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_review_id", ["reviewId"]),

  // Promo codes
  promoCodes: defineTable({
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed_amount"), v.literal("free_shipping")),
    value: v.number(), // Percentage (0-100) or fixed amount in cents
    minimumOrderAmount: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    currentUsageCount: v.number(),
    maxUsagePerUser: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.number(),
    isActive: v.boolean(),
    
    // Applicable products/categories
    applicableProductIds: v.optional(v.array(v.id("products"))),
    applicableCategoryIds: v.optional(v.array(v.id("categories"))),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Promo code usage tracking
  promoCodeUsage: defineTable({
    promoCodeId: v.id("promoCodes"),
    userId: v.optional(v.id("users")),
    orderId: v.id("orders"),
    discountAmount: v.number(),
  })
    .index("by_promo_code", ["promoCodeId"])
    .index("by_user", ["userId"]),

  // Newsletter subscribers
  newsletterSubscribers: defineTable({
    email: v.string(),
    isActive: v.boolean(),
    source: v.string(), // "homepage", "checkout", etc.
    subscribedAt: v.number(),
    unsubscribedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // Charity organizations
  charityOrganizations: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("animal_shelter"),
      v.literal("environmental"),
      v.literal("children"),
      v.literal("education")
    ),
    description: v.string(),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    isActive: v.boolean(),
    totalDonationsReceived: v.number(),
  }).index("by_type", ["type"]),

  // Donation tracking
  donations: defineTable({
    orderId: v.id("orders"),
    charityOrganizationId: v.id("charityOrganizations"),
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("confirmed")),
    sentAt: v.optional(v.number()),
    confirmationReference: v.optional(v.string()),
  })
    .index("by_order_id", ["orderId"])
    .index("by_charity", ["charityOrganizationId"]),

  // Recently viewed products
  recentlyViewedProducts: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    productId: v.id("products"),
    viewedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_product", ["userId", "productId"])
    .index("by_session_product", ["sessionId", "productId"]),

  // Return requests
  returnRequests: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    type: v.union(
      v.literal("return"), 
      v.literal("exchange"), 
      v.literal("refund"), 
      v.literal("dispute")
    ),
    reason: v.union(
      v.literal("defective"),
      v.literal("wrong_item"),
      v.literal("not_as_described"),
      v.literal("change_of_mind"),
      v.literal("damaged_in_shipping"),
      v.literal("size_issue"),
      v.literal("quality_issue"),
      v.literal("other")
    ),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    requestedAmount: v.optional(v.number()),
    approvedAmount: v.optional(v.number()),
    rmaNumber: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    
    // Selected items for return (if partial return)
    returnItems: v.array(v.object({
      orderItemIndex: v.number(), // Reference to order item
      quantity: v.number(),
      reason: v.string(),
    })),
    
    // Evidence attachments
    evidenceUrls: v.optional(v.array(v.string())),
    
    // Timeline tracking
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_order_id", ["orderId"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // Return messages for communication between customer and admin
  returnMessages: defineTable({
    returnRequestId: v.id("returnRequests"),
    senderId: v.id("users"),
    senderType: v.union(v.literal("customer"), v.literal("admin")),
    message: v.string(),
    messageType: v.union(v.literal("text"), v.literal("status_update"), v.literal("admin_response")),
    isRead: v.boolean(),
    attachments: v.optional(v.array(v.string())), // URLs for image attachments
  })
    .index("by_return_request", ["returnRequestId"])
    .index("by_sender", ["senderId"])
    .index("by_return_and_read", ["returnRequestId", "isRead"]),

  // Product shipping options
  productShippingOptions: defineTable({
    productId: v.id("products"),
    name: v.string(), // e.g., "Standard Shipping", "Express", "Overnight"
    description: v.string(), // e.g., "5-7 business days"
    price: v.number(), // Shipping cost in cents
    estimatedDays: v.object({
      min: v.number(),
      max: v.number(),
    }),
    isActive: v.boolean(),
    sortOrder: v.number(),
    // Shipping method details
    carrier: v.optional(v.string()), // e.g., "UPS", "FedEx", "USPS"
    serviceType: v.optional(v.string()), // e.g., "Ground", "2-Day", "Overnight"
  }).index("by_product_id", ["productId"]),

  // Site settings
  siteSettings: defineTable({
    key: v.string(),
    value: v.string(),
    type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean"), v.literal("json")),
  }).index("by_key", ["key"]),
}); 