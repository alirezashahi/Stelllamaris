import React, { useState } from 'react'
import { RotateCcw, Eye, Check, X, Clock, Package, AlertTriangle, ExternalLink, FileText, MessageSquare, Send } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

const ReturnManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [showMessages, setShowMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Get return requests based on selected status
  const returnRequests = useQuery(api.returns.getAllReturnRequests, {
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: 100
  })

  // Get unread customer message counts
  const unreadMessageCounts = useQuery(api.returns.getUnreadCustomerMessageCounts, {})

  // Get system admin user for sending messages
  const systemAdminUser = useQuery(api.returns.getSystemAdminUser, {})

  // Get messages for selected request
  const returnMessages = useQuery(
    api.returns.getReturnMessagesAdmin,
    selectedRequest ? { returnRequestId: selectedRequest._id } : "skip"
  )

  // Mutations
  const updateReturnStatus = useMutation(api.returns.updateReturnRequestStatus)
  const sendMessage = useMutation(api.returns.sendReturnMessage)
  const markMessagesAsRead = useMutation(api.returns.markCustomerMessagesAsRead)

  const statusOptions = [
    { value: 'all', label: 'All Requests', count: returnRequests?.length || 0 },
    { value: 'pending', label: 'Pending Review', count: returnRequests?.filter(r => r.status === 'pending').length || 0 },
    { value: 'approved', label: 'Approved', count: returnRequests?.filter(r => r.status === 'approved').length || 0 },
    { value: 'rejected', label: 'Rejected', count: returnRequests?.filter(r => r.status === 'rejected').length || 0 },
    { value: 'processing', label: 'Processing', count: returnRequests?.filter(r => r.status === 'processing').length || 0 },
    { value: 'completed', label: 'Completed', count: returnRequests?.filter(r => r.status === 'completed').length || 0 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <Check className="h-4 w-4" />
      case 'rejected':
        return <X className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'completed':
        return <Check className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request)
    setAdminNotes('')
    setApprovedAmount(request.requestedAmount?.toString() || '')
    setTrackingNumber('')
    setShowMessages(false)
    setNewMessage('')
    setShowModal(true)
    
    // Mark customer messages as read when opening the modal
    markMessagesAsRead({ returnRequestId: request._id })
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedRequest) return

    try {
      const updateData: any = {
        returnRequestId: selectedRequest._id,
        status: newStatus as any,
      }

      if (newStatus === 'approved' && approvedAmount) {
        updateData.approvedAmount = parseFloat(approvedAmount)
      }

      if (adminNotes.trim()) {
        updateData.adminNotes = adminNotes.trim()
      }

      if (trackingNumber.trim()) {
        updateData.trackingNumber = trackingNumber.trim()
      }

      await updateReturnStatus(updateData)
      setShowModal(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Failed to update return status:', error)
      alert('Failed to update return status. Please try again.')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest || !systemAdminUser) return

    setSendingMessage(true)
    try {
      await sendMessage({
        returnRequestId: selectedRequest._id,
        senderId: systemAdminUser,
        message: newMessage,
        messageType: "admin_response",
      })

      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const getUnreadCount = (returnRequestId: Id<"returnRequests">) => {
    return unreadMessageCounts?.byReturnRequest.find(
      item => item.returnRequestId === returnRequestId
    )?.unreadCount || 0
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Return Management</h2>
          <p className="text-gray-600">Manage customer return requests and refunds</p>
        </div>
        <div className="flex items-center space-x-2">
          <RotateCcw className="h-5 w-5 text-stellamaris-600" />
          <span className="text-sm text-gray-600">
            {returnRequests?.length || 0} total requests
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedStatus === option.value
                    ? 'border-stellamaris-500 text-stellamaris-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
                {option.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    selectedStatus === option.value
                      ? 'bg-stellamaris-100 text-stellamaris-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Return Requests List */}
      {returnRequests && returnRequests.length > 0 ? (
        <div className="space-y-4">
          {returnRequests.map((request) => (
            <div key={request._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{request.orderNumber}
                    </h3>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Customer:</span> {request.userName} ({request.userEmail})</p>
                    <p><span className="font-medium">RMA:</span> {request.rmaNumber}</p>
                    <p><span className="font-medium">Submitted:</span> {new Date(request.submittedAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Reason:</span> {request.reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                  </div>
                </div>
                <div className="text-right">
                  {request.requestedAmount && (
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      ${request.requestedAmount.toFixed(2)}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    {getUnreadCount(request._id) > 0 && (
                      <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                        <MessageSquare className="h-3 w-3" />
                        <span>{getUnreadCount(request._id)} new</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="inline-flex items-center space-x-1 bg-stellamaris-600 text-white px-3 py-1.5 rounded-md hover:bg-stellamaris-700 text-sm transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {request.description}
                </p>
                {request.returnItems.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-600">Return Items:</span>
                    <div className="mt-1 space-y-1">
                      {request.returnItems.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          Item {item.orderItemIndex + 1}: Quantity {item.quantity}
                          {item.reason && <span className="block text-xs">Reason: {item.reason}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <RotateCcw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No return requests</h3>
          <p className="text-gray-600">
            {selectedStatus === 'all' 
              ? 'No return requests have been submitted yet.'
              : `No ${selectedStatus} return requests found.`
            }
          </p>
        </div>
      )}

      {/* Return Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Return Request Details</h3>
                  <p className="text-gray-600">Order #{selectedRequest.orderNumber} - {selectedRequest.rmaNumber}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setShowMessages(false)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        !showMessages
                          ? 'border-stellamaris-500 text-stellamaris-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setShowMessages(true)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        showMessages
                          ? 'border-stellamaris-500 text-stellamaris-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Messages</span>
                      {getUnreadCount(selectedRequest._id) > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {getUnreadCount(selectedRequest._id)}
                        </span>
                      )}
                    </button>
                  </nav>
                </div>
              </div>

              {/* Details Tab Content */}
              {!showMessages && (
                <>
                  {/* Customer Information */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedRequest.userName}</p>
                      <p><span className="font-medium">Email:</span> {selectedRequest.userEmail}</p>
                      <p><span className="font-medium">Submitted:</span> {new Date(selectedRequest.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

              {/* Return Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Return Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Status:</span>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      <span>{selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}</span>
                    </span>
                  </div>
                  <p><span className="font-medium">Type:</span> {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)}</p>
                  <p><span className="font-medium">Reason:</span> {selectedRequest.reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                  <p><span className="font-medium">Description:</span> {selectedRequest.description}</p>
                  {selectedRequest.requestedAmount && (
                    <p><span className="font-medium">Requested Amount:</span> ${selectedRequest.requestedAmount.toFixed(2)}</p>
                  )}
                  {selectedRequest.approvedAmount && (
                    <p><span className="font-medium">Approved Amount:</span> ${selectedRequest.approvedAmount.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Return Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Return Items</h4>
                <div className="space-y-2">
                  {selectedRequest.returnItems.map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Item {item.orderItemIndex + 1}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.reason && <p className="text-sm text-gray-600">Reason: {item.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Images */}
              {selectedRequest.evidenceUrls && selectedRequest.evidenceUrls.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Evidence Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRequest.evidenceUrls.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-stellamaris-400 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLightboxImage(url);
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-full p-2 shadow-md">
                              <ExternalLink className="h-4 w-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                  {/* Admin Actions */}
                  {selectedRequest.status === 'pending' && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Admin Actions</h4>
                      <div className="space-y-4">
                        {selectedRequest.requestedAmount && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Approved Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={approvedAmount}
                              onChange={(e) => setApprovedAmount(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Enter approved amount"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Notes (Optional)
                          </label>
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={3}
                            placeholder="Add internal notes about this return request..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tracking Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter return shipping tracking number"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Messages Tab Content */}
              {showMessages && (
                <div className="space-y-4">
                  {/* Messages List */}
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {returnMessages && returnMessages.length > 0 ? (
                      <div className="p-4 space-y-4">
                        {returnMessages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex ${
                              message.senderType === 'admin' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderType === 'admin'
                                  ? 'bg-stellamaris-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium">
                                  {message.senderName}
                                </span>
                                <span className="text-xs opacity-75">
                                  {new Date(message._creationTime).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{message.message}</p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((url, index) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                    return isImage ? (
                                      <div key={index} className="relative">
                                        <img
                                          src={url}
                                          alt={`Attachment ${index + 1}`}
                                          className="max-w-xs h-32 object-cover rounded-lg border cursor-pointer hover:border-stellamaris-400 transition-colors"
                                          onClick={() => setLightboxImage(url)}
                                        />
                                      </div>
                                    ) : (
                                      <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs underline"
                                      >
                                        Attachment {index + 1}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage || !systemAdminUser}
                      className="bg-stellamaris-600 text-white px-4 py-2 rounded-md hover:bg-stellamaris-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </>
                )}

                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate('processing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Mark as Processing
                  </button>
                )}

                {selectedRequest.status === 'processing' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Return image"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReturnManagement 