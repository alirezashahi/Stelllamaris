import React, { useState, useEffect } from 'react'
import { Star, X, User, Camera, Upload, Trash2, Plus } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useAuth } from '../../contexts/AuthContext'

interface Review {  _id: string;  rating: number;  title?: string;  comment?: string;  images?: any[];}

interface ReviewFormProps {
  productId: Id<"products">
  productName: string
  onCancel: () => void
  onSubmitted: () => void
  editingReview?: Review
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId, 
  productName, 
  onCancel, 
  onSubmitted,
  editingReview
}) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const submitReview = useMutation(api.reviews.submitReview)
  const updateReview = useMutation(api.reviews.updateReview)
  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl)
  const saveReviewImage = useMutation(api.fileUpload.saveReviewImage)
  const { user, isAuthenticated, signIn } = useAuth()

  // Initialize form with existing review data if editing
  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating)
      setTitle(editingReview.title || '')
      setComment(editingReview.comment || '')
      if (editingReview.images) {
        setUploadedImages(editingReview.images.map(img => img.imageUrl))
      }
    }
  }, [editingReview])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const imageUrls: string[] = []

      for (let i = 0; i < Math.min(files.length, 5 - uploadedImages.length); i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please upload only image files')
          continue
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size must be less than 5MB')
          continue
        }

        // Get upload URL
        const uploadUrl = await generateUploadUrl()

        // Upload file
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const { storageId } = await response.json()

        // Get the file URL
        const imageUrl = await saveReviewImage({
          storageId,
          altText: `Review image ${uploadedImages.length + imageUrls.length + 1}`,
        })

        imageUrls.push(imageUrl)
      }

      setUploadedImages(prev => [...prev, ...imageUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isAuthenticated || !user) {
      setError('Please sign in to submit a review')
      return
    }

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!comment.trim()) {
      setError('Please write a review comment')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingReview) {
        // Update existing review
        await updateReview({
          reviewId: editingReview._id as Id<"reviews">,
          clerkUserId: user.id,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          imageUrls: uploadedImages.length > 0 ? uploadedImages : undefined,
        })
      } else {
        // Create new review
        await submitReview({
          productId,
          clerkUserId: user.id,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          imageUrls: uploadedImages.length > 0 ? uploadedImages : undefined,
        })
      }

      onSubmitted()
    } catch (err) {
      // Clean up error messages to be more user-friendly
      let userFriendlyError = `Failed to ${editingReview ? 'update' : 'submit'} review`
      
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        
        if (errorMessage.includes('you can only review products you have purchased')) {
          userFriendlyError = 'You can only review products you have purchased and received.'
        } else if (errorMessage.includes('already reviewed')) {
          userFriendlyError = 'You have already reviewed this product. You can edit your existing review instead.'
        } else if (errorMessage.includes('not found')) {
          userFriendlyError = 'Product not found. Please try again.'
        } else if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
          userFriendlyError = 'You do not have permission to perform this action.'
        } else {
          // For any other errors, use a generic message
          userFriendlyError = `Failed to ${editingReview ? 'update' : 'submit'} review. Please try again.`
        }
      }
      
      setError(userFriendlyError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStarClick = (clickedRating: number) => {
    setRating(clickedRating)
  }

  const handleStarHover = (hoveredStar: number) => {
    setHoveredRating(hoveredStar)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const displayRating = hoveredRating || rating

  const handleSignIn = () => {
    signIn()
  }

  // Show sign-in prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-center py-8">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Sign In to Review</h4>
          <p className="text-gray-600 mb-6">
            You need to be signed in to write a product review.
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleSignIn}
              className="bg-stellamaris-600 text-white px-6 py-2 rounded-md hover:bg-stellamaris-700 transition-colors w-full"
            >
              Sign In
            </button>
            <button 
              onClick={onCancel}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingReview ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Info */}
        <div className="border-b border-gray-200 pb-4">
          <p className="text-sm text-gray-600">
            You're {editingReview ? 'editing your review for' : 'reviewing'}: <span className="font-semibold text-gray-900">{productName}</span>
          </p>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className="text-gray-300 hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-stellamaris-500 focus:ring-offset-2 rounded"
              >
                <Star
                  size={32}
                  className={
                    star <= displayRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-3 text-sm text-gray-600">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label htmlFor="review-title" className="block text-sm font-medium text-gray-900 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-stellamaris-500"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Review Comment */}
        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-gray-900 mb-2">
            Your Review *
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your experience with this product..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-stellamaris-500"
            maxLength={1000}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Add Photos (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload up to 5 photos to show how the product looks. Max 5MB per image.
          </p>

          {/* Upload Area */}
          {uploadedImages.length < 5 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-stellamaris-400 transition-colors">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading || uploadedImages.length >= 5}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                {uploading ? (
                  <Upload size={32} className="text-stellamaris-600 animate-pulse" />
                ) : (
                  <Camera size={32} className="text-gray-400" />
                )}
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload photos or drag and drop'}
                </span>
                <span className="text-xs text-gray-500">
                  {5 - uploadedImages.length} photo{5 - uploadedImages.length !== 1 ? 's' : ''} remaining
                </span>
              </label>
            </div>
          )}

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                {uploadedImages.length < 5 && (
                  <label
                    htmlFor="image-upload"
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-stellamaris-400 transition-colors"
                  >
                    <Plus size={24} className="text-gray-400" />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isSubmitting || uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploading || rating === 0 || !comment.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (editingReview ? 'Updating...' : 'Submitting...') : (editingReview ? 'Update Review' : 'Submit Review')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReviewForm 