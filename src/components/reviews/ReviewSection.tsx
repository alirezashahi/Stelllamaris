import React, { useState } from 'react'
import { Star, ThumbsUp, Shield } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'
import ReviewStats from './ReviewStats'

interface ReviewSectionProps {
  productId: Id<"products">
  productName: string
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, productName }) => {
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  const reviews = useQuery(api.reviews.getProductReviews, { productId })
  const reviewStats = useQuery(api.reviews.getProductReviewStats, { productId })

  if (reviews === undefined || reviewStats === undefined) {
    return <div className="animate-pulse">Loading reviews...</div>
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
  }

  return (
    <div className="space-y-8">
      {/* Review Statistics */}
      <ReviewStats stats={reviewStats} />

      {/* Review Form Toggle */}
      <div className="border-t border-gray-200 pt-8">
        {!showReviewForm ? (
          <div className="text-center">
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn-primary"
            >
              Write a Review
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Share your experience with {productName}
            </p>
          </div>
        ) : (
          <ReviewForm
            productId={productId}
            productName={productName}
            onCancel={() => setShowReviewForm(false)}
            onSubmitted={handleReviewSubmitted}
          />
        )}
      </div>

      {/* Reviews List */}
      <div className="border-t border-gray-200 pt-8">
        <ReviewList 
          reviews={reviews} 
          productId={productId}
          productName={productName}
        />
      </div>
    </div>
  )
}

export default ReviewSection 