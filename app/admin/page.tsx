import React from 'react';
import DashboardLayout from '@/components/AdminDashboard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

interface User {
  id: string;
  email: string;
  role: string;
}

interface UserTableProps {
  users: User[];
  deleteUser: (userId: string) => void;
}

interface AdminDashboardProps {
  children: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const PROTECTED_USERS = [
  'compliance@foodstream.in',
  'motty.philip@gmail.com',
  'relishfoodsalpy@gmail.com'
];

const UserTable = ({ users, deleteUser }: UserTableProps) => (
  <table className="table">
    <thead>
      <tr>
        <th>Email</th>
        <th>Role</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user: User) => (
        <tr key={user.id}>
          <td>{user.email}</td>
          <td>{user.role}</td>
          <td>
            {!PROTECTED_USERS.includes(user.email) && (
              <button 
                onClick={() => deleteUser(user.id)}
                className="btn btn-error"
              >
                Delete
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const AdminDashboardComponent = ({ children }: AdminDashboardProps) => (
  <div className="admin-dashboard">
    <h1>User Management</h1>
    {children}
  </div>
);

export default function AdminPage() {
  const deleteUser = async (userId: string): Promise<void> => {
    if (!confirm('Permanently delete this user?')) return;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      alert('Deletion failed: ' + error.message);
    } else {
      await supabaseAdmin.from('users').delete().eq('id', userId);
      refreshUsers();
    }
  };

  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabaseAdmin.from('users').select('id, email, role');
      if (error) {
        alert('Failed to fetch users: ' + error.message);
      } else {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  const refreshUsers = async (): Promise<void> => {
    const { data, error } = await supabaseAdmin.from('users').select('id, email, role');
    if (error) {
      alert('Failed to refresh users: ' + error.message);
    } else {
      setUsers(data);
    }
  };

  return (
    <DashboardLayout>
      <UserTable users={users} deleteUser={deleteUser} />
    </DashboardLayout>
  )
}
