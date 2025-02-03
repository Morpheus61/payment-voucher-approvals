'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'requester',
    full_name: '',
    mobile: ''
  })

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      setUsers(data || [])
    }
    fetchUsers()
  }, [])

  const addUser = async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password: Math.random().toString(36).slice(-8),
      user_metadata: {
        role: newUser.role,
        full_name: newUser.full_name,
        mobile: newUser.mobile
      }
    })

    if (data.user) {
      setUsers([...users, data.user])
      setNewUser({ email: '', role: 'requester', full_name: '', mobile: '' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-4">Add New User</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            className="p-2 border rounded"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            className="p-2 border rounded"
          >
            <option value="requester">Requester</option>
            <option value="approver">Approver</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="text"
            placeholder="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
            className="p-2 border rounded"
          />
          <input
            type="tel"
            placeholder="Mobile Number"
            value={newUser.mobile}
            onChange={(e) => setNewUser({...newUser, mobile: e.target.value})}
            className="p-2 border rounded"
          />
          <button
            onClick={addUser}
            className="col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create User
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Mobile</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">{user.full_name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2 capitalize">{user.role}</td>
                <td className="px-4 py-2">{user.mobile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
