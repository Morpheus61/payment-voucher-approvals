import AdminDashboard from '@/components/AdminDashboard'
import { supabaseAdmin } from '@/utils/supabaseAdmin'

const PROTECTED_USERS = [
  'compliance@foodstream.in',
  'motty.philip@gmail.com',
  'relishfoodsalpy@gmail.com'
];

const UserTable = ({ users, deleteUser }) => (
  <table className="table">
    <thead>
      <tr>
        <th>Email</th>
        <th>Role</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
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

export default function AdminPage() {
  const deleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user?')) return;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      alert('Deletion failed: ' + error.message);
    } else {
      await supabaseAdmin.from('users').delete().eq('id', userId);
      refreshUsers();
    }
  };

  const [users, setUsers] = React.useState([]);

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

  const refreshUsers = async () => {
    const { data, error } = await supabaseAdmin.from('users').select('id, email, role');
    if (error) {
      alert('Failed to refresh users: ' + error.message);
    } else {
      setUsers(data);
    }
  };

  return (
    <main className="min-h-screen p-4">
      <AdminDashboard>
        <UserTable users={users} deleteUser={deleteUser} />
      </AdminDashboard>
    </main>
  )
}
