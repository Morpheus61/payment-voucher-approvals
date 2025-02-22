'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserManagement from './UserManagement'
import AccountHeadManagement from './AccountHeadManagement'
import VoucherList from './VoucherList'
import Navbar from './Navbar'
import { requireAuth } from '@/lib/auth'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [activeUsers, setActiveUsers] = useState([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAuth()
      } catch (error) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, account heads, and vouchers</p>
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
              onClick={() => setActiveTab('accountHeads')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'accountHeads'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Account Head Management
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'vouchers'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Voucher List
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'accountHeads' && <AccountHeadManagement />}
            {activeTab === 'vouchers' && <VoucherList />}
          </div>
        </div>
      </div>
    </div>
  )
}
