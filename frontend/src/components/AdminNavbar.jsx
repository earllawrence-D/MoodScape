import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.role !== 'admin') return null; // Render only for admins

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/admin/users" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MoodScape</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <NavLink to="/admin/users" label="Users" />
            <NavLink to="/admin/feedback" label="Feedback" />
            <NavLink to="/admin/profile" label="Profile" />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-gray-100 text-primary-600'
          : 'text-gray-600 hover:bg-gray-100 hover:text-primary-600'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export default AdminNavbar;
