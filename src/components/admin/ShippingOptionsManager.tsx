import React, { useState } from 'react'
import { Truck, Plus, Edit, Trash2, Save, X, Clock, DollarSign } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface ShippingOptionsManagerProps {
  productId: Id<"products">
  productName: string
}

interface ShippingOptionForm {
  name: string
  description: string
  price: number
  minDays: number
  maxDays: number
  carrier: string
  serviceType: string
}

const ShippingOptionsManager: React.FC<ShippingOptionsManagerProps> = ({ productId, productName }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<Id<"productShippingOptions"> | null>(null)
  const [formData, setFormData] = useState<ShippingOptionForm>({
    name: '',
    description: '',
    price: 0,
    minDays: 1,
    maxDays: 1,
    carrier: '',
    serviceType: '',
  })

  // Queries and mutations
  const shippingOptions = useQuery(api.shippingOptions.getAllProductShippingOptions, { productId })
  const createShippingOption = useMutation(api.shippingOptions.createProductShippingOption)
  const updateShippingOption = useMutation(api.shippingOptions.updateProductShippingOption)
  const deleteShippingOption = useMutation(api.shippingOptions.deleteProductShippingOption)
  const createDefaultOptions = useMutation(api.shippingOptions.createDefaultShippingOptions)

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

  const handleEdit = (option: any) => {
    setFormData({
      name: option.name,
      description: option.description,
      price: option.price / 100, // Convert cents to dollars for display
      minDays: option.estimatedDays.min,
      maxDays: option.estimatedDays.max,
      carrier: option.carrier || '',
      serviceType: option.serviceType || '',
    })
    setEditingId(option._id)
    setShowForm(true)
  }

  const handleSubmit = async () => {

    try {
      const shippingData = {
        productId,
        name: formData.name,
        description: formData.description,
        price: Math.round(formData.price * 100), // Convert dollars to cents
        estimatedDays: {
          min: formData.minDays,
          max: formData.maxDays,
        },
        carrier: formData.carrier || undefined,
        serviceType: formData.serviceType || undefined,
      }

      if (editingId) {
        await updateShippingOption({
          shippingOptionId: editingId,
          ...shippingData,
        })
      } else {
        await createShippingOption(shippingData)
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save shipping option:', error)
      alert('Failed to save shipping option. Please try again.')
    }
  }

  const handleDelete = async (optionId: Id<"productShippingOptions">) => {
    if (window.confirm('Are you sure you want to delete this shipping option?')) {
      try {
        await deleteShippingOption({ shippingOptionId: optionId })
      } catch (error) {
        console.error('Failed to delete shipping option:', error)
        alert('Failed to delete shipping option. Please try again.')
      }
    }
  }

  const handleCreateDefaults = async () => {
    if (shippingOptions && shippingOptions.length > 0) {
      if (!window.confirm('This will create default shipping options. Continue?')) {
        return
      }
    }

    try {
      await createDefaultOptions({ productId })
    } catch (error) {
      console.error('Failed to create default options:', error)
      alert('Failed to create default options. Please try again.')
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatDays = (min: number, max: number) => {
    if (min === max) {
      return `${min} day${min === 1 ? '' : 's'}`
    }
    return `${min}-${max} days`
  }

  return (
    <div className="space-y-6">
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
          {(!shippingOptions || shippingOptions.length === 0) && (
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
      {shippingOptions && shippingOptions.length > 0 ? (
        <div className="space-y-3">
          {shippingOptions.map((option) => (
            <div key={option._id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{option.name}</h4>
                    <span className="text-lg font-bold text-stellamaris-600">
                      {formatPrice(option.price)}
                    </span>
                    {!option.isActive && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        Inactive
                      </span>
                    )}
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
                    onClick={() => handleDelete(option._id)}
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
        <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
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

export default ShippingOptionsManager 