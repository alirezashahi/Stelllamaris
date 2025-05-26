import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCart } from './CartContext';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  const { transferGuestCartToUser, loadUserCart } = useCart();
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const [hasProcessedUser, setHasProcessedUser] = useState(false);
  const processedUserIdRef = useRef<string | null>(null);

  // Handle user creation and cart transfer when user authentication state changes
  useEffect(() => {
    // Only process if we have a loaded user and haven't processed this specific user yet
    if (isLoaded && user && !hasProcessedUser && processedUserIdRef.current !== user.id) {
      const handleUserLogin = async () => {
        setHasProcessedUser(true);
        processedUserIdRef.current = user.id;
        
        try {
          console.log('Processing user login for:', user.id);
          
          // First, create or get user in Convex database
          await createOrGetUser({
            clerkUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || user.firstName || '',
            role: user.publicMetadata?.role as string || 'customer',
          });
          
          // Then, transfer any guest cart items to the user
          await transferGuestCartToUser(user.id);
          
          // Finally, load the user's existing cart from backend
          await loadUserCart(user.id);
          
          console.log('User processing completed for:', user.id);
        } catch (error) {
          console.error('Failed to handle user login:', error);
          // Reset on error so it can be retried
          setHasProcessedUser(false);
          processedUserIdRef.current = null;
        }
      };

      handleUserLogin();
    }
  }, [isLoaded, user?.id]); // Minimal dependencies - only what actually changes

  // Reset processing state when user changes or logs out
  useEffect(() => {
    if (!user) {
      setHasProcessedUser(false);
      processedUserIdRef.current = null;
    }
  }, [user?.id]);

  const handleSignIn = useCallback(() => {
    openSignIn();
  }, [openSignIn]);

  const handleSignOut = useCallback(() => {
    signOut();
    // Reset processing state on sign out
    setHasProcessedUser(false);
    processedUserIdRef.current = null;
  }, [signOut]);

  // Check if user is admin from Clerk metadata
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const value: AuthContextType = {
    user: user ? {
      id: user.id,
      name: user.fullName || user.firstName || '',
      email: user.primaryEmailAddress?.emailAddress || '',
      role: user.publicMetadata?.role as string || 'customer',
    } : null,
    isLoading: !isLoaded,
    isAuthenticated: !!user,
    isAdmin,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 