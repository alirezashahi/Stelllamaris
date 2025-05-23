# Clerk Authentication Setup Guide for Stellamaris

## Overview
This guide will help you integrate Clerk authentication into the Stellamaris e-commerce platform. Clerk provides a complete authentication solution with user management, social logins, and security features.

## Prerequisites
- ✅ Convex backend is running without errors
- ✅ @clerk/clerk-react package is installed
- ✅ Placeholder auth context is ready for replacement

## Step 1: Create Clerk Account and Application

1. **Sign up for Clerk**
   - Go to [clerk.com](https://clerk.com)
   - Create a free account
   - Create a new application named "Stellamaris E-commerce"

2. **Get API Keys**
   - In your Clerk dashboard, go to API Keys
   - Copy the Publishable Key (starts with `pk_`)
   - Copy the Secret Key (starts with `sk_`)

3. **Configure Environment Variables**
   Create a `.env.local` file in your project root:
   ```env
   # Convex
   VITE_CONVEX_URL=your-convex-deployment-url-here
   
   # Clerk Authentication
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   ```

## Step 2: Update Vite Types

Update `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Step 3: Configure Clerk Provider

Update `src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
```

## Step 4: Update Auth Context

Replace `src/contexts/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();

  const handleSignIn = () => {
    openSignIn();
  };

  const handleSignOut = () => {
    signOut();
  };

  const value: AuthContextType = {
    user: user ? {
      id: user.id,
      name: user.fullName || '',
      email: user.primaryEmailAddress?.emailAddress || '',
    } : null,
    isLoading: !isLoaded,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Step 5: Update Login Modal

Replace `src/components/auth/LoginModal.tsx`:
```typescript
import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="mt-4">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-stellamaris-600 hover:bg-stellamaris-700',
                footerActionLink: 'text-stellamaris-600 hover:text-stellamaris-700'
              }
            }}
            afterSignInUrl="/"
            afterSignUpUrl="/"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
```

## Step 6: Configure Clerk Authentication Methods

In your Clerk dashboard:

1. **Social Providers**
   - Go to User & Authentication > Social Connections
   - Enable Google, GitHub, or other providers you want
   - Configure OAuth credentials for each provider

2. **Email/Password**
   - Go to User & Authentication > Email, Phone, Username
   - Enable email address as an identifier
   - Configure password requirements

3. **Styling**
   - Go to Customization > Appearance
   - Customize colors to match Stellamaris branding
   - Primary color: `#059669` (stellamaris-600)

## Step 7: Add Convex-Clerk Integration (Optional)

If you want to sync user data between Clerk and Convex:

1. Install Convex Clerk integration:
   ```bash
   npm install @convex-dev/auth
   ```

2. Create webhook in Clerk dashboard:
   - Endpoint URL: `https://your-convex-url/api/clerk-webhook`
   - Events: `user.created`, `user.updated`, `user.deleted`

3. Add webhook handler to `convex/http.ts`:
   ```typescript
   import { httpRouter } from "convex/server";
   import { httpAction } from "./_generated/server";
   
   const http = httpRouter();
   
   // Clerk webhook handler
   http.route({
     path: "/clerk-webhook",
     method: "POST",
     handler: httpAction(async (ctx, request) => {
       // Handle Clerk webhook events
       const payload = await request.json();
       // Sync user data with Convex
       return new Response("OK", { status: 200 });
     }),
   });
   
   export default http;
   ```

## Step 8: Update Protected Routes

Add route protection where needed:

```typescript
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

// Wrap protected components
<SignedIn>
  <UserAccountPage />
</SignedIn>
<SignedOut>
  <RedirectToSignIn />
</SignedOut>
```

## Step 9: Test Authentication

1. Start your development server: `npm run dev`
2. Start Convex: `npx convex dev`
3. Test sign up/sign in functionality
4. Verify user data appears correctly
5. Test sign out functionality

## Step 10: Update Header Component

The Header component should already work with the updated AuthContext, but verify:
- Login modal opens correctly
- User dropdown shows when authenticated
- Sign out works properly

## Production Considerations

1. **Environment Variables**: Set production keys in your deployment platform
2. **Domain Configuration**: Add your production domain to Clerk allowed origins
3. **User Data Sync**: Implement proper user creation in Convex when users sign up
4. **Error Handling**: Add proper error boundaries and fallbacks

## Troubleshooting

**Common Issues:**
- Missing environment variables: Check `.env.local` file
- CORS errors: Verify domain settings in Clerk dashboard
- Styling issues: Customize Clerk appearance to match your theme
- User data not syncing: Implement webhook handlers properly

## Next Steps After Clerk Setup

Once authentication is working:
1. ✅ Update user account pages to show real user data
2. ✅ Connect checkout process to authenticated users
3. ✅ Implement order history functionality
4. ✅ Add user-specific wishlist and cart persistence

---

**Need Help?**
- Clerk Documentation: [docs.clerk.com](https://docs.clerk.com)
- Convex + Clerk Guide: [docs.convex.dev/auth/clerk](https://docs.convex.dev/auth/clerk)
- Community Support: Clerk Discord or Convex Discord 