import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Heart, Package, Mail } from 'lucide-react';

interface OrderState {
  orderNumber: string;
  total: number;
  charityDonation: number;
  selectedCharity: string;
}

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const orderData = location.state as OrderState;

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
        <p className="text-gray-600 mb-8">We couldn't find your order information.</p>
        <Link
          to="/"
          className="bg-stellamaris-600 text-white px-6 py-3 rounded-md hover:bg-stellamaris-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const getCharityName = (charityType: string) => {
    const charityMap: Record<string, string> = {
      animal_shelter: 'Animal Shelters',
      environmental: 'Environmental Protection',
      children: 'Children\'s Education',
      education: 'Adult Education Programs',
    };
    return charityMap[charityType] || 'Charity Organizations';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold text-gray-900">{orderData.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-gray-900">${orderData.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Confirmation Email Sent</p>
                  <p className="text-sm text-gray-600">
                    We've sent a confirmation email with your order details and tracking information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charity Impact */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-semibold text-emerald-900">Your Impact</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-emerald-800">
                <span className="font-semibold">${orderData.charityDonation.toFixed(2)}</span> from your order 
                will be donated to <span className="font-semibold">{getCharityName(orderData.selectedCharity)}</span>.
              </p>
              
              <div className="bg-emerald-100 rounded-lg p-4">
                <h3 className="font-medium text-emerald-900 mb-2">Making a Difference Together</h3>
                <p className="text-sm text-emerald-800">
                  Your purchase supports sustainable fashion and helps fund important causes. 
                  You'll receive updates on how your contribution is making a positive impact in the community.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-stellamaris-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-stellamaris-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Processing</p>
                  <p className="text-sm text-gray-600">
                    We'll prepare your order with care and attention to detail.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-stellamaris-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-stellamaris-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Shipping Notification</p>
                  <p className="text-sm text-gray-600">
                    You'll receive tracking information once your order ships.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-stellamaris-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-stellamaris-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Delivery</p>
                  <p className="text-sm text-gray-600">
                    Your sustainable luxury bag will arrive in eco-friendly packaging.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/account"
              className="flex-1 bg-stellamaris-600 text-white text-center py-3 px-6 rounded-md hover:bg-stellamaris-700 transition-colors font-medium"
            >
              View Order History
            </Link>
            <Link
              to="/bags"
              className="flex-1 bg-gray-200 text-gray-800 text-center py-3 px-6 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Customer Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Questions about your order?{' '}
              <a href="mailto:support@stellamaris.com" className="text-stellamaris-600 hover:text-stellamaris-700">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage; 