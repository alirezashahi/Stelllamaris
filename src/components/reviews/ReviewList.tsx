import React, { useState } from 'react'
import { Star, Shield, MoreVertical, Edit, Trash2, Flag, Reply, Image, X } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useAuth } from '../../contexts/AuthContext'
import ReviewForm from './ReviewForm'

interface Review {
  _id: string
  _creationTime: number
  productId: string
  userId: string
  clerkUserId?: string
  rating: number
  title?: string
  comment?: string
  isVerifiedPurchase: boolean
  userName: string
  adminResponse?: string
  images: Array<{
    _id: string
    reviewId: string
    imageUrl: string
    altText?: string
    sortOrder: number
  }>
}

interface ReviewListProps {
  reviews: Review[]
  productId: string
  productName: string
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, productId, productName }) => {
  const { user, isAuthenticated } = useAuth()
  const [editingReview, setEditingReview] = useState<string | null>(null)
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null)
  const [adminReplyText, setAdminReplyText] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const deleteReview = useMutation(api.reviews.deleteReview)

  // Get permission checks for all reviews at once (proper hook usage)
  const reviewPermissions = useQuery(
    api.reviews.getUserReviewPermissions,
    user ? {
      reviewIds: reviews.map(r => r._id as Id<"reviews">),
      clerkUserId: user.id
    } : "skip"
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return
    
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview({
          reviewId: reviewId as Id<"reviews">,
          clerkUserId: user.id
        })
        setMenuOpen(null)
      } catch (error) {
        console.error('Failed to delete review:', error)
      }
    }
  }

  // Check if current user can edit this specific review
  const canEditReview = (reviewId: string) => {
    if (!reviewPermissions) return false
    return reviewPermissions[reviewId] === true
  }

  const handleAdminReply = async (reviewId: string) => {
    // Placeholder - implement when admin functions are added back
    console.log('Admin reply functionality needs to be implemented')
  }

  const handleRemoveReview = async (reviewId: string) => {
    // Placeholder - implement when admin functions are added back  
    console.log('Remove review functionality needs to be implemented')
  }

  const isAdmin = () => {
    // Check if user has admin role - you can customize this logic
    return user && user.email && (
      user.email.includes('admin') || 
      user.email.includes('stellamaris.com')
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No reviews yet. Be the first to share your experience!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Customer Reviews ({reviews.length})
      </h3>
      
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review._id} className="border border-gray-200 rounded-lg p-6">
            {/* Edit Form */}
            {editingReview === review._id ? (
              <div className="mb-4">
                <ReviewForm
                  productId={productId as Id<"products">}
                  productName={productName}
                  editingReview={review}
                  onCancel={() => setEditingReview(null)}
                  onSubmitted={() => setEditingReview(null)}
                />
              </div>
            ) : (
              <>
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-stellamaris-100 rounded-full flex items-center justify-center">
                      <span className="text-stellamaris-600 font-semibold">
                        {review.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                        {review.isVerifiedPurchase && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Shield size={14} />
                            <span className="text-xs font-medium">Verified Purchase</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(review._creationTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Rating */}
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>

                    {/* Action Menu - Only show if user can edit this review */}
                    {canEditReview(review._id) && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === review._id ? null : review._id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpen === review._id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setEditingReview(review._id)
                                setMenuOpen(null)
                              }}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit size={14} />
                              <span>Edit Review</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              <span>Delete Review</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Menu - Only show for admins */}
                    {isAdmin() && !canEditReview(review._id) && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === review._id ? null : review._id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpen === review._id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => handleRemoveReview(review._id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Flag size={14} />
                              <span>Remove Review</span>
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToReview(review._id)
                                setMenuOpen(null)
                              }}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                              <Reply size={14} />
                              <span>Reply as Admin</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-3">
                  {review.title && (
                    <h5 className="font-semibold text-gray-900">{review.title}</h5>
                  )}
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Image size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Customer Photos ({review.images.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {review.images.map((image, index) => (
                          <div
                            key={image._id}
                            className="relative group cursor-pointer"
                            onClick={() => setLightboxImage(image.imageUrl)}
                          >
                            <img
                              src={image.imageUrl}
                              alt={image.altText || `Review image ${index + 1}`}
                              className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 hover:border-stellamaris-400 transition-colors"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white rounded-full p-2">
                                  <Image size={16} className="text-gray-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Admin Reply Form */}
            {replyingToReview === review._id && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="font-semibold text-blue-800 mb-2">Reply as Admin</h6>
                <textarea
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Write your response..."
                  className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleAdminReply(review._id)}
                    disabled={!adminReplyText.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingToReview(null)
                      setAdminReplyText('')
                    }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Admin Response */}
            {review.adminResponse && (
              <div className="mt-4 bg-gray-50 border-l-4 border-stellamaris-600 p-4">
                <h6 className="font-semibold text-stellamaris-600 mb-2">Response from Stellamaris</h6>
                <p className="text-gray-700">{review.adminResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={lightboxImage}
              alt="Review image enlarged"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-opacity"
            >
              <X size={20} className="text-gray-900" />
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  )
}

export default ReviewList 