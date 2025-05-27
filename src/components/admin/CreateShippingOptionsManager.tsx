import React, { useState } from 'react'
import { Truck, Plus, Edit, Trash2, Save, X, Clock, DollarSign } from 'lucide-react'

interface TempShippingOption {
  id: string
  name: string
  description: string
  price: number
  minDays: number
  maxDays: number
  carrier: string
  serviceType: string
}

interface CreateShippingOptionsManagerProps {
  onShippingOptionsChange: (options: TempShippingOption[]) => void
  productName: string
}

const CreateShippingOptionsManager: React.FC<CreateShippingOptionsManagerProps> = ({
  onShippingOptionsChange,
  productName
}) => {
  const [shippingOptions, setShippingOptions] = useState<TempShippingOption[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    minDays: 1,
    maxDays: 1,
    carrier: '',
    serviceType: '',
  })

  const generateId = () => `temp-shipping-${Date.now()}-${Math.random()}`

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      minDays: 1,
      maxDays: 1,
      carrier: '',
      serviceType: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (option: TempShippingOption) => {
    setFormData({
      name: option.name,
      description: option.description,
      price: option.price,
      minDays: option.minDays,
      maxDays: option.maxDays,
      carrier: option.carrier,
      serviceType: option.serviceType,
    })
    setEditingId(option.id)
    setShowForm(true)
  }

  const handleSubmit = () => {
    const newOption: TempShippingOption = {
      id: editingId || generateId(),
      name: formData.name,
      description: formData.description,
      price: formData.price,
      minDays: formData.minDays,
      maxDays: formData.maxDays,
      carrier: formData.carrier,
      serviceType: formData.serviceType,
    }

    let updatedOptions: TempShippingOption[]
    if (editingId) {
      updatedOptions = shippingOptions.map(option => 
        option.id === editingId ? newOption : option
      )
    } else {
      updatedOptions = [...shippingOptions, newOption]
    }

    setShippingOptions(updatedOptions)
    onShippingOptionsChange(updatedOptions)
    resetForm()
  }

  const handleDelete = (optionId: string) => {
    const updatedOptions = shippingOptions.filter(option => option.id !== optionId)
    setShippingOptions(updatedOptions)
    onShippingOptionsChange(updatedOptions)
  }

  const handleCreateDefaults = () => {
    const defaultOptions: TempShippingOption[] = [
      {
        id: generateId(),
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: 5.99,
        minDays: 5,
        maxDays: 7,
        carrier: 'USPS',
        serviceType: 'Ground',
      },
      {
        id: generateId(),
        name: 'Express Shipping',
        description: '2-3 business days',
        price: 12.99,
        minDays: 2,
        maxDays: 3,
        carrier: 'FedEx',
        serviceType: 'Express',
      },
      {
        id: generateId(),
        name: 'Free Shipping',
        description: '7-10 business days',
        price: 0,
        minDays: 7,
        maxDays: 10,
        carrier: 'USPS',
        serviceType: 'Economy',
      },
    ]
    
    setShippingOptions(defaultOptions)
    onShippingOptionsChange(defaultOptions)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Truck className="h-5 w-5 text-stellamaris-600" />
            <span>Shipping Options</span>
          </h3>
          <p className="text-sm text-gray-600">Configure shipping methods for {productName}</p>
        </div>
        <div className="flex space-x-2">
          {shippingOptions.length === 0 && (
            <button
              onClick={handleCreateDefaults}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition-colors"
            >
              <Truck className="h-4 w-4" />
              <span>Create Defaults</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-stellamaris-600 text-white px-4 py-2 rounded-lg hover:bg-stellamaris-700 text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Option</span>
          </button>
        </div>
      </div>

      {/* Shipping Options List */}
      {shippingOptions.length > 0 ? (
        <div className="space-y-3">
          {shippingOptions.map((option) => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{option.name}</h4>
                    <span className="text-lg font-bold text-stellamaris-600">
                      {formatPrice(option.price)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{option.description}</span>
                    </div>
                    {option.carrier && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {option.carrier} {option.serviceType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(option)}
                    className="text-gray-600 hover:text-stellamaris-600 p-1 rounded transition-colors"
                    title="Edit shipping option"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    className="text-gray-600 hover:text-red-600 p-1 rounded transition-colors"
                    title="Delete shipping option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-gray-200 rounded-lg bg-white">
          <Truck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping options configured</h3>
          <p className="text-gray-600 mb-4">Create shipping options to allow customers to choose delivery methods</p>
          <button
            onClick={handleCreateDefaults}
            className="bg-stellamaris-600 text-white px-4 py-2 rounded-lg hover:bg-stellamaris-700 transition-colors"
          >
            Create Default Options
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Edit Shipping Option' : 'Add Shipping Option'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    placeholder="e.g., Standard Shipping"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    placeholder="e.g., 5-7 business days"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Days *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minDays}
                      onChange={(e) => setFormData({ ...formData, minDays: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Days *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxDays}
                      onChange={(e) => setFormData({ ...formData, maxDays: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier
                  </label>
                  <select
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  >
                    <option value="">Select carrier (optional)</option>
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    placeholder="e.g., Ground, 2-Day, Overnight"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-lg hover:bg-stellamaris-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingId ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateShippingOptionsManager 