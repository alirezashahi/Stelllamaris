import React, { useState } from 'react'
import { Package, Users, ShoppingBag, TrendingUp, Settings } from 'lucide-react'
import OrderManagement from './OrderManagement'

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders')

  const TabButton = ({ id, label, icon: Icon, isActive }: {
    id: string
    label: string
    icon: React.ComponentType<any>
    isActive: boolean
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-stellamaris-100 text-stellamaris-800'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your Stellamaris e-commerce store</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <Package className="text-stellamaris-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-stellamaris-600">156</p>
              </div>
              <Users className="text-stellamaris-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-2xl font-bold text-green-600">89</p>
              </div>
              <ShoppingBag className="text-green-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">$12.4k</p>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                <TabButton
                  id="orders"
                  label="Order Management"
                  icon={Package}
                  isActive={activeTab === 'orders'}
                />
                <TabButton
                  id="products"
                  label="Products"
                  icon={ShoppingBag}
                  isActive={activeTab === 'products'}
                />
                <TabButton
                  id="users"
                  label="Users"
                  icon={Users}
                  isActive={activeTab === 'users'}
                />
                <TabButton
                  id="settings"
                  label="Settings"
                  icon={Settings}
                  isActive={activeTab === 'settings'}
                />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {activeTab === 'orders' && <OrderManagement />}
              
              {activeTab === 'products' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Product Management</h2>
                  <p className="text-gray-600">Product management coming soon...</p>
                </div>
              )}
              
              {activeTab === 'users' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">User Management</h2>
                  <p className="text-gray-600">User management coming soon...</p>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>
                  <p className="text-gray-600">Settings panel coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 