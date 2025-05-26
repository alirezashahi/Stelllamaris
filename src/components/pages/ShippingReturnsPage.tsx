import React from 'react';
import { Truck, Clock, MapPin, Plane, Globe, Shield, AlertCircle, Camera, Package, FileText, RefreshCw } from 'lucide-react';
import ReturnPolicy from '../policies/ReturnPolicy';

const ShippingReturnsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping & Returns</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer fast, reliable shipping worldwide and comprehensive return protection. 
            Your satisfaction is our priority with flexible return options and full customer support.
          </p>
        </div>

        {/* Quick Return Info Banner */}
        <div className="bg-gradient-to-r from-stellamaris-600 to-stellamaris-700 text-white rounded-lg p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="h-8 w-8" />
              <div>
                <div className="font-semibold text-lg">30-Day Returns</div>
                <div className="text-stellamaris-100">Domestic orders</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <div className="font-semibold text-lg">60-Day International</div>
                <div className="text-stellamaris-100">Extended window</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Package className="h-8 w-8" />
              <div>
                <div className="font-semibold text-lg">Free Return Shipping</div>
                <div className="text-stellamaris-100">Orders over $75</div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Shipping Information</h2>
          
          {/* Shipping Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Truck className="h-8 w-8 text-stellamaris-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Standard Shipping</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600"><strong>Cost:</strong> Free on orders over $75</p>
                <p className="text-gray-600"><strong>Delivery:</strong> 5-7 business days</p>
                <p className="text-gray-600"><strong>Tracking:</strong> Included</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Clock className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Express Shipping</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600"><strong>Cost:</strong> $15.00</p>
                <p className="text-gray-600"><strong>Delivery:</strong> 2-3 business days</p>
                <p className="text-gray-600"><strong>Tracking:</strong> Priority tracking</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Plane className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Overnight</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600"><strong>Cost:</strong> $35.00</p>
                <p className="text-gray-600"><strong>Delivery:</strong> Next business day</p>
                <p className="text-gray-600"><strong>Cutoff:</strong> Order by 2 PM EST</p>
              </div>
            </div>
          </div>

          {/* Domestic vs International */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-stellamaris-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Domestic Shipping (US)</h3>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>• Free standard shipping on orders over $75</p>
                <p>• Orders under $75 have a $8.99 shipping fee</p>
                <p>• Express and overnight options available</p>
                <p>• Ships Monday through Friday</p>
                <p>• Orders placed before 2 PM EST ship same day</p>
                <p>• Delivery to all 50 states including Alaska and Hawaii</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">International Shipping</h3>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>• Available to most countries worldwide</p>
                <p>• Rates calculated at checkout based on destination</p>
                <p>• Delivery time: 7-14 business days</p>
                <p>• Duties and taxes may apply (not included)</p>
                <p>• Tracking available for all international orders</p>
                <p>• Contact us for expedited international options</p>
              </div>
            </div>
          </div>

          {/* Order Processing Info */}
          <div className="bg-stellamaris-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-stellamaris-800 mb-3">Order Processing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-stellamaris-700">
              <div>
                <p className="mb-2"><strong>Processing Time:</strong> 1-2 business days</p>
                <p className="mb-2"><strong>Same-Day Shipping:</strong> Orders before 2 PM EST</p>
              </div>
              <div>
                <p className="mb-2"><strong>Business Days:</strong> Monday - Friday</p>
                <p className="mb-2"><strong>Holiday Delays:</strong> Processing may be delayed during holidays</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Returns Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Return Policy & Information</h2>
          
          {/* Return Timeframes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-3">
                <Clock className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Domestic Returns</h3>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">30 Days</p>
              <p className="text-gray-600">From delivery date for all domestic orders within the United States</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Defective Items</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">45 Days</p>
              <p className="text-gray-600">Extended window for damaged or defective products</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center mb-3">
                <Globe className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">International</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">60 Days</p>
              <p className="text-gray-600">Extended window for international orders</p>
            </div>
          </div>

          {/* Country-Specific Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Country-Specific Return Windows</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">🇺🇸 United States</h4>
                <p className="text-gray-600">45 days for all orders</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">🇧🇷 Brazil</h4>
                <p className="text-gray-600">110 days extended window</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">📦 CJPacket Liquid Line</h4>
                <p className="text-gray-600">100 days special shipping</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">🌍 Other Countries</h4>
                <p className="text-gray-600">60 days standard international</p>
              </div>
            </div>
          </div>

          {/* Return Conditions & Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Package className="h-6 w-6 text-stellamaris-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Return Conditions</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-stellamaris-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Items must be in original, unused condition
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-stellamaris-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  All original tags and labels must be attached
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-stellamaris-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Original packaging required for all returns
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-stellamaris-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  No signs of wear, stains, or damage
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-stellamaris-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Custom/personalized items excluded (unless defective)
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Camera className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Evidence Requirements</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Photos/videos required for damaged items
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Email screenshots for delivery issues
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Multiple angles showing the defect
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Product returns when specifically requested
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Evidence uploaded within return window
                </li>
              </ul>
            </div>
          </div>

          {/* Return Types & Process */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Return Types & Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <RefreshCw className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Return for Refund</h4>
                <p className="text-sm text-gray-600">Full refund to original payment method</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Package className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Exchange</h4>
                <p className="text-sm text-gray-600">Different size, color, or style</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Partial Refund</h4>
                <p className="text-sm text-gray-600">Keep item, receive partial compensation</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Dispute</h4>
                <p className="text-sm text-gray-600">Investigation for complex issues</p>
              </div>
            </div>
          </div>

          {/* Return Shipping Costs */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Return Shipping Responsibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3">We Pay Return Shipping For:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Defective or damaged items</li>
                  <li>• Wrong items sent (our error)</li>
                  <li>• Orders over $75 within 30 days</li>
                  <li>• Quality issues verified by our team</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-3">Customer Pays Return Shipping For:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Change of mind returns</li>
                  <li>• Size or color preference changes</li>
                  <li>• Orders under $75</li>
                  <li>• International returns (varies by country)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Special Circumstances */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Special Circumstances</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Delayed Orders</h4>
                <p className="text-gray-600 text-sm">Extended return window if delivery is significantly delayed beyond estimated timeframe</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Non-Received Orders</h4>
                <p className="text-gray-600 text-sm">Full refund or replacement for orders confirmed lost in transit</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Quality Disputes</h4>
                <p className="text-gray-600 text-sm">Investigation process with evidence review and expert assessment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Return Policy Component */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <ReturnPolicy showTitle={true} />
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Packaging & Sustainability</h3>
            <div className="space-y-3 text-gray-700">
              <p>• All orders are carefully packaged to prevent damage</p>
              <p>• We use eco-friendly packaging materials when possible</p>
              <p>• Luxury items come with protective dust bags</p>
              <p>• Recyclable shipping materials</p>
              <p>• Minimal packaging to reduce environmental impact</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3 text-gray-700">
              <p><strong>Customer Service:</strong> support@stellamaris.com</p>
              <p><strong>Returns:</strong> returns@stellamaris.com</p>
              <p><strong>Phone:</strong> 1-800-STELLA-M (1-800-783-5526)</p>
              <p><strong>Hours:</strong> Monday - Friday, 9 AM - 6 PM EST</p>
              <p><strong>Response Time:</strong> Within 24 hours</p>
              <p><strong>Return Initiation:</strong> Through your account dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturnsPage; 