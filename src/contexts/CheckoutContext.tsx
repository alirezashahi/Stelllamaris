import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ShippingInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PaymentInfo {
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
}

interface CheckoutContextType {
  shippingInfo: ShippingInfo
  paymentInfo: PaymentInfo
  selectedCharity: string
  donationAmount: number
  currentStep: number
  isProcessing: boolean
  saveNewAddress: boolean
  saveNewPaymentMethod: boolean
  updateShippingInfo: (info: Partial<ShippingInfo>) => void
  updatePaymentInfo: (info: Partial<PaymentInfo>) => void
  setSelectedCharity: (charity: string) => void
  setDonationAmount: (amount: number) => void
  setCurrentStep: (step: number) => void
  setIsProcessing: (processing: boolean) => void
  setSaveNewAddress: (save: boolean) => void
  setSaveNewPaymentMethod: (save: boolean) => void
  clearCheckoutData: () => void
  preserveCheckoutData: () => void
  restoreCheckoutData: () => void
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export const useCheckout = () => {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}

interface CheckoutProviderProps {
  children: ReactNode
}

const CHECKOUT_STORAGE_KEY = 'stellamaris_checkout_data'

const defaultShippingInfo: ShippingInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
}

const defaultPaymentInfo: PaymentInfo = {
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  nameOnCard: '',
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({ children }) => {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(defaultShippingInfo)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(defaultPaymentInfo)
  const [selectedCharity, setSelectedCharity] = useState<string>('animal_shelter')
  const [donationAmount, setDonationAmount] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [saveNewPaymentMethod, setSaveNewPaymentMethod] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Load checkout data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(CHECKOUT_STORAGE_KEY)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        console.log('Loading saved checkout data:', parsedData)
        
        if (parsedData.shippingInfo) {
          setShippingInfo(parsedData.shippingInfo)
        }
        if (parsedData.paymentInfo) {
          setPaymentInfo(parsedData.paymentInfo)
        }
        if (parsedData.selectedCharity) {
          setSelectedCharity(parsedData.selectedCharity)
        }
        if (typeof parsedData.donationAmount === 'number') {
          setDonationAmount(parsedData.donationAmount)
        }
        if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep)
        }
      } catch (error) {
        console.error('Failed to parse saved checkout data:', error)
        localStorage.removeItem(CHECKOUT_STORAGE_KEY)
      }
    }
    setDataLoaded(true)
  }, [])

  // Save checkout data to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (!dataLoaded) return

    const dataToSave = {
      shippingInfo,
      paymentInfo,
      selectedCharity,
      donationAmount,
      currentStep,
      timestamp: Date.now(),
    }
    console.log('Saving checkout data:', dataToSave)
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(dataToSave))
  }, [shippingInfo, paymentInfo, selectedCharity, donationAmount, currentStep, dataLoaded])

  const updateShippingInfo = (info: Partial<ShippingInfo>) => {
    setShippingInfo(prev => ({ ...prev, ...info }))
  }

  const updatePaymentInfo = (info: Partial<PaymentInfo>) => {
    setPaymentInfo(prev => ({ ...prev, ...info }))
  }

  const clearCheckoutData = () => {
    setShippingInfo(defaultShippingInfo)
    setPaymentInfo(defaultPaymentInfo)
    setSelectedCharity('animal_shelter')
    setDonationAmount(0)
    setCurrentStep(1)
    setIsProcessing(false)
    setSaveNewAddress(false)
    setSaveNewPaymentMethod(false)
    localStorage.removeItem(CHECKOUT_STORAGE_KEY)
  }

  const preserveCheckoutData = () => {
    // Force save current state
    const dataToSave = {
      shippingInfo,
      paymentInfo,
      selectedCharity,
      donationAmount,
      currentStep,
      timestamp: Date.now(),
    }
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(dataToSave))
    console.log('Checkout data preserved for authentication flow:', dataToSave)
  }

  const restoreCheckoutData = () => {
    const savedData = localStorage.getItem(CHECKOUT_STORAGE_KEY)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        console.log('Restoring checkout data after authentication:', parsedData)
        
        if (parsedData.shippingInfo) {
          setShippingInfo(parsedData.shippingInfo)
        }
        if (parsedData.paymentInfo) {
          setPaymentInfo(parsedData.paymentInfo)
        }
        if (parsedData.selectedCharity) {
          setSelectedCharity(parsedData.selectedCharity)
        }
        if (typeof parsedData.donationAmount === 'number') {
          setDonationAmount(parsedData.donationAmount)
        }
        if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep)
        }
      } catch (error) {
        console.error('Failed to restore checkout data:', error)
      }
    }
  }

  const value: CheckoutContextType = {
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
  }

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  )
} 