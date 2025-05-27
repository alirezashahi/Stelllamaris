import React, { useState, useEffect, useRef } from 'react'
import { Send, FileText, Clock, User, Shield, Image, X } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface ReturnMessagingProps {
  returnRequestId: Id<"returnRequests">
  userId: Id<"users">
  userName: string
  onClose?: () => void
}

const ReturnMessaging: React.FC<ReturnMessagingProps> = ({
  returnRequestId,
  userId,
  userName,
  onClose
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Queries and mutations
  const messages = useQuery(api.returns.getReturnMessages, {
    returnRequestId,
    userId
  })

  const sendMessage = useMutation(api.returns.sendReturnMessage)
  const markAsRead = useMutation(api.returns.markReturnMessagesAsRead)
  
  // File upload mutations
  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl)
  const saveReturnMessageAttachment = useMutation(api.fileUpload.saveReturnMessageAttachment)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Mark messages as read when component mounts or new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      const hasUnreadAdminMessages = messages.some(
        msg => msg.senderType === 'admin' && !msg.isRead
      )
      
      if (hasUnreadAdminMessages) {
        markAsRead({ returnRequestId, userId })
      }
    }
  }, [messages, returnRequestId, userId, markAsRead])

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    try {
      await sendMessage({
        returnRequestId,
        senderId: userId,
        message: newMessage.trim(),
        messageType: "text",
        attachments: attachments.length > 0 ? attachments : undefined
      })

      setNewMessage('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newAttachments: string[] = []

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert('Only image files are allowed')
          continue
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('File size must be less than 5MB')
          continue
        }

        // Generate upload URL
        const uploadUrl = await generateUploadUrl()
        
        // Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })
        
        if (!result.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
        
        const { storageId } = await result.json()
        
        // Save and get the file URL
        const fileUrl = await saveReturnMessageAttachment({
          storageId,
          altText: `Message attachment`,
        })
        
        newAttachments.push(fileUrl)
      }

      setAttachments(prev => [...prev, ...newAttachments])
    } catch (error) {
      console.error('File upload failed:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'status_update':
        return <Clock className="h-4 w-4" />
      case 'admin_response':
        return <Shield className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Communicate with our support team about your return request
        </p>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'customer'
                      ? 'bg-stellamaris-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Message header */}
                  <div className="flex items-center space-x-2 mb-1">
                    {message.senderType === 'admin' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.senderType === 'admin' ? 'Support Team' : 'You'}
                    </span>
                    {getMessageTypeIcon(message.messageType)}
                  </div>

                  {/* Message content */}
                  <p className="text-sm">{message.message}</p>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {message.attachments.map((attachment, index) => (
                        <img
                          key={index}
                          src={attachment}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 hover:border-stellamaris-400 transition-colors"
                          onClick={() => setLightboxImage(attachment)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs mt-2 opacity-75">
                    {formatTimestamp(message._creationTime)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-500">
              Send a message to communicate with our support team
            </p>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative">
                <img
                  src={attachment}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-16 object-cover rounded border"
                />
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            {/* File upload button */}
            <label className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 cursor-pointer transition-colors flex items-center">
              <Image className="h-4 w-4" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && attachments.length === 0) || isUploading}
              className="bg-stellamaris-600 text-white px-3 py-2 rounded-md hover:bg-stellamaris-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isUploading && (
          <div className="mt-2 text-sm text-gray-600">
            Uploading images...
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Message attachment"
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

export default ReturnMessaging 