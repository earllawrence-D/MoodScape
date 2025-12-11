import { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => setError(err.response?.data?.message || err.message || 'Failed to fetch users'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#d5f8f0]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-teal-400 pb-2">
          Registered Users
        </h1>

        {loading && <div className="text-gray-700">Loading users...</div>}
        {error && <div className="text-red-600 font-medium">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto bg-white border-2 border-teal-300 shadow-md rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-teal-100">
                <tr>
                  {['ID', 'Username', 'Email', 'Role'].map(header => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u, idx) => (
                  <tr key={u.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-6 py-4 whitespace-nowrap">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
