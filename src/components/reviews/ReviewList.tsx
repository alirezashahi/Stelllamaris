import React from 'react'
import { Star, Shield } from 'lucide-react'

interface Review {
  _id: string
  _creationTime: number
  productId: string
  userId: string
  rating: number
  title?: string
  comment?: string
  isVerifiedPurchase: boolean
  userName: string
  adminResponse?: string
}

interface ReviewListProps {
  reviews: Review[]
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
            </div>

            {/* Review Content */}
            <div className="space-y-3">
              {review.title && (
                <h5 className="font-semibold text-gray-900">{review.title}</h5>
              )}
              {review.comment && (
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              )}
            </div>

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
    </div>
  )
}

export default ReviewList 