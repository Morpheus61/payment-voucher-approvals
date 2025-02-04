'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { sendEmail } from '@/lib/email'

type User = {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'approver' | 'requester'
  full_name: string
  mobile: string
  created_at: string
}

type NewUser = Omit<User, 'id' | 'created_at'>

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

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Add user to Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: Math.random().toString(36).slice(-8), // Generate random password
      });

      if (authError) throw new Error(authError.message);

      // Add user details to users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .insert([{
          ...newUser,
          id: authData.user?.id,
        }])
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      // Send welcome email
      const emailResult = await sendEmail({
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
      });

      if (!emailResult.success) {
        console.warn('Failed to send welcome email:', emailResult.error);
        setError('User created successfully but failed to send welcome email. Please check your email configuration.');
      }

      // Update users state
      setUsers(prevUsers => [userData, ...prevUsers]);

      // Reset form
      setNewUser({
        email: '',
        role: 'requester',
        full_name: '',
        mobile: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setLoading(false);
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: editingUser.full_name,
          mobile: editingUser.mobile,
          role: editingUser.role
        })
        .eq('id', editingUser.id);

      if (dbError) throw new Error(dbError.message);

      // Update users state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editingUser.id ? editingUser : user
        )
      );

      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) throw new Error(dbError.message);

      // Update users state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="space-y-4 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold">Add New User</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            className="p-2 border rounded"
            required
          />
          
          <input
            type="text"
            placeholder="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
            className="p-2 border rounded"
            required
          />
          
          <input
            type="tel"
            placeholder="Mobile"
            value={newUser.mobile}
            onChange={(e) => setNewUser(prev => ({ ...prev, mobile: e.target.value }))}
            className="p-2 border rounded"
            required
          />
          
          <select
            value={newUser.role}
            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
            className="p-2 border rounded"
            required
          >
            <option value="requester">Requester</option>
            <option value="approver">Approver</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>

      {/* Users List */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'approver' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.mobile}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setIsEditModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
