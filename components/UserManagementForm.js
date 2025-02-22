import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserManagementForm = () => {
  const [user, setUser] = useState({
    full_name: '',
    username: '',
    email: '',
    mobile_number: '',
    role: 'requester',
  });
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const { data, error } = await supabase
        .from('users')
        .update(user)
        .eq('id', editingUser.id);
      if (error) {
        console.error('Error updating user:', error);
      } else {
        console.log('User updated successfully:', data);
        setEditingUser(null);
      }
    } else {
      const { data, error } = await supabase.from('users').insert([user]);
      if (error) {
        console.error('Error adding user:', error);
      } else {
        console.log('User added successfully:', data);
      }
    }
    setUser({
      full_name: '',
      username: '',
      email: '',
      mobile_number: '',
      role: 'requester',
    });
    fetchUsers();
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUser(user);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Error deleting user:', error);
    } else {
      console.log('User deleted successfully');
      fetchUsers();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={user.full_name}
          onChange={(e) => setUser({ ...user, full_name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={user.username}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Mobile Number"
          value={user.mobile_number}
          onChange={(e) => setUser({ ...user, mobile_number: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <select
          value={user.role}
          onChange={(e) => setUser({ ...user, role: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="admin">Admin</option>
          <option value="requester">Requester</option>
          <option value="approver">Approver</option>
        </select>
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          {editingUser ? 'Update User' : 'Add User'}
        </button>
      </form>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">User List</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Full Name</th>
              <th className="p-2 border">Username</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border">
                <td className="p-2 border">{user.full_name}</td>
                <td className="p-2 border">{user.username}</td>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">{user.role}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementForm;
