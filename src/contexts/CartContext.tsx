import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export interface CartItem {
  // Present when loaded from server for authenticated users
  cartItemId?: any // Convex ID type
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
  shippingOption?: {
    id: string
    name: string
    description: string
    price: number // in cents
    estimatedDays: {
      min: number
      max: number
    }
  }
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  setItemShippingOption: (
    productId: string,
    variantId: string | undefined,
    option: NonNullable<CartItem['shippingOption']> | undefined
  ) => void
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
const SHIPPING_PREFS_STORAGE_KEY = 'stellamaris_shipping_prefs'

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Convex mutations
  const syncGuestCartMutation = useMutation(api.cart.syncGuestCart)
  const updateCartItemQuantityMutation = useMutation(api.cart.updateCartItemQuantity)
  const removeFromUserCartMutation = useMutation(api.cart.removeFromUserCart)
  
  // When authenticated, derive Convex user and fetch server cart
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    currentUserId ? { clerkUserId: currentUserId } : "skip"
  )
  const userCart = useQuery(
    api.cart.getUserCart,
    convexUser ? { userId: convexUser._id } : "skip"
  )

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

  // Hydrate items from server for authenticated users
  useEffect(() => {
    if (currentUserId && Array.isArray(userCart)) {
      // Map server cart format to CartItem
      const mapped: CartItem[] = userCart.map((serverItem: any) => ({
        cartItemId: serverItem._id,
        productId: serverItem.productId,
        productName: serverItem.productName,
        productSlug: serverItem.productSlug,
        variant: serverItem.variant
          ? {
              id: serverItem.variant.id,
              name: serverItem.variant.name,
              priceAdjustment: serverItem.variant.priceAdjustment,
            }
          : undefined,
        quantity: serverItem.quantity,
        basePrice: serverItem.basePrice,
        imageUrl: serverItem.imageUrl,
      }))

      // Merge any locally stored shipping preferences for session continuity
      try {
        const rawPrefs = localStorage.getItem(SHIPPING_PREFS_STORAGE_KEY)
        const prefs = rawPrefs ? JSON.parse(rawPrefs) as Record<string, NonNullable<CartItem['shippingOption']>> : {}
        const withPrefs = mapped.map(item => {
          const key = `${item.productId}__${item.variant?.id || 'default'}`
          return prefs[key] ? { ...item, shippingOption: prefs[key] } : item
        })
        setItems(withPrefs)
      } catch {
        setItems(mapped)
      }
    }
  }, [currentUserId, userCart])

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
      prevItems.filter(item => !(item.productId === productId && item.variant?.id === variantId))
    )

    // If authenticated, also remove from server cart
    if (currentUserId) {
      // Find the item we just removed to get its server cart item id
      const itemToRemove = items.find(
        i => i.productId === productId && i.variant?.id === variantId
      )
      if (itemToRemove?.cartItemId) {
        removeFromUserCartMutation({ cartItemId: itemToRemove.cartItemId as any }).catch((err) => {
          console.error('Failed to remove item from server cart:', err)
        })
      }
    }
  }, [currentUserId, items, removeFromUserCartMutation])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    // Optimistic local update
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.variant?.id === variantId
          ? { ...item, quantity }
          : item
      )
    )

    // If authenticated, sync to server
    if (currentUserId) {
      const target = items.find(
        i => i.productId === productId && i.variant?.id === variantId
      )
      if (target?.cartItemId) {
        updateCartItemQuantityMutation({ cartItemId: target.cartItemId as any, quantity }).catch((err) => {
          console.error('Failed to update server cart quantity:', err)
        })
      }
    }
  }, [currentUserId, items, removeFromCart, updateCartItemQuantityMutation])

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

  const setItemShippingOption = useCallback((
    productId: string,
    variantId: string | undefined,
    option: NonNullable<CartItem['shippingOption']> | undefined
  ) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.variant?.id === variantId
          ? { ...item, shippingOption: option }
          : item
      )
    )

    // Persist to local storage for session continuity (works for guests and logged-in between refreshes)
    try {
      const raw = localStorage.getItem(SHIPPING_PREFS_STORAGE_KEY)
      const prefs: Record<string, NonNullable<CartItem['shippingOption']>> = raw ? JSON.parse(raw) : {}
      const key = `${productId}__${variantId || 'default'}`
      if (option) {
        prefs[key] = option
      } else {
        delete prefs[key]
      }
      localStorage.setItem(SHIPPING_PREFS_STORAGE_KEY, JSON.stringify(prefs))
    } catch {}
  }, [])

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
      
      // Set current user; reactive queries above will hydrate the cart
      setCurrentUserId(clerkUserId);
    } catch (error) {
      console.error('Failed to load user cart:', error);
    }
  }, []);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    setItemShippingOption,
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