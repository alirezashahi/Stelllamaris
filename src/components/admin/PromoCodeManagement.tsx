import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Percent, Plus, Edit2, Trash2, Eye, Calendar, Users, DollarSign } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface PromoCode {
  _id: Id<"promoCodes">;
  _creationTime: number;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  isActive: boolean;
  validFrom: number;
  validUntil: number;
  minimumOrderAmount?: number;
  maxUsageCount?: number;
  currentUsageCount: number;
  maxUsagePerUser?: number;
}

interface PromoCodeFormData {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  validFrom: string;
  validUntil: string;
  minimumOrderAmount: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
}

const PromoCodeManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    type: 'percentage',
    value: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minimumOrderAmount: '',
    maxUsageCount: '',
    maxUsagePerUser: '',
  });

  // Queries
  const promoCodes = useQuery(api.promoCodes.getAllPromoCodes);
  const promoCodeStats = useQuery(
    api.promoCodes.getPromoCodeStats,
    selectedPromoCode ? { promoCodeId: selectedPromoCode._id } : "skip"
  );

  // Mutations
  const createPromoCode = useMutation(api.promoCodes.createPromoCode);
  const updatePromoCode = useMutation(api.promoCodes.updatePromoCode);
  const deletePromoCode = useMutation(api.promoCodes.deletePromoCode);

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPromoCode({
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.value,
        validFrom: new Date(formData.validFrom).getTime(),
        validUntil: new Date(formData.validUntil).getTime(),
        minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : undefined,
        maxUsageCount: formData.maxUsageCount ? parseInt(formData.maxUsageCount) : undefined,
        maxUsagePerUser: formData.maxUsagePerUser ? parseInt(formData.maxUsagePerUser) : undefined,
      });
      
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create promo code:', error);
    }
  };

  const handleUpdatePromoCode = async (promoCodeId: Id<"promoCodes">, updates: any) => {
    try {
      await updatePromoCode({ promoCodeId, ...updates });
    } catch (error) {
      console.error('Failed to update promo code:', error);
    }
  };

  const handleDeletePromoCode = async (promoCodeId: Id<"promoCodes">) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await deletePromoCode({ promoCodeId });
        setSelectedPromoCode(null);
      } catch (error) {
        console.error('Failed to delete promo code:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minimumOrderAmount: '',
      maxUsageCount: '',
      maxUsagePerUser: '',
    });
    setEditingPromoCode(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (promoCode: PromoCode) => {
    const now = Date.now();
    if (!promoCode.isActive) return 'bg-gray-100 text-gray-800';
    if (now < promoCode.validFrom) return 'bg-yellow-100 text-yellow-800';
    if (now > promoCode.validUntil) return 'bg-red-100 text-red-800';
    if (promoCode.maxUsageCount && promoCode.currentUsageCount >= promoCode.maxUsageCount) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (promoCode: PromoCode) => {
    const now = Date.now();
    if (!promoCode.isActive) return 'Inactive';
    if (now < promoCode.validFrom) return 'Scheduled';
    if (now > promoCode.validUntil) return 'Expired';
    if (promoCode.maxUsageCount && promoCode.currentUsageCount >= promoCode.maxUsageCount) return 'Limit Reached';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Code Management</h1>
          <p className="text-gray-600">Create and manage discount codes for your store</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-stellamaris-600 text-white px-4 py-2 rounded-lg hover:bg-stellamaris-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Codes</p>
              <p className="text-2xl font-bold text-gray-900">{promoCodes?.length || 0}</p>
            </div>
            <Percent className="h-8 w-8 text-stellamaris-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Codes</p>
              <p className="text-2xl font-bold text-green-600">
                {promoCodes?.filter(code => {
                  const now = Date.now();
                  return code.isActive && now >= code.validFrom && now <= code.validUntil;
                }).length || 0}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-blue-600">
                {promoCodes?.reduce((sum, code) => sum + code.currentUsageCount, 0) || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Savings</p>
              <p className="text-2xl font-bold text-purple-600">
                {promoCodeStats ? `$${promoCodeStats.totalDiscountGiven.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Promo Codes</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promoCodes?.map((promoCode) => (
                <tr key={promoCode._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{promoCode.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promoCode.type === 'percentage' && `${promoCode.value}% off`}
                      {promoCode.type === 'fixed_amount' && `$${promoCode.value} off`}
                      {promoCode.type === 'free_shipping' && 'Free shipping'}
                    </div>
                    {promoCode.minimumOrderAmount && (
                      <div className="text-xs text-gray-500">
                        Min order: ${promoCode.minimumOrderAmount}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promoCode)}`}>
                      {getStatusText(promoCode)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {promoCode.currentUsageCount}
                    {promoCode.maxUsageCount && ` / ${promoCode.maxUsageCount}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{formatDate(promoCode.validFrom)}</div>
                    <div className="text-gray-500">to {formatDate(promoCode.validUntil)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedPromoCode(promoCode)}
                      className="text-stellamaris-600 hover:text-stellamaris-700"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUpdatePromoCode(promoCode._id, { isActive: !promoCode.isActive })}
                      className={`${promoCode.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePromoCode(promoCode._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promo Code Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Promo Code</h3>
            
            <form onSubmit={handleCreatePromoCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  placeholder="SAVE20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {formData.type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    step={formData.type === 'percentage' ? 1 : 0.01}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Usage Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsageCount}
                  onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Uses Per User
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsagePerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  placeholder="Unlimited"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-stellamaris-600 text-white py-2 px-4 rounded-md hover:bg-stellamaris-700 transition-colors"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManagement; 