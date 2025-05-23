import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Eye,
  MessageCircle
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface Customer {
  _id: Id<"users">;
  _creationTime: number;
  clerkUserId: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: number;
}

const CustomerManagement: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Queries
  const customers = useQuery(api.users.getAllCustomers);
  const customerStats = useQuery(api.users.getCustomerStats);
  const customerOrders = useQuery(
    api.orders.getUserOrders,
    selectedCustomer ? { clerkUserId: selectedCustomer.clerkUserId } : "skip"
  );

  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'high-value' && customer.totalSpent >= 500) ||
                         (filterType === 'frequent' && customer.totalOrders >= 5) ||
                         (filterType === 'new' && Date.now() - customer._creationTime < 30 * 24 * 60 * 60 * 1000);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000) return { name: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (totalSpent >= 500) return { name: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (totalSpent >= 200) return { name: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { name: 'Bronze', color: 'bg-orange-100 text-orange-800' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customer relationships and view analytics</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers?.length || 0}</p>
            </div>
            <User className="h-8 w-8 text-stellamaris-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Value</p>
              <p className="text-2xl font-bold text-purple-600">
                {customers?.filter(c => c.totalSpent >= 500).length || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Frequent Buyers</p>
              <p className="text-2xl font-bold text-blue-600">
                {customers?.filter(c => c.totalOrders >= 5).length || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-green-600">
                {customers?.filter(c => Date.now() - c._creationTime < 30 * 24 * 60 * 60 * 1000).length || 0}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stellamaris-500 focus:border-transparent"
            >
              <option value="all">All Customers</option>
              <option value="high-value">High Value ($500+)</option>
              <option value="frequent">Frequent Buyers (5+ orders)</option>
              <option value="new">New This Month</option>
            </select>
          </div>

          {/* Customer Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers?.map((customer) => {
                    const tier = getCustomerTier(customer.totalSpent);
                    return (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-stellamaris-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-stellamaris-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${customer.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tier.color}`}>
                            {tier.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-stellamaris-600 hover:text-stellamaris-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-700">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Customer Detail Panel */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Customer Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">Customer since {formatDate(selectedCustomer._creationTime)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.totalOrders} Orders</p>
                    <p className="text-sm text-gray-500">Total: ${selectedCustomer.totalSpent.toFixed(2)}</p>
                  </div>
                </div>

                {selectedCustomer.lastOrderDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">Last order</p>
                      <p className="text-sm text-gray-500">{formatDate(selectedCustomer.lastOrderDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Tier */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Customer Tier</p>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCustomerTier(selectedCustomer.totalSpent).color}`}>
                  {getCustomerTier(selectedCustomer.totalSpent).name}
                </span>
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Orders</h4>
                <div className="space-y-3">
                  {customerOrders?.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order._creationTime)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button className="w-full bg-stellamaris-600 text-white py-2 px-4 rounded-lg hover:bg-stellamaris-700 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>View All Orders</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a customer to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement; 