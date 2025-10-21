import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Heart, ArrowLeft, UserPlus, LogIn, MapPin, Percent, Plus } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckout, type ShippingInfo, type PaymentInfo } from '../../contexts/CheckoutContext';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PromoCodeInput from '../checkout/PromoCodeInput';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Id } from '../../../convex/_generated/dataModel';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const CheckoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { items: cartItems, getTotalPrice, clearCart, setItemShippingOption } = useCart();
  const { user, isAuthenticated, signIn } = useAuth();
  const {
    shippingInfo,
    paymentInfo,
    selectedCharity,
    donationAmount,
    currentStep,
    isProcessing,
    saveNewAddress,
    saveNewPaymentMethod,
    updateShippingInfo,
    updatePaymentInfo,
    setSelectedCharity,
    setDonationAmount,
    setCurrentStep,
    setIsProcessing,
    setSaveNewAddress,
    setSaveNewPaymentMethod,
    clearCheckoutData,
    preserveCheckoutData,
    restoreCheckoutData,
  } = useCheckout();

  const stripe = useStripe();
  const elements = useElements();

  // State for saved addresses and discount functionality
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [showSavedPaymentMethods, setShowSavedPaymentMethods] = useState(false);
  const [isUsingExistingPaymentMethod, setIsUsingExistingPaymentMethod] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string;
    discountAmount: number;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    promoCodeId: string;
  } | null>(null);
  
  // Stripe card validation state
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const createPaymentIntent = useAction(api.payments.createPaymentIntent);

  // Fetch saved addresses and payment methods for authenticated users
  const savedAddresses = useQuery(
    api.addresses.getUserAddresses,
    isAuthenticated && user ? { clerkUserId: user.id } : "skip"
  );

  const savedPaymentMethods = useQuery(
    api.paymentMethods.getUserPaymentMethods,
    isAuthenticated && user ? { clerkUserId: user.id } : "skip"
  );

  // Order creation and address/payment mutations
  const createOrder = useMutation(api.orders.createOrder);
  const addAddress = useMutation(api.addresses.addAddress);
  // const addPaymentMethod = useMutation(api.paymentMethods.addPaymentMethod); // Disabled: do not store raw card data
  const sendOrderConfirmationEmail = useAction(api.emails.sendOrderConfirmationEmail);

  // Per-item shipping selector to avoid hooks in loops
  const ItemShippingOptionSelector: React.FC<{
    productId: string;
    variantId?: string;
    valueId?: string;
    onChange: (option: any) => void;
  }> = ({ productId, variantId, valueId, onChange }) => {
    const options = useQuery(
      api.shippingOptions.getProductShippingOptions,
      { productId: productId as unknown as Id<'products'> }
    );

    return (
      <select
        value={valueId || ''}
        onChange={(e) => {
          const selectedId = e.target.value as unknown as Id<'productShippingOptions'>
          const selected = options?.find(opt => opt._id === selectedId)
          const option = selected
            ? {
                id: selected._id,
                name: selected.name,
                description: selected.description,
                price: selected.price,
                estimatedDays: selected.estimatedDays,
              }
            : undefined
          onChange(option)
        }}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
      >
        <option value="">Select option</option>
        {options?.map(opt => (
          <option key={opt._id} value={opt._id as unknown as string}>
            {opt.name} {opt.price === 0 ? '(Free)' : `($${(opt.price/100).toFixed(2)})`}
          </option>
        ))}
      </select>
    );
  };

  const [shippingError, setShippingError] = useState<string | null>(null);

  // Populate user data if authenticated (but don't overwrite existing data)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only populate empty fields to avoid overwriting user input
      const updates: Partial<ShippingInfo> = {};
      
      if (!shippingInfo.firstName && user.name?.split(' ')[0]) {
        updates.firstName = user.name.split(' ')[0];
      }
      if (!shippingInfo.lastName && user.name?.split(' ')[1]) {
        updates.lastName = user.name.split(' ')[1];
      }
      if (!shippingInfo.email && user.email) {
        updates.email = user.email;
      }
      
      // Auto-populate with default address if available
      if (savedAddresses && savedAddresses.length > 0 && !shippingInfo.addressLine1) {
        const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
        if (defaultAddress) {
          Object.assign(updates, {
            firstName: defaultAddress.firstName,
            lastName: defaultAddress.lastName,
            addressLine1: defaultAddress.addressLine1,
            addressLine2: defaultAddress.addressLine2 || '',
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode,
            country: defaultAddress.country
          });
        }
      }
      
      if (Object.keys(updates).length > 0) {
        updateShippingInfo(updates);
      }
    }
  }, [isAuthenticated, user, shippingInfo, updateShippingInfo, savedAddresses]);

  // Auto-populate payment method with default saved method
  useEffect(() => {
    if (isAuthenticated && savedPaymentMethods && savedPaymentMethods.length > 0 && !paymentInfo.cardNumber) {
      const defaultPaymentMethod = savedPaymentMethods.find(method => method.isDefault) || savedPaymentMethods[0];
      if (defaultPaymentMethod) {
        updatePaymentInfo({
          cardNumber: `**** **** **** ${defaultPaymentMethod.last4Digits}`,
          expiryDate: `${defaultPaymentMethod.expiryMonth}/${defaultPaymentMethod.expiryYear}`,
          nameOnCard: defaultPaymentMethod.nameOnCard,
          cvv: '' // CVV is never saved for security
        });
        setIsUsingExistingPaymentMethod(true); // Flag that we're using an existing method
      }
    }
  }, [isAuthenticated, savedPaymentMethods, paymentInfo.cardNumber, updatePaymentInfo]);

  // Handle user coming back from authentication
  useEffect(() => {
    // If user just authenticated and we're at the auth step, restore data and proceed to review
    if (isAuthenticated && currentStep === 2.5) {
      console.log('User authenticated, restoring checkout data...');
      restoreCheckoutData();
      setCurrentStep(3);
    }
  }, [isAuthenticated, currentStep, setCurrentStep, restoreCheckoutData]);

  // Reset existing payment method flag when user enters new card number
  useEffect(() => {
    if (paymentInfo.cardNumber && !paymentInfo.cardNumber.includes('****') && paymentInfo.cardNumber.length > 0) {
      setIsUsingExistingPaymentMethod(false);
    }
  }, [paymentInfo.cardNumber]);

  // Handle Stripe card element changes
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const subtotal = getTotalPrice();
  const discountAmount = appliedPromoCode?.discountAmount || 0;
  const discountedSubtotal = subtotal - discountAmount;

  // Calculate shipping from cart items' selected options
  const calculateShippingCost = () => {
    let totalShipping = 0;
    let hasShippingOptions = false;

    cartItems.forEach(item => {
      if (item.shippingOption) {
        totalShipping += (item.shippingOption.price / 100) * item.quantity; // Convert cents to dollars
        hasShippingOptions = true;
      }
    });

    // If no shipping options selected, use fallback logic
    if (!hasShippingOptions) {
      return discountedSubtotal > 100 ? 0 : 15; // Original fallback
    }

    return totalShipping;
  };

  const shipping = calculateShippingCost();
  const tax = discountedSubtotal * 0.08; // 8% tax
  const charityDonation = Math.round(subtotal * 0.05 * 100) / 100; // 5% of subtotal
  const total = discountedSubtotal + shipping + tax + donationAmount;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Require a delivery option for each cart item
    const missing = cartItems.filter(ci => !ci.shippingOption);
    if (missing.length > 0) {
      setShippingError('Please choose a delivery option for each item before continuing.');
      return;
    }
    setShippingError(null);
    setCurrentStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated before proceeding to payment
    if (!isAuthenticated) {
      // Preserve all data before authentication
      preserveCheckoutData();
      
      // User needs to sign in before payment
      setCurrentStep(2.5); // Special step for authentication prompt
      return;
    }
    
    // Validate card details if not using existing payment method
    if (!isUsingExistingPaymentMethod) {
      if (!cardComplete) {
        setCardError('Please enter complete card details');
        return;
      }
      if (cardError) {
        return;
      }
    }
    
    setCurrentStep(3);
  };

  const handleAuthenticationRequired = () => {
    // Force preserve data one more time before sign-in
    preserveCheckoutData();
    // Trigger sign-in - checkout data will be preserved automatically
    signIn();
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setCurrentStep(2.5);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Save new address if requested
      if (saveNewAddress && shippingInfo.addressLine1) {
        try {
          await addAddress({
            clerkUserId: user!.id,
            firstName: shippingInfo.firstName,
            lastName: shippingInfo.lastName,
            addressLine1: shippingInfo.addressLine1,
            addressLine2: shippingInfo.addressLine2 || undefined,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country,
            isDefault: !savedAddresses || savedAddresses.length === 0,
          });
        } catch (error) {
          console.error('Failed to save address:', error);
        }
      }

      // Create Stripe PaymentIntent
      if (!stripe || !elements) {
        throw new Error('Stripe has not loaded yet. Please try again momentarily.');
      }

      const amountInCents = Math.round(total * 100);
      const intent = await createPaymentIntent({
        amount: amountInCents,
        currency: 'usd',
        email: shippingInfo.email || user!.email,
        orderNumber: undefined,
      });

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card input is not ready.');
      }

      const { paymentIntent, error } = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Payment failed:', error.message);
        setIsProcessing(false);
        return;
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        console.error('Payment did not succeed:', paymentIntent?.status);
        setIsProcessing(false);
        return;
      }

      // Prepare cart items for order creation
      const orderItems = cartItems.map(item => ({
        productId: item.productId as any,
        variantId: item.variant?.id as any,
        productName: item.productName,
        variantName: item.variant?.name,
        quantity: item.quantity,
        unitPrice: item.basePrice + (item.variant?.priceAdjustment || 0),
        totalPrice: (item.basePrice + (item.variant?.priceAdjustment || 0)) * item.quantity,
        shippingOption: item.shippingOption ? {
          id: item.shippingOption.id,
          name: item.shippingOption.name,
          description: item.shippingOption.description,
          price: item.shippingOption.price,
          estimatedDays: item.shippingOption.estimatedDays,
        } : undefined,
      }));

      // Create order in database
      const orderResult = await createOrder({
        clerkUserId: user!.id,
        email: user!.email,
        cartItems: orderItems,
        subtotal: subtotal,
        taxAmount: tax,
        shippingAmount: shipping,
        discountAmount: discountAmount,
        charityDonationAmount: charityDonation + donationAmount,
        totalAmount: total,
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          addressLine1: shippingInfo.addressLine1,
          addressLine2: shippingInfo.addressLine2 || undefined,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
        },
        paymentMethod: 'Stripe Card',
        paymentStatus: 'paid',
        stripePaymentIntentId: intent.paymentIntentId,
        selectedCharityType: selectedCharity as any,
      });
      
      // Send confirmation email (non-blocking)
      try {
        await sendOrderConfirmationEmail({ orderNumber: orderResult.orderNumber });
      } catch (e) {
        console.error('Failed to send confirmation email:', e);
      }
      
      // Clear cart and checkout data
      clearCart();
      clearCheckoutData();
      
      // Redirect to account page (order history tab)
      navigate('/account?tab=orders', { 
        state: { 
          orderNumber: orderResult.orderNumber,
          total,
          charityDonation: charityDonation + donationAmount,
          selectedCharity 
        }
      });
    } catch (error) {
      console.error('Order processing failed:', error);
      setIsProcessing(false);
    }
  };

  // Handle saved address selection
  const handleSelectSavedAddress = (address: any) => {
    updateShippingInfo({
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country
    });
    setShowSavedAddresses(false);
    setSaveNewAddress(false); // Don't save if using existing address
  };

  // Handle saved payment method selection
  const handleSelectSavedPaymentMethod = (paymentMethod: any) => {
    updatePaymentInfo({
      cardNumber: `**** **** **** ${paymentMethod.last4Digits}`,
      expiryDate: `${paymentMethod.expiryMonth}/${paymentMethod.expiryYear}`,
      nameOnCard: paymentMethod.nameOnCard,
      cvv: '' // CVV is never saved for security
    });
    setShowSavedPaymentMethods(false);
    setSaveNewPaymentMethod(false); // Don't save if using existing payment method
    setIsUsingExistingPaymentMethod(true); // Flag that we're using an existing method
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Add some beautiful bags to your cart to continue.</p>
        <button
          onClick={() => navigate('/bags')}
          className="bg-stellamaris-600 text-white px-6 py-3 rounded-md hover:bg-stellamaris-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Cart
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { step: 1, label: 'Shipping' },
                { step: 2, label: 'Payment' },
                { step: 3, label: 'Review' }
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step
                          ? 'bg-stellamaris-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{label}</span>
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        currentStep > step ? 'bg-stellamaris-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                  
                  {/* Saved Addresses Section */}
                  {isAuthenticated && savedAddresses && savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
                        <button
                          type="button"
                          onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                          className="text-stellamaris-600 hover:text-stellamaris-700 flex items-center space-x-1"
                        >
                          <MapPin size={16} />
                          <span>{showSavedAddresses ? 'Hide' : 'Show'} saved addresses</span>
                        </button>
                      </div>
                      
                      {showSavedAddresses && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {savedAddresses.map((address) => (
                            <div
                              key={address._id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-stellamaris-300 cursor-pointer transition-colors"
                              onClick={() => handleSelectSavedAddress(address)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {address.firstName} {address.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.addressLine1}</p>
                                  {address.addressLine2 && (
                                    <p className="text-sm text-gray-600">{address.addressLine2}</p>
                                  )}
                                  <p className="text-sm text-gray-600">
                                    {address.city}, {address.state} {address.zipCode}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.country}</p>
                                </div>
                                {address.isDefault && (
                                  <span className="bg-stellamaris-100 text-stellamaris-800 text-xs font-medium px-2 py-1 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600 mb-4">Or enter a new address:</p>
                      </div>
                    </div>
                )}

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.firstName}
                        onChange={(e) => updateShippingInfo({firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.lastName}
                        onChange={(e) => updateShippingInfo({lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingInfo.email}
                      onChange={(e) => updateShippingInfo({email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => updateShippingInfo({phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.addressLine1}
                      onChange={(e) => updateShippingInfo({addressLine1: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.addressLine2}
                      onChange={(e) => updateShippingInfo({addressLine2: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.city}
                        onChange={(e) => updateShippingInfo({city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.state}
                        onChange={(e) => updateShippingInfo({state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.zipCode}
                        onChange={(e) => updateShippingInfo({zipCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                  </div>

                  {/* Delivery Options per item */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Delivery Options</h3>
                    <p className="text-sm text-gray-600 mb-3">Choose a shipping option for each item.</p>
                    {shippingError && (
                      <p className="text-sm text-red-600 mb-2">{shippingError}</p>
                    )}
                    <div className="space-y-4">
                      {cartItems.map(item => (
                        <div key={`${item.productId}-${item.variant?.id || 'default'}`} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.productName}{item.variant ? ` - ${item.variant.name}` : ''}</p>
                            {item.shippingOption && (
                              <p className="text-xs text-gray-600">Current: {item.shippingOption.name} (${(item.shippingOption.price/100).toFixed(2)})</p>
                            )}
                          </div>
                          <div>
                            <ItemShippingOptionSelector
                              productId={item.productId}
                              variantId={item.variant?.id}
                              valueId={item.shippingOption?.id}
                              onChange={(option) => setItemShippingOption(item.productId, item.variant?.id, option)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="text-stellamaris-600 focus:ring-stellamaris-500"
                    />
                    <label htmlFor="saveAddress" className="text-sm text-gray-700">
                      Save this address for future orders
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-stellamaris-600 text-white py-3 px-4 rounded-md hover:bg-stellamaris-700 transition-colors font-medium"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Information */}
            <div className={`bg-white rounded-lg shadow-sm p-6 ${currentStep !== 2 ? 'hidden' : ''}`}>

                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                
                {/* Saved Payment Methods Section */}
                {isAuthenticated && savedPaymentMethods && savedPaymentMethods.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Saved Payment Methods</h3>
                      <button
                        type="button"
                        onClick={() => setShowSavedPaymentMethods(!showSavedPaymentMethods)}
                        className="text-stellamaris-600 hover:text-stellamaris-700 flex items-center space-x-1"
                      >
                        <CreditCard size={16} />
                        <span>{showSavedPaymentMethods ? 'Hide' : 'Show'} saved cards</span>
                      </button>
                    </div>
                    
                    {showSavedPaymentMethods && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {savedPaymentMethods.map((paymentMethod) => (
                          <div
                            key={paymentMethod._id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-stellamaris-300 cursor-pointer transition-colors"
                            onClick={() => handleSelectSavedPaymentMethod(paymentMethod)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <CreditCard size={16} className="text-gray-400" />
                                  <span className="font-medium text-gray-900 capitalize">
                                    {paymentMethod.cardType}
                                  </span>
                                  <span className="text-gray-600">•••• {paymentMethod.last4Digits}</span>
                                </div>
                                <p className="text-sm text-gray-600">{paymentMethod.nameOnCard}</p>
                                <p className="text-sm text-gray-600">
                                  Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                                </p>
                              </div>
                              {paymentMethod.isDefault && (
                                <span className="bg-stellamaris-100 text-stellamaris-800 text-xs font-medium px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-600 mb-4">Or enter a new payment method:</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Details *
                    </label>
                    <div className={`border rounded-md px-3 py-2 ${
                      cardError ? 'border-red-300' : 'border-gray-300'
                    }`}>
                      <CardElement 
                        options={{ hidePostalCode: true }} 
                        onChange={handleCardChange}
                      />
                    </div>
                    {cardError && (
                      <p className="mt-1 text-sm text-red-600">{cardError}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <Lock className="h-4 w-4" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!isUsingExistingPaymentMethod && (!cardComplete || !!cardError)}
                      className="flex-1 bg-stellamaris-600 text-white py-3 px-4 rounded-md hover:bg-stellamaris-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Order
                    </button>
                  </div>
                </form>
              </div>

            {/* Step 2.5: Authentication Required */}
            {currentStep === 2.5 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-stellamaris-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="text-stellamaris-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sign In Required</h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    To complete your purchase and track your order, please sign in to your account or create a new one. 
                    Don't worry - we've saved all your checkout information!
                  </p>
                  
                  <div className="space-y-3 max-w-sm mx-auto">
                    <button
                      onClick={handleAuthenticationRequired}
                      className="w-full bg-stellamaris-600 text-white py-3 px-4 rounded-md hover:bg-stellamaris-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <LogIn size={16} />
                      <span>Sign In / Create Account</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back to Payment
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Why sign in?</strong> Your account allows you to track orders, save addresses, 
                      view your charity impact, and get personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && isAuthenticated && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
                
                {/* Charity Selection */}
                <div className="mb-6 p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Heart className="h-5 w-5 text-emerald-600 mr-2" />
                    <h3 className="font-medium text-emerald-900">Choose Your Charity Impact</h3>
                  </div>
                  <p className="text-sm text-emerald-700 mb-4">
                    5% of your purchase (${charityDonation.toFixed(2)}) will be donated to your chosen cause.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'animal_shelter', name: 'Animal Shelters', desc: 'Support local animal rescue organizations' },
                      { id: 'environmental', name: 'Environmental', desc: 'Protect our planet and ecosystems' },
                      { id: 'children', name: 'Children\'s Education', desc: 'Support educational programs for children' },
                      { id: 'education', name: 'Adult Education', desc: 'Fund literacy and skill development programs' },
                    ].map((charity) => (
                      <label key={charity.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="charity"
                          value={charity.id}
                          checked={selectedCharity === charity.id}
                          onChange={(e) => setSelectedCharity(e.target.value)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-medium text-emerald-900">{charity.name}</div>
                          <div className="text-sm text-emerald-700">{charity.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Additional Donation (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Percent size={16} className="mr-2" />
                    Promo Code
                  </h4>
                  <PromoCodeInput
                    subtotal={subtotal}
                    onPromoCodeApplied={setAppliedPromoCode}
                    appliedPromoCode={appliedPromoCode}
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-stellamaris-600 text-white py-3 px-4 rounded-md hover:bg-stellamaris-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.variant?.id}`} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.imageUrl || '/placeholder-bag.jpg'}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.productName}</h4>
                        {item.variant && (
                          <p className="text-xs text-gray-500">
                            {item.variant.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${((item.basePrice + (item.variant?.priceAdjustment || 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.shippingOption && (
                      <div className="mt-2 pl-15 flex items-center text-xs text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          📦 {item.shippingOption.name}: ${(item.shippingOption.price / 100).toFixed(2)} × {item.quantity}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                {appliedPromoCode && appliedPromoCode.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount ({appliedPromoCode.code})</span>
                    <span className="text-green-600">-${appliedPromoCode.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Charity Donation (5%)</span>
                  <span>${charityDonation.toFixed(2)}</span>
                </div>
                {donationAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Additional Donation</span>
                    <span>${donationAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {discountedSubtotal < 100 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Add ${(100 - discountedSubtotal).toFixed(2)} more for free shipping!
                  </p>
                </div>
              )}

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Lock size={12} />
                <span>Secure 256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
};

export default CheckoutPage;