import React from 'react';
import { Shield, Package, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ReturnPolicyProps {
  compact?: boolean;
  showTitle?: boolean;
}

const ReturnPolicy: React.FC<ReturnPolicyProps> = ({ 
  compact = false, 
  showTitle = true 
}) => {
  if (compact) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <RefreshCw className="h-5 w-5 text-stellamaris-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Returns & Refunds</h4>
            <p className="text-sm text-gray-600 mb-2">
              30-day returns for domestic orders, 45-day window for defective items. Free return shipping on qualified returns.
            </p>
            <a 
              href="/shipping-returns" 
              className="text-sm text-stellamaris-600 hover:text-stellamaris-700 font-medium"
            >
              View full return policy →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <h2 className="text-2xl font-bold text-gray-900">Return & Refund Policy</h2>
      )}
      
      {/* Key Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-stellamaris-50 rounded-lg">
          <Clock className="h-8 w-8 text-stellamaris-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Return Window</h3>
          <p className="text-sm text-gray-600">
            30 days for domestic orders, 45 days for defective/damaged items
          </p>
        </div>
        
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <Package className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Free Returns</h3>
          <p className="text-sm text-gray-600">
            Free return shipping for defective items and orders over $75
          </p>
        </div>
        
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
          <p className="text-sm text-gray-600">
            Full refund or replacement for damaged or defective products
          </p>
        </div>
      </div>

      {/* Return Time Frames */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Time Frames</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Domestic Orders (USA)</p>
              <p className="text-sm text-gray-600">30 days from delivery date</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Defective/Damaged Items</p>
              <p className="text-sm text-gray-600">45 days from delivery date</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">International Orders</p>
              <p className="text-sm text-gray-600">60 days (customer pays return shipping)</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Custom/Personalized Items</p>
              <p className="text-sm text-gray-600">No returns (unless defective)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Policy */}
      <div className="prose prose-gray max-w-none">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Return Eligibility</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Items Eligible for Return:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Items in original, unused condition with all tags attached</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Items returned within specified time frame</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Items with original packaging and accessories</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Defective or damaged items (with photo evidence)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Non-Returnable Items:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Custom or personalized items (unless defective)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Items showing signs of wear, stains, or damage</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Items returned after the specified time frame</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Items without original tags or packaging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Return Process</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="bg-stellamaris-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                <div>
                  <strong>Initiate Return:</strong> Contact us at returns@stellamaris.com or start a return through your account dashboard. Include your order number and reason for return.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-stellamaris-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                <div>
                  <strong>Return Authorization:</strong> We'll review your request and provide a Return Merchandise Authorization (RMA) number within 24-48 hours.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-stellamaris-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
                <div>
                  <strong>Ship Your Return:</strong> Pack items securely with RMA number clearly marked. Use the prepaid return label (if eligible) or ship at your own expense.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-stellamaris-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</span>
                <div>
                  <strong>Inspection & Refund:</strong> We'll inspect your return within 3-5 business days and process your refund once approved.
                </div>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Refund Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>Refunds processed to original payment method within 5-7 business days</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>Original shipping costs are non-refundable (except for defective items)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>Return shipping costs deducted from refund (unless we provide prepaid label)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>Email confirmation sent once refund is processed</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Damaged or Defective Items</h3>
            <div className="space-y-3 text-gray-700">
              <p><strong>If you receive a damaged or defective item:</strong></p>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>Contact us immediately with photos/videos of the damage</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>We offer full refund or free replacement for damaged items</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>Partial refunds available for minor cosmetic damage</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-stellamaris-600 mt-1">•</span>
                  <span>We may ask you to return the item or provide additional documentation</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Exchanges & Replacements</h3>
            <p className="text-gray-700 mb-3">
              We currently don't offer direct exchanges. For different sizes, colors, or styles:
            </p>
            <ol className="space-y-2 text-gray-700">
              <li>1. Return your original item following our return process</li>
              <li>2. Place a new order for your desired item</li>
              <li>3. We'll prioritize processing your new order once we receive your return</li>
              <li>4. Contact us if you need expedited processing for size exchanges</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Free Return Shipping Includes:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Defective or damaged items</li>
                <li>• Our shipping error (wrong item sent)</li>
                <li>• Orders over $75 (within 30 days)</li>
                <li>• Quality control issues</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">International Returns</h4>
              <p className="text-amber-700 text-sm">
                International customers are responsible for return shipping costs and any customs fees. 
                Please contact returns@stellamaris.com before returning international orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy; 