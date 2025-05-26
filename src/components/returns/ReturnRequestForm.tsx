import React, { useState } from 'react';
import { AlertTriangle, Upload, X, CheckCircle, Package, FileText } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface Order {
  _id: Id<"orders">;
  orderNumber: string;
  _creationTime: number;
  status: string;
  totalAmount: number;
  deliveredAt?: number;
  disputeMode?: boolean;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface ReturnRequestFormProps {
  order: Order;
  userId: Id<"users">;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({
  order,
  userId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    type: (order.disputeMode ? 'dispute' : 'return') as 'return' | 'exchange' | 'refund' | 'dispute',
    reason: 'defective' as string,
    description: '',
    returnItems: order.items.map((_, index) => ({
      orderItemIndex: index,
      quantity: 0,
      reason: ''
    })),
    requestedAmount: undefined as number | undefined,
    evidenceUrls: [] as string[]
  });

  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check return eligibility
  const returnEligibility = useQuery(
    api.returns.canRequestReturnForOrder,
    { orderId: order._id, userId }
  );

  // Create return request mutation
  const createReturnRequest = useMutation(api.returns.createReturnRequest);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemSelection = (itemIndex: number, quantity: number, reason: string) => {
    setFormData(prev => ({
      ...prev,
      returnItems: prev.returnItems.map((item, index) =>
        index === itemIndex
          ? { ...item, quantity, reason }
          : item
      )
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      // TODO: Implement file upload to your preferred storage service
      // For now, we'll simulate the upload
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        uploadedUrls.push(`https://example.com/evidence/${Date.now()}-${i}`);
      }

      setFormData(prev => ({
        ...prev,
        evidenceUrls: [...prev.evidenceUrls, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form
    const selectedItems = formData.returnItems.filter(item => item.quantity > 0);
    if (selectedItems.length === 0) {
      setSubmitError('Please select at least one item to return');
      return;
    }

    if (!formData.description.trim()) {
      setSubmitError('Please provide a description of the issue');
      return;
    }

    try {
      await createReturnRequest({
        orderId: order._id,
        userId,
        type: formData.type,
        reason: formData.reason as any,
        description: formData.description,
        returnItems: selectedItems,
        requestedAmount: formData.requestedAmount,
        evidenceUrls: formData.evidenceUrls.length > 0 ? formData.evidenceUrls : undefined,
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to create return request:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit return request');
    }
  };

  const reasonOptions = [
    { value: 'defective', label: 'Item is defective or damaged' },
    { value: 'wrong_item', label: 'Wrong item sent' },
    { value: 'not_as_described', label: 'Item not as described' },
    { value: 'damaged_in_shipping', label: 'Damaged during shipping' },
    { value: 'size_issue', label: 'Size doesn\'t fit' },
    { value: 'quality_issue', label: 'Quality not as expected' },
    { value: 'change_of_mind', label: 'Changed my mind' },
    { value: 'other', label: 'Other reason' }
  ];

  const typeOptions = [
    { value: 'return', label: 'Return for Refund', description: 'Return items for a full refund' },
    { value: 'exchange', label: 'Exchange', description: 'Exchange for different size/color' },
    { value: 'refund', label: 'Partial Refund', description: 'Keep items but request partial refund' },
    { value: 'dispute', label: 'Dispute', description: 'Report an issue for investigation' }
  ];

  // Check if return is allowed
  if (returnEligibility && !returnEligibility.canReturn) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Return Not Available</h3>
        </div>
        <p className="text-gray-600 mb-4">{returnEligibility.reason}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-stellamaris-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Return Request</h3>
              <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Return Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Return Type
          </label>
          <div className="space-y-3">
            {typeOptions.map(option => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={formData.type === option.value}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mt-1 h-4 w-4 text-stellamaris-600 focus:ring-stellamaris-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Return
          </label>
          <select
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
            required
          >
            {reasonOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Item Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Items to Return
          </label>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.productName}</h4>
                    {item.variantName && (
                      <p className="text-sm text-gray-600">{item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      ${item.unitPrice.toFixed(2)} × {item.quantity} = ${item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to Return
                    </label>
                    <select
                      value={formData.returnItems[index].quantity}
                      onChange={(e) => handleItemSelection(
                        index,
                        parseInt(e.target.value),
                        formData.returnItems[index].reason
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                    >
                      {Array.from({ length: item.quantity + 1 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? 'Not returning' : `${i} item${i > 1 ? 's' : ''}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.returnItems[index].quantity > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for this item
                      </label>
                      <input
                        type="text"
                        value={formData.returnItems[index].reason}
                        onChange={(e) => handleItemSelection(
                          index,
                          formData.returnItems[index].quantity,
                          e.target.value
                        )}
                        placeholder="Specific issue with this item"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            placeholder="Please provide detailed information about the issue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
            required
          />
        </div>

        {/* Requested Amount (for partial refunds) */}
        {formData.type === 'refund' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Refund Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={order.totalAmount}
                value={formData.requestedAmount || ''}
                onChange={(e) => handleInputChange('requestedAmount', parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Maximum refund: ${order.totalAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Evidence Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence (Photos/Videos)
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Upload photos or videos showing the issue (optional but helpful for faster processing)
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="text-stellamaris-600 hover:text-stellamaris-700 font-medium">
                {uploading ? 'Uploading...' : 'Click to upload files'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, MP4 up to 10MB each
            </p>
          </div>

          {formData.evidenceUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
              <div className="space-y-2">
                {formData.evidenceUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-600">Evidence file {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          evidenceUrls: prev.evidenceUrls.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-stellamaris-600 text-white rounded-lg hover:bg-stellamaris-700 disabled:bg-gray-400 flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Submit Return Request'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnRequestForm; 