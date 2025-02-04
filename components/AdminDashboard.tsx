'use client'
import { useState } from 'react'
import UserManagement from './UserManagement'
import AnalyticsCharts from './AnalyticsCharts'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users and view expense analytics</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex gap-4 border-b px-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-6 font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-6 font-medium ${
              activeTab === 'analytics'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expense Analytics
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'analytics' && <AnalyticsCharts />}
        </div>
      </div>
    </div>
  )
}
