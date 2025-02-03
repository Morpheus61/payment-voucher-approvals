'use client'
import { useState } from 'react'
import UserManagement from './UserManagement'
import AnalyticsCharts from './AnalyticsCharts'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 ${activeTab === 'users' ? 'border-b-2 border-blue-500' : ''}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Expense Analytics
        </button>
      </div>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'analytics' && <AnalyticsCharts />}
    </div>
  )
}
