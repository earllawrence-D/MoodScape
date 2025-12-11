import { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getFeedback()
      .then(res => setFeedbacks(res.data))
      .catch(err => setError(err.response?.data?.message || err.message || 'Failed to fetch feedback'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#d5f8f0]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-teal-400 pb-2">
          User Feedback
        </h1>

        {loading && <div className="text-gray-700">Loading feedback...</div>}
        {error && <div className="text-red-600 font-medium">{error}</div>}
        {!loading && !error && feedbacks.length === 0 && (
          <div className="text-gray-700">No feedback available.</div>
        )}

        {!loading && !error && feedbacks.length > 0 && (
          <div className="overflow-x-auto bg-white border-2 border-teal-300 shadow-md rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-teal-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedbacks.map((f, idx) => (
                  <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-6 py-4 whitespace-normal">{f.message}</td>
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
