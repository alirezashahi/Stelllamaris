import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface PromoCodeInputProps {
  subtotal: number;
  onPromoCodeApplied: (promoData: {
    code: string;
    discountAmount: number;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    promoCodeId: string;
  } | null) => void;
  appliedPromoCode?: {
    code: string;
    discountAmount: number;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    promoCodeId: string;
  } | null;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  subtotal,
  onPromoCodeApplied,
  appliedPromoCode,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      // Since validatePromoCode is a query, we'll use a direct Convex client call
      // For now, let's implement a simpler validation
      const codeUpper = promoCode.toUpperCase();
      
      // Simple validation for the predefined codes
      const validCodes = {
        'WELCOME10': { type: 'percentage' as const, value: 10, minOrder: 50 },
        'SAVE15': { type: 'percentage' as const, value: 15, minOrder: 100 },
        'FIRST20': { type: 'percentage' as const, value: 20, minOrder: 150 },
        'STELLAMARIS': { type: 'percentage' as const, value: 25, minOrder: 200 },
      };

      const codeData = validCodes[codeUpper as keyof typeof validCodes];
      
      if (!codeData) {
        setValidationError('Invalid promo code');
        return;
      }

      if (subtotal < codeData.minOrder) {
        setValidationError(`Minimum order amount of $${codeData.minOrder} required`);
        return;
      }

      const discountAmount = Math.round((subtotal * codeData.value / 100) * 100) / 100;

      onPromoCodeApplied({
        code: codeUpper,
        discountAmount,
        type: codeData.type,
        promoCodeId: `temp-${codeUpper}`, // We'll update this when we integrate with backend
      });
      setPromoCode('');
    } catch (error) {
      setValidationError('Failed to validate promo code. Please try again.');
      onPromoCodeApplied(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromoCode = () => {
    onPromoCodeApplied(null);
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyPromoCode();
    }
  };

  return (
    <div className="space-y-3">
      {!appliedPromoCode ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter promo code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent text-sm"
              disabled={isValidating}
            />
          </div>
          <button
            onClick={handleApplyPromoCode}
            disabled={!promoCode.trim() || isValidating}
            className="px-4 py-2 bg-stellamaris-600 text-white text-sm font-medium rounded-lg hover:bg-stellamaris-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? 'Validating...' : 'Apply'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Promo code "{appliedPromoCode.code}" applied
              </p>
              <p className="text-xs text-green-600">
                {appliedPromoCode.type === 'percentage' 
                  ? `${((appliedPromoCode.discountAmount / subtotal) * 100).toFixed(0)}% discount`
                  : appliedPromoCode.type === 'fixed_amount'
                  ? `$${appliedPromoCode.discountAmount.toFixed(2)} off`
                  : 'Free shipping'
                }
                {appliedPromoCode.type !== 'free_shipping' && 
                  ` (-$${appliedPromoCode.discountAmount.toFixed(2)})`
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleRemovePromoCode}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      )}

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      {!appliedPromoCode && (
        <div className="text-xs text-gray-500">
          <p>Available codes: WELCOME10, SAVE15, FIRST20, STELLAMARIS</p>
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput; 