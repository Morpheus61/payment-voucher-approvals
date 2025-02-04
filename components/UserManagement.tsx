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

      // Update users state directly instead of fetching
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
