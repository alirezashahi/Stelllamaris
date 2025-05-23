import React, { useState } from 'react'
import { Package, Truck, CheckCircle, Edit2, Save, X } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface OrderItem {
  productName: string
  variantName?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  _id: Id<"orders">
  _creationTime: number
  orderNumber: string
  email: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  totalAmount: number
  trackingNumber?: string
  shippedAt?: number
  deliveredAt?: number
  items: OrderItem[]
}

const OrderManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', status: '' })

  const orders = useQuery(api.orders.getAllOrders, {
    status: selectedStatus === 'all' ? undefined : selectedStatus as any,
    limit: 100
  })

  const updateOrderTracking = useMutation(api.orders.updateOrderTracking)

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order._id)
    setTrackingForm({
      trackingNumber: order.trackingNumber || '',
      status: order.status
    })
  }

  const handleSaveOrder = async (orderId: Id<"orders">) => {
    try {
      await updateOrderTracking({
        orderId,
        trackingNumber: trackingForm.trackingNumber || undefined,
        status: trackingForm.status as any
      })
      setEditingOrder(null)
    } catch (error) {
      console.error('Failed to update order:', error)
      alert('Failed to update order. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setTrackingForm({ trackingNumber: '', status: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'shipped': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!orders) {
    return <div className="animate-pulse p-6">Loading orders...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Management</h2>
        <p className="text-gray-600">Manage orders, update tracking numbers, and change order status</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No orders found for the selected filter.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-gray-50 rounded-lg p-6">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.email} • {formatDate(order._creationTime)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-900">
                        {item.productName} {item.variantName && `- ${item.variantName}`} (x{item.quantity})
                      </span>
                      <span className="text-gray-900">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking Management */}
              {editingOrder === order._id ? (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Update Order</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingForm.trackingNumber}
                        onChange={(e) => setTrackingForm({...trackingForm, trackingNumber: e.target.value})}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Status
                      </label>
                      <select
                        value={trackingForm.status}
                        onChange={(e) => setTrackingForm({...trackingForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveOrder(order._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      {order.trackingNumber ? (
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">No tracking number</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="text-stellamaris-600 hover:text-stellamaris-700 flex items-center space-x-1 text-sm"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderManagement 