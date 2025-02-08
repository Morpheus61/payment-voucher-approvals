'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient' // Correct singleton import
import { sendEmail } from '@/lib/email'

type User = {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'approver' | 'requester'
  full_name: string
  mobile: string
  created_at: string
  updated_at: string
}

type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'>

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    role: 'requester',
    full_name: '',
    mobile: ''
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/users')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const { users: usersData } = await response.json()
      console.log('Users data from API:', usersData)

      if (!usersData) {
        throw new Error('No users data received')
      }

      // Process and validate each user's data
      const processedUsers = usersData.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || '',
        mobile: user.mobile || '',
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))

      setUsers(processedUsers)
    } catch (err) {
      console.error('Error in fetchUsers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Add realtime subscription for updates
  useEffect(() => {
    const usersSubscription = supabase
      .channel('users_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, 
        () => {
          console.log('Database changed, fetching fresh data')
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      usersSubscription.unsubscribe()
    }
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!newUser.email || !newUser.full_name || !newUser.mobile) {
        throw new Error('Please fill in all required fields')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate mobile number format
      const mobileRegex = /^\+?[0-9]{10,12}$/
      if (!mobileRegex.test(newUser.mobile)) {
        throw new Error('Invalid mobile number format. Please enter 10-12 digits with optional + prefix')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const userData = {
        ...newUser,
        mobile: newUser.mobile.replace(/\+/g, '') // Remove + from mobile number
      }
      console.log('Creating new user:', userData)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      console.log('Server response:', data)

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create user')
      }

      // Send welcome email
      try {
        await sendEmail({
          to: newUser.email,
          subject: 'Welcome to Payment Voucher Approvals',
          html: `
            <h1>Welcome to Payment Voucher Approvals</h1>
            <p>Your account has been created with the following details:</p>
            <ul>
              <li>Role: ${newUser.role}</li>
              <li>Name: ${newUser.full_name}</li>
            </ul>
            <p>Please use the password reset link in your email to set your password.</p>
          `
        })
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't throw error here, as user is already created
      }

      // Clear form and refresh user list
      setNewUser({
        email: '',
        role: 'requester',
        full_name: '',
        mobile: ''
      })
      await fetchUsers()
    } catch (err) {
      console.error('Error adding user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    setLoading(true)
    setError(null)

    try {
      // First update the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: editingUser.full_name,
          mobile: editingUser.mobile,
          role: editingUser.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (dbError) throw new Error(dbError.message)

      // Update local state to reflect changes immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editingUser.id 
            ? {
                ...user,
                full_name: editingUser.full_name,
                mobile: editingUser.mobile,
                role: editingUser.role,
                updated_at: new Date().toISOString()
              }
            : user
        )
      )

      setIsEditModalOpen(false)
      setEditingUser(null)
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to delete user')
      }

      // Update will happen via realtime subscription
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const renderUserRow = (user: User) => (
    <tr key={user.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {user.full_name ? user.full_name : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
          user.role === 'approver' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {user.mobile ? user.mobile : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => {
            setEditingUser(user);
            setIsEditModalOpen(true);
          }}
          className="text-blue-600 hover:text-blue-900 mr-4"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteUser(user.id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Approvers</h3>
          <p className="text-2xl font-semibold text-green-600">
            {users.filter(u => u.role === 'approver').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Requesters</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {users.filter(u => u.role === 'requester').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Admins</h3>
          <p className="text-2xl font-semibold text-purple-600">
            {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
          </p>
        </div>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
          <p className="text-sm text-gray-500">Create a new user account</p>
        </div>
        
        <form onSubmit={handleAddUser} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 p-2 w-full border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={newUser.full_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1 p-2 w-full border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={newUser.mobile}
                onChange={(e) => setNewUser(prev => ({ ...prev, mobile: e.target.value }))}
                className="mt-1 p-2 w-full border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                className="mt-1 p-2 w-full border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="requester">Requester</option>
                <option value="approver">Approver</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Active Users</h2>
          <p className="text-sm text-gray-500">Manage and view all active users</p>
        </div>

        <div className="overflow-x-auto">
          {error && (
            <div className="p-4 text-red-500 bg-red-50 border-l-4 border-red-500">
              <p className="font-medium">Error loading users</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(renderUserRow)}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser(prev => ({ ...prev!, full_name: e.target.value }))}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input
                  type="tel"
                  value={editingUser.mobile}
                  onChange={(e) => setEditingUser(prev => ({ ...prev!, mobile: e.target.value }))}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => ({ ...prev!, role: e.target.value as User['role'] }))}
                  className="mt-1 p-2 w-full border rounded"
                  required
                >
                  <option value="requester">Requester</option>
                  <option value="approver">Approver</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {error && <p className="text-red-500">{error}</p>}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
