import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, Package, Heart, MapPin, Shield, Leaf, Award, Gift, Plus, Edit2, Trash2, CreditCard, ShoppingCart, Check, RotateCcw, AlertTriangle, MessageSquare, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import ReturnRequestForm from '../returns/ReturnRequestForm'
import ReturnMessaging from '../returns/ReturnMessaging'

interface Address {
  _id: Id<"userAddresses">
  userId: Id<"users">
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
  _creationTime: number
}

interface PaymentMethod {
  _id: Id<"userPaymentMethods">
  userId: Id<"users">
  cardType: string
  last4Digits: string
  expiryMonth: string
  expiryYear: string
  nameOnCard: string
  isDefault: boolean
  stripePaymentMethodId?: string
  _creationTime: number
}

const UserAccountPage = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const { user, isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const location = useLocation()
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({})
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({})
  
  // Return request state
  const [showReturnRequestForm, setShowReturnRequestForm] = useState(false)
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any>(null)
  
  // Messaging state
  const [showMessaging, setShowMessaging] = useState(false)
  const [selectedReturnForMessaging, setSelectedReturnForMessaging] = useState<any>(null)

  // Convex queries and mutations
  const addresses = useQuery(api.addresses.getUserAddresses, 
    isAuthenticated && user ? { clerkUserId: user.id } : "skip"
  )
  const orders = useQuery(api.orders.getUserOrders,
    isAuthenticated && user ? { clerkUserId: user.id } : "skip"
  )
  const paymentMethods = useQuery(api.paymentMethods.getUserPaymentMethods,
    isAuthenticated && user ? { clerkUserId: user.id } : "skip"
  )
  
  // Get current user's Convex user ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkUserId: user.id } : "skip"
  )
  
  // Get user's wishlist
  const userWishlist = useQuery(
    api.wishlist.getUserWishlist,
    convexUser ? { userId: convexUser._id } : "skip"
  )
  
  // Get user's return requests
  const userReturnRequests = useQuery(
    api.returns.getUserReturnRequests,
    convexUser ? { userId: convexUser._id } : "skip"
  )
  
  // Wishlist mutation to remove items
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist)
  const addAddress = useMutation(api.addresses.addAddress)
  const updateAddress = useMutation(api.addresses.updateAddress)
  const deleteAddress = useMutation(api.addresses.deleteAddress)
  const addPaymentMethod = useMutation(api.paymentMethods.addPaymentMethod)
  const updatePaymentMethod = useMutation(api.paymentMethods.updatePaymentMethod)
  const deletePaymentMethod = useMutation(api.paymentMethods.deletePaymentMethod)
  
  // Return mutations
  const deleteReturnRequest = useMutation(api.returns.deleteReturnRequest)
  const unreadMessageCount = useQuery(
    api.returns.getUnreadReturnMessageCount,
    convexUser ? { userId: convexUser._id } : "skip"
  )

  // Address form state
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false
  })

  // Payment method form state
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    cardNumber: '',
    expiryDate: '',
    nameOnCard: '',
    isDefault: false
  })

  // Handle URL tab parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['profile', 'addresses', 'payment-methods', 'orders', 'returns', 'wishlist', 'impact', 'security'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [location.search])

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingAddress) {
        await updateAddress({
          addressId: editingAddress._id,
          ...addressForm
        })
      } else {
        await addAddress({
          clerkUserId: user.id,
          ...addressForm
        })
      }
      setShowAddressForm(false)
      setEditingAddress(null)
      resetAddressForm()
    } catch (error) {
      console.error('Failed to save address:', error)
    }
  }

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault
    })
    setEditingAddress(address)
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (addressId: Id<"userAddresses">) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress({ addressId })
      } catch (error) {
        console.error('Failed to delete address:', error)
      }
    }
  }

  const resetAddressForm = () => {
    setAddressForm({
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      isDefault: false
    })
  }

  const handlePaymentMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod({
          paymentMethodId: editingPaymentMethod._id,
          ...paymentMethodForm
        })
      } else {
        await addPaymentMethod({
          clerkUserId: user.id,
          ...paymentMethodForm
        })
      }
      setShowPaymentMethodForm(false)
      setEditingPaymentMethod(null)
      resetPaymentMethodForm()
    } catch (error) {
      console.error('Failed to save payment method:', error)
    }
  }

  const resetPaymentMethodForm = () => {
    setPaymentMethodForm({
      cardNumber: '',
      expiryDate: '',
      nameOnCard: '',
      isDefault: false
    })
  }
  
  const handleAddToCart = async (item: any) => {
    const productKey = item.productId
    setAddingToCart(prev => ({ ...prev, [productKey]: true }))
    
    try {
      const currentPrice = item.salePrice || item.basePrice
      
      // Add to cart with proper cart item structure
      addToCart({
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        basePrice: currentPrice,
        imageUrl: item.primaryImageUrl,
        quantity: 1
      })

      // Show success feedback
      setAddedToCart(prev => ({ ...prev, [productKey]: true }))
      setTimeout(() => {
        setAddedToCart(prev => ({ ...prev, [productKey]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(prev => ({ ...prev, [productKey]: false }))
    }
  }

  const handleRemoveFromWishlist = async (item: any) => {
    if (!convexUser) return
    
    try {
      await removeFromWishlist({
        userId: convexUser._id,
        productId: item.productId,
      })
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    }
  }

  const handleOpenReturnRequest = (order: any) => {
    setSelectedOrderForReturn(order)
    setShowReturnRequestForm(true)
  }

  const handleReturnRequestSuccess = () => {
    setShowReturnRequestForm(false)
    setSelectedOrderForReturn(null)
    // Optionally show success message
    alert('Return request submitted successfully! We will review your request within 24-48 hours.')
  }

  const handleReturnRequestCancel = () => {
    setShowReturnRequestForm(false)
    setSelectedOrderForReturn(null)
  }

  const handleOpenMessaging = (returnRequest: any) => {
    setSelectedReturnForMessaging(returnRequest)
    setShowMessaging(true)
  }

  const handleCloseMessaging = () => {
    setShowMessaging(false)
    setSelectedReturnForMessaging(null)
  }

  const handleDeleteReturnRequest = async (returnRequestId: Id<"returnRequests">) => {
    if (!convexUser) return
    
    if (confirm('Are you sure you want to delete this return request? This action cannot be undone.')) {
      try {
        await deleteReturnRequest({
          returnRequestId,
          userId: convexUser._id
        })
      } catch (error) {
        console.error('Failed to delete return request:', error)
        alert('Failed to delete return request. Please try again.')
      }
    }
  }

  const canRequestReturn = (order: any) => {
    // Only delivered orders can be returned
    if (order.status !== 'delivered') return false
    
    // Check if order is within return window (30 days)
    const deliveredDate = order.deliveredAt || order._creationTime
    const daysSinceDelivery = (Date.now() - deliveredDate) / (1000 * 60 * 60 * 24)
    
    return daysSinceDelivery <= 30
  }

  const hasExistingReturnRequest = (orderId: Id<"orders">) => {
    if (!userReturnRequests) return false
    
    // Return true if ANY return request exists for this order (user can only submit 1 return request per purchase)
    return userReturnRequests.some(request => request.orderId === orderId)
  }

  const TabButton = ({ id, label, icon: Icon, isActive }: {
    id: string
    label: string
    icon: React.ComponentType<any>
    isActive: boolean
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-stellamaris-100 text-stellamaris-800'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  )

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-8">You need to be signed in to access your account.</p>
          <Link to="/" className="bg-stellamaris-600 text-white px-6 py-3 rounded-md hover:bg-stellamaris-700 transition-colors">
            Go Home
          </Link>
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
            <span>My Account</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name || 'User'}!</h1>
          <p className="text-gray-600 mt-2">Manage your account and track your sustainable impact</p>
        </div>

        {/* Impact Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Methods</p>
                <p className="text-2xl font-bold text-gray-900">{paymentMethods?.length || 0}</p>
              </div>
              <CreditCard className="text-stellamaris-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saved Addresses</p>
                <p className="text-2xl font-bold text-gray-900">{addresses?.length || 0}</p>
              </div>
              <MapPin className="text-stellamaris-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-stellamaris-600">{orders?.length || 0}</p>
              </div>
              <Package className="text-stellamaris-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-2xl font-bold text-green-600">2024</p>
              </div>
              <Leaf className="text-green-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="text-2xl font-bold text-stellamaris-600">Standard</p>
              </div>
              <Gift className="text-stellamaris-600" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                <TabButton
                  id="profile"
                  label="Profile"
                  icon={User}
                  isActive={activeTab === 'profile'}
                />
                <TabButton
                  id="addresses"
                  label="Addresses"
                  icon={MapPin}
                  isActive={activeTab === 'addresses'}
                />
                <TabButton
                  id="payment-methods"
                  label="Payment Methods"
                  icon={CreditCard}
                  isActive={activeTab === 'payment-methods'}
                />
                <TabButton
                  id="orders"
                  label="Order History"
                  icon={Package}
                  isActive={activeTab === 'orders'}
                />
                <TabButton
                  id="returns"
                  label="Returns"
                  icon={RotateCcw}
                  isActive={activeTab === 'returns'}
                />
                <TabButton
                  id="wishlist"
                  label="Wishlist"
                  icon={Heart}
                  isActive={activeTab === 'wishlist'}
                />
                <TabButton
                  id="impact"
                  label="Sustainability Impact"
                  icon={Leaf}
                  isActive={activeTab === 'impact'}
                />
                <TabButton
                  id="security"
                  label="Security"
                  icon={Shield}
                  isActive={activeTab === 'security'}
                />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={user.name || ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Managed by your authentication provider</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Managed by your authentication provider</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        value={user.id}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                    <button 
                      onClick={() => {
                        resetAddressForm()
                        setEditingAddress(null)
                        setShowAddressForm(true)
                      }}
                      className="bg-stellamaris-600 text-white px-4 py-2 rounded-md hover:bg-stellamaris-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {showAddressForm && (
                    <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.firstName}
                              onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.lastName}
                              onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.addressLine1}
                            onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                          <input
                            type="text"
                            value={addressForm.addressLine2}
                            onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.zipCode}
                              onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="isDefault" className="text-sm text-gray-700">
                            Make this my default address
                          </label>
                        </div>

                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            className="bg-stellamaris-600 text-white px-6 py-2 rounded-md hover:bg-stellamaris-700 transition-colors"
                          >
                            {editingAddress ? 'Update Address' : 'Save Address'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false)
                              setEditingAddress(null)
                              resetAddressForm()
                            }}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div key={address._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {address.firstName} {address.lastName}
                                </h3>
                                {address.isDefault && (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-stellamaris-100 text-stellamaris-800">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>{address.addressLine1}</p>
                                {address.addressLine2 && <p>{address.addressLine2}</p>}
                                <p>{address.city}, {address.state} {address.zipCode}</p>
                                <p>{address.country}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="text-gray-600 hover:text-stellamaris-600 transition-colors p-1"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address._id)}
                                className="text-gray-600 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No saved addresses yet. Add your first address above!</p>
                  )}
                </div>
              )}

              {activeTab === 'payment-methods' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Saved Payment Methods</h2>
                    <button 
                      onClick={() => {
                        setShowPaymentMethodForm(true)
                        setEditingPaymentMethod(null)
                        resetPaymentMethodForm()
                      }}
                      className="bg-stellamaris-600 text-white px-4 py-2 rounded-md hover:bg-stellamaris-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Payment Method</span>
                    </button>
                  </div>

                  {showPaymentMethodForm && (
                    <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Add New Payment Method
                      </h3>
                      <form onSubmit={handlePaymentMethodSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="1234 5678 9012 3456"
                            value={paymentMethodForm.cardNumber}
                            onChange={(e) => setPaymentMethodForm({...paymentMethodForm, cardNumber: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              value={paymentMethodForm.expiryDate}
                              onChange={(e) => setPaymentMethodForm({...paymentMethodForm, expiryDate: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card *</label>
                            <input
                              type="text"
                              required
                              value={paymentMethodForm.nameOnCard}
                              onChange={(e) => setPaymentMethodForm({...paymentMethodForm, nameOnCard: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefaultPayment"
                            checked={paymentMethodForm.isDefault}
                            onChange={(e) => setPaymentMethodForm({...paymentMethodForm, isDefault: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="isDefaultPayment" className="text-sm text-gray-700">
                            Make this my default payment method
                          </label>
                        </div>

                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            className="bg-stellamaris-600 text-white px-6 py-2 rounded-md hover:bg-stellamaris-700 transition-colors"
                          >
                            Save Payment Method
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPaymentMethodForm(false)
                              setEditingPaymentMethod(null)
                              resetPaymentMethodForm()
                            }}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>

                      <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded">
                        <div className="flex items-start space-x-2">
                          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-blue-800">Security Information</p>
                            <p className="text-blue-700">
                              Only the last 4 digits, expiry date, and name will be stored securely. 
                              Full card details are never saved for your protection.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethods && paymentMethods.length > 0 ? (
                    <div className="space-y-4">
                      {paymentMethods.map((paymentMethod) => (
                        <div key={paymentMethod._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900 capitalize">
                                      {paymentMethod.cardType}
                                    </span>
                                    <span className="text-gray-600">•••• •••• •••• {paymentMethod.last4Digits}</span>
                                    {paymentMethod.isDefault && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-stellamaris-100 text-stellamaris-800">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{paymentMethod.nameOnCard}</p>
                                  <p className="text-sm text-gray-600">
                                    Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this payment method?')) {
                                    try {
                                      await deletePaymentMethod({ paymentMethodId: paymentMethod._id });
                                    } catch (error) {
                                      console.error('Failed to delete payment method:', error);
                                    }
                                  }
                                }}
                                className="text-gray-600 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded">
                            <div className="flex items-start space-x-2">
                              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-blue-800">Secure Payment Method</p>
                                <p className="text-blue-700">
                                  Only the last 4 digits and expiry date are stored. Full card details are never saved for your security.
                                  New payment methods will be added when you make purchases.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No saved payment methods yet.</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Add a payment method above for faster checkout.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>
                  
                  {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order._id} className="border border-gray-200 rounded-lg p-6">
                          {/* Order Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-gray-600">
                                Placed on {new Date(order._creationTime).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <div>
                                    <span className="text-gray-900">{item.productName}</span>
                                    {item.variantName && (
                                      <span className="text-gray-600"> - {item.variantName}</span>
                                    )}
                                    <span className="text-gray-600"> (Qty: {item.quantity})</span>
                                  </div>
                                  <span className="text-gray-900">${item.totalPrice.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Shipping Address:</h4>
                            <div className="text-sm text-gray-600">
                              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                              <p>{order.shippingAddress.addressLine1}</p>
                              {order.shippingAddress.addressLine2 && (
                                <p>{order.shippingAddress.addressLine2}</p>
                              )}
                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                              <p>{order.shippingAddress.country}</p>
                            </div>
                          </div>

                          {/* Tracking Info */}
                          {order.trackingNumber && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Tracking Information:</h4>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-600 font-mono">{order.trackingNumber}</p>
                                <button
                                  onClick={() => {
                                    // Future: This will link to shipping carrier tracking page
                                    navigator.clipboard.writeText(order.trackingNumber || '');
                                    alert('Tracking number copied to clipboard!');
                                  }}
                                  className="text-stellamaris-600 hover:text-stellamaris-700 text-sm underline"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Track your shipment using this number on your carrier's website
                              </p>
                            </div>
                          )}

                          {/* Charity Impact */}
                          {order.charityDonationAmount > 0 && (
                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Heart className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-800">
                                  You donated ${order.charityDonationAmount.toFixed(2)} to {
                                    order.selectedCharityType === 'animal_shelter' ? 'Animal Shelters' :
                                    order.selectedCharityType === 'environmental' ? 'Environmental Causes' :
                                    order.selectedCharityType === 'children' ? 'Children\'s Education' :
                                    order.selectedCharityType === 'education' ? 'Adult Education' :
                                    'Charity'
                                  }
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Order Total */}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <span className="text-lg font-semibold text-gray-900">Total:</span>
                            <span className="text-lg font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                          </div>

                          {/* Return Request Actions for Delivered Orders */}
                          {order.status === 'delivered' && convexUser && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Return Request</h4>
                                {canRequestReturn(order) && (
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                    Return window open ({Math.max(0, 30 - Math.floor((Date.now() - (order.deliveredAt || order._creationTime)) / (1000 * 60 * 60 * 24)))} days left)
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                {hasExistingReturnRequest(order._id) ? (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Return request already submitted for this order</span>
                                  </div>
                                ) : canRequestReturn(order) ? (
                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => handleOpenReturnRequest(order)}
                                      className="flex items-center space-x-2 bg-stellamaris-600 text-white px-4 py-2 rounded-lg hover:bg-stellamaris-700 text-sm transition-colors"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                      <span>Request Return</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                    Return window expired (30 days from delivery)
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No orders yet. Start shopping to see your order history!</p>
                      <Link to="/bags" className="bg-stellamaris-600 text-white px-6 py-3 rounded-md hover:bg-stellamaris-700 transition-colors inline-block">
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'returns' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Returns & Return Requests</h2>
                  
                  {/* Show delivered orders eligible for return */}
                  {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                      {/* Eligible for Return Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligible for Return</h3>
                        {orders.filter(order => order.status === 'delivered' && canRequestReturn(order) && !hasExistingReturnRequest(order._id)).length > 0 ? (
                          <div className="space-y-4">
                            {orders
                              .filter(order => order.status === 'delivered' && canRequestReturn(order) && !hasExistingReturnRequest(order._id))
                              .map(order => (
                                <div key={order._id} className="border border-gray-200 rounded-lg p-6 bg-green-50">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <h4 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h4>
                                      <p className="text-sm text-gray-600">
                                        Delivered on {new Date(order.deliveredAt || order._creationTime).toLocaleDateString()}
                                      </p>
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-2 inline-block">
                                        Return window open ({Math.max(0, 30 - Math.floor((Date.now() - (order.deliveredAt || order._creationTime)) / (1000 * 60 * 60 * 24)))} days left)
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-lg font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    <h5 className="font-medium text-gray-900 mb-2">Items:</h5>
                                    <div className="space-y-1">
                                      {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                          <div>
                                            <span className="text-gray-900">{item.productName}</span>
                                            {item.variantName && (
                                              <span className="text-gray-600"> - {item.variantName}</span>
                                            )}
                                            <span className="text-gray-600"> (Qty: {item.quantity})</span>
                                          </div>
                                          <span className="text-gray-900">${item.totalPrice.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleOpenReturnRequest(order)}
                                    className="flex items-center space-x-2 bg-stellamaris-600 text-white px-4 py-2 rounded-lg hover:bg-stellamaris-700 text-sm transition-colors"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    <span>Request Return</span>
                                  </button>
                                </div>
                              ))
                            }
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-gray-600">No orders currently eligible for return</p>
                          </div>
                        )}
                      </div>

                      {/* Return Requests Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Return Requests</h3>
                        {userReturnRequests && userReturnRequests.length > 0 ? (
                          <div className="space-y-4">
                            {userReturnRequests.map(request => (
                              <div key={request._id} className="border border-gray-200 rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      Return Request for Order #{request.orderNumber}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Submitted on {new Date(request.submittedAt).toLocaleDateString()}
                                    </p>
                                    {request.rmaNumber && (
                                      <p className="text-sm text-gray-600 font-mono">
                                        RMA: {request.rmaNumber}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                      request.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Reason:</span> {request.reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Description:</span> {request.description}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-900">Return Items:</h5>
                                  {request.returnItems.map((item, index) => (
                                    <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      Item {item.orderItemIndex + 1}: Quantity {item.quantity}
                                      {item.reason && (
                                        <span className="block text-xs">Reason: {item.reason}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {request.status === 'approved' && (
                                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-800">
                                      ✓ Your return has been approved. Please follow the return instructions sent to your email.
                                    </p>
                                  </div>
                                )}

                                {request.status === 'rejected' && (
                                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                                    <p className="text-sm text-red-800">
                                      ✗ Your return request was not approved. Please contact customer service for more information.
                                    </p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() => handleOpenMessaging(request)}
                                      className="inline-flex items-center space-x-2 text-stellamaris-600 hover:text-stellamaris-700 text-sm font-medium transition-colors"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      <span>Messages</span>
                                      {unreadMessageCount && unreadMessageCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                                          {unreadMessageCount}
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                  
                                  {request.status === 'pending' && (
                                    <button
                                      onClick={() => handleDeleteReturnRequest(request._id)}
                                      className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>Delete Request</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <RotateCcw className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-gray-600">No return requests submitted yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No orders yet. You'll be able to manage returns here once you have delivered orders.</p>
                      <Link to="/bags" className="bg-stellamaris-600 text-white px-6 py-3 rounded-md hover:bg-stellamaris-700 transition-colors inline-block">
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Wishlist</h2>
                    <Link to="/wishlist" className="text-stellamaris-600 hover:text-stellamaris-700 text-sm font-medium">
                      View full wishlist
                    </Link>
                  </div>
                  
                  {userWishlist && userWishlist.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userWishlist.slice(0, 3).map((item) => (
                        <div key={item._id} className="flex border border-gray-200 rounded-lg overflow-hidden">
                          <Link to={`/product/${item.productSlug}`} className="flex-shrink-0 w-24 h-24">
                            <img 
                              src={item.primaryImageUrl || 'https://via.placeholder.com/100'} 
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          <div className="flex-1 p-3 flex flex-col">
                            <Link to={`/product/${item.productSlug}`} className="text-gray-900 font-medium hover:text-stellamaris-600 line-clamp-1">
                              {item.productName}
                            </Link>
                            <div className="mt-1 mb-2">
                              {item.salePrice ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-bold">${item.salePrice}</span>
                                  <span className="text-xs text-gray-500 line-through">${item.basePrice}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold">${item.basePrice}</span>
                              )}
                            </div>
                            <div className="mt-auto flex gap-2">
                              <button 
                                onClick={() => handleRemoveFromWishlist(item)}
                                className="text-xs text-gray-600 hover:text-red-500"
                              >
                                Remove
                              </button>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="text-xs text-stellamaris-600 hover:text-stellamaris-700"
                              >
                                Add to cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600">Your wishlist is empty. Start adding items you love!</p>
                      <Link to="/bags" className="bg-stellamaris-600 text-white px-6 py-3 rounded-md hover:bg-stellamaris-700 transition-colors mt-4 inline-block">
                        Browse Products
                      </Link>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'impact' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Your Sustainability Impact</h2>
                  <p className="text-gray-600">Your sustainability impact will be tracked here as you make purchases and support our charity partners.</p>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                  <p className="text-gray-600">Your account security is managed by Clerk. You can update your password and security settings through your authentication provider.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Request Form Modal */}
      {showReturnRequestForm && selectedOrderForReturn && convexUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <ReturnRequestForm
              order={selectedOrderForReturn}
              userId={convexUser._id}
              onSuccess={handleReturnRequestSuccess}
              onCancel={handleReturnRequestCancel}
            />
          </div>
        </div>
      )}

      {/* Return Messaging Modal */}
      {showMessaging && selectedReturnForMessaging && convexUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-hidden w-full">
            <ReturnMessaging
              returnRequestId={selectedReturnForMessaging._id}
              userId={convexUser._id}
              userName={convexUser?.name || user?.name || 'User'}
              onClose={handleCloseMessaging}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default UserAccountPage 