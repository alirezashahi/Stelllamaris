import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export interface CartItem {
  productId: string
  productName: string
  productSlug: string
  variant?: {
    id: string
    name: string
    priceAdjustment: number
  }
  quantity: number
  basePrice: number
  imageUrl?: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  transferGuestCartToUser: (clerkUserId: string) => Promise<void>
  loadUserCart: (clerkUserId: string) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

const GUEST_CART_STORAGE_KEY = 'stellamaris_guest_cart'

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Convex mutations
  const syncGuestCartMutation = useMutation(api.cart.syncGuestCart)

  // Load guest cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setItems(parsedCart)
      } catch (error) {
        console.error('Failed to parse saved cart:', error)
        localStorage.removeItem(GUEST_CART_STORAGE_KEY)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save cart to localStorage whenever it changes (for guest users only)
  useEffect(() => {
    if (isInitialized && !currentUserId) {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isInitialized, currentUserId])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = item.quantity || 1
    const variantId = item.variant?.id

    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        cartItem => 
          cartItem.productId === item.productId && 
          cartItem.variant?.id === variantId
      )

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, { ...item, quantity }]
      }
    })
  }, [])

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        !(item.productId === productId && item.variant?.id === variantId)
      )
    )
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId && item.variant?.id === variantId
          ? { ...item, quantity }
          : item
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setItems([])
    if (!currentUserId) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY)
    }
  }, [currentUserId])

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }, [items])

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => {
      const itemPrice = item.basePrice + (item.variant?.priceAdjustment || 0)
      return total + (itemPrice * item.quantity)
    }, 0)
  }, [items])

  // Transfer guest cart to user's account when they log in
  const transferGuestCartToUser = useCallback(async (clerkUserId: string) => {
    try {
      console.log('Transferring guest cart to user:', clerkUserId);
      
      if (items.length === 0) {
        console.log('No guest cart items to transfer');
        return;
      }

      // Use Clerk user ID instead of treating it as Convex user ID
      await syncGuestCartMutation({
        clerkUserId: clerkUserId, // Pass Clerk user ID directly
        guestCartItems: items.map(item => ({
          ...item,
          productId: item.productId as any, // Type assertion for Convex ID
        })),
      });

      // Clear guest cart
      setItems([]);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      
      console.log('Guest cart transferred successfully');
    } catch (error) {
      console.error('Failed to transfer guest cart to user:', error);
    }
  }, [items, syncGuestCartMutation]);

  // Load user's cart from backend when they log in
  const loadUserCart = useCallback(async (clerkUserId: string) => {
    try {
      console.log('Loading cart for user', clerkUserId);
      
      // For now, since getUserCart expects a Convex user ID,
      // we'll need to implement a different approach
      // The cart will be loaded properly once the user interacts with it
      setCurrentUserId(clerkUserId);
      setItems([]);
    } catch (error) {
      console.error('Failed to load user cart:', error);
    }
  }, []);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    transferGuestCartToUser,
    loadUserCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 