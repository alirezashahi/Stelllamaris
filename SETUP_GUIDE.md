# Stellamaris E-commerce Setup Guide

## Environment Configuration

To run the application, you need to set up the following environment variables:

### 1. Create `.env.local` file in the project root:

```bash
# Convex Backend
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Clerk Authentication  
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

### 2. Get your Convex URL:
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Copy the deployment URL

### 3. Get your Clerk Publishable Key:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to "API Keys" 
4. Copy the "Publishable Key"

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start Convex development server:
```bash
npx convex dev
```

3. Start React development server:
```bash
npm run dev
```

## New Features Implemented

### Guest Checkout with Authentication Flow

- ✅ **Guest users can browse and add items to cart without signing in**
- ✅ **Users can complete shipping information without authentication**  
- ✅ **Authentication is required only at the payment step**
- ✅ **Checkout data is preserved during sign-in process**
- ✅ **Automatic cart transfer when users authenticate**

### How it works:

1. **Browse & Add to Cart**: Users can add items from any page (/bags, homepage, product details)
2. **Start Checkout**: Users proceed through shipping information step without signing in
3. **Payment Step**: When attempting to proceed to payment, users are prompted to sign in
4. **Authentication**: Clerk sign-in modal appears, checkout data is preserved in localStorage
5. **Complete Order**: After authentication, users are automatically taken to order review
6. **Cart Transfer**: Guest cart items are automatically transferred to user account

This maximizes conversion by letting users get invested in the purchase before requiring authentication! 