import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

const CartPage = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, setItemShippingOption } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string, discount: number } | null>(null)

  // Component for individual cart item with shipping options
  const CartItemComponent: React.FC<{ item: any }> = ({ item }) => {
    const shippingOptions = useQuery(
      api.shippingOptions.getProductShippingOptions,
      { productId: item.productId as unknown as Id<'products'> }
    )
    const formatPrice = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
    
    const itemPrice = item.basePrice + (item.variant?.priceAdjustment || 0)
    const itemTotal = itemPrice * item.quantity

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={item.imageUrl || 'https://via.placeholder.com/96x96'}
              alt={item.productName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  <Link 
                    to={`/product/${item.productSlug}`}
                    className="hover:text-stellamaris-600 transition-colors"
                  >
                    {item.productName}
                  </Link>
                </h3>
                {item.variant && (
                  <p className="text-sm text-gray-600 mt-1">
                    {item.variant.name}
                    {item.variant.priceAdjustment !== 0 && (
                      <span className="ml-2">
                        ({item.variant.priceAdjustment > 0 ? '+' : ''}${item.variant.priceAdjustment})
                      </span>
                    )}
                  </p>
                )}
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">Delivery option</label>
                  <select
                    value={item.shippingOption?.id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value as unknown as Id<'productShippingOptions'>
                      const selected = shippingOptions?.find(opt => opt._id === selectedId)
                      const option = selected
                        ? {
                            id: selected._id,
                            name: selected.name,
                            description: selected.description,
                            price: selected.price,
                            estimatedDays: selected.estimatedDays,
                          }
                        : undefined
                      setItemShippingOption(item.productId, item.variant?.id, option)
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="">Select an option</option>
                    {shippingOptions?.map(opt => (
                      <option key={opt._id} value={opt._id as unknown as string}>
                        {opt.name} {opt.price === 0 ? '(Free)' : `(${formatPrice(opt.price)})`}
                      </option>
                    ))}
                  </select>
                  {item.shippingOption && (
                    <p className="text-xs text-blue-600 mt-1">
                      {item.shippingOption.name} - {formatPrice(item.shippingOption.price)}
                      <span className="text-gray-500 ml-1">({item.shippingOption.description})</span>
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900 mt-2">${itemPrice}</p>
              </div>

              <button
                onClick={() => handleRemoveItem(item.productId, item.variant?.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.variant?.id)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.variant?.id)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">${itemTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleQuantityChange = (productId: string, newQuantity: number, variantId?: string) => {
    updateQuantity(productId, newQuantity, variantId)
  }

  const handleRemoveItem = (productId: string, variantId?: string) => {
    removeFromCart(productId, variantId)
  }

  const handleApplyPromo = () => {
    // TODO: Implement promo code validation with backend
    // For now, mock validation
    const mockPromoCodes = {
      'WELCOME10': 0.10,
      'SAVE20': 0.20,
      'FIRST15': 0.15
    }

    const discount = mockPromoCodes[promoCode.toUpperCase() as keyof typeof mockPromoCodes]
    if (discount) {
      setAppliedPromo({ code: promoCode.toUpperCase(), discount })
      setPromoCode('')
    } else {
      alert('Invalid promo code')
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
  }

  // Calculate shipping from cart items' selected options
  const calculateShippingCost = () => {
    let totalShipping = 0;
    let hasShippingOptions = false;

    items.forEach(item => {
      if (item.shippingOption) {
        totalShipping += (item.shippingOption.price / 100) * item.quantity; // Convert cents to dollars
        hasShippingOptions = true;
      }
    });

    // If no shipping options selected, use fallback logic
    if (!hasShippingOptions) {
      return subtotal > 500 ? 0 : 25; // Original fallback
    }

    return totalShipping;
  };

  const subtotal = getTotalPrice()
  const promoDiscount = appliedPromo ? subtotal * appliedPromo.discount : 0
  const charityDonation = subtotal * 0.05 // 5% charity donation
  const shipping = calculateShippingCost()
  const total = subtotal - promoDiscount + shipping

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-xl text-gray-600 mb-8">
              Start shopping to add items to your cart
            </p>
            <Link to="/bags" className="btn-primary inline-flex items-center space-x-2">
              <ArrowLeft size={20} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-stellamaris-600">Home</Link>
            <span className="mx-2">/</span>
            <span>Shopping Cart</span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItemComponent key={`${item.productId}-${item.variant?.id || 'default'}`} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Promo Code</h3>
              {!appliedPromo ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    className="btn-outline px-4 py-2 whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center text-green-800">
                    <Tag size={16} className="mr-2" />
                    <span className="font-medium">{appliedPromo.code}</span>
                    <span className="ml-2">(-{(appliedPromo.discount * 100).toFixed(0)}%)</span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount ({appliedPromo.code})</span>
                    <span>-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between text-stellamaris-600 text-sm">
                  <span>Charity Donation (5%)</span>
                  <span>${charityDonation.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link 
                  to="/checkout"
                  className="w-full btn-primary block text-center py-3 text-lg font-semibold"
                >
                  Proceed to Checkout
                </Link>
                <Link 
                  to="/bags" 
                  className="w-full btn-outline block text-center py-3"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Charity Info */}
              <div className="mt-6 p-4 bg-sage-50 rounded-lg">
                <h4 className="font-semibold text-sage-800 mb-2">Supporting Our Mission</h4>
                <p className="text-sm text-sage-700">
                  ${charityDonation.toFixed(2)} from your order will be donated to animal shelters 
                  and environmental causes. Thank you for making a difference!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage 