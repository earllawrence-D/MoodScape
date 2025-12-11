import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import MoodJournal from './pages/MoodJournal';
import AIChat from './pages/AIChat';
import Community from './pages/Community';
import Profile from './pages/Profile';
import AdminProfile from './pages/AdminProfile';
import AdminUsers from './pages/AdminUsers';
import AdminFeedback from './pages/AdminFeedback';

// ------------------------------
// Redirect based on role
// ------------------------------
function DefaultRedirect() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return user.role === 'admin' ? (
    <Navigate to="/admin/users" replace />
  ) : (
    <Navigate to="/chat" replace />
  );
}

// ------------------------------
// App Component
// ------------------------------
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Client Protected Routes */}
          <Route
            path="/journal"
            element={
              <ProtectedRoute roles={['client']}>
                <MoodJournal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute roles={['client']}>
                <AIChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute roles={['client']}>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['client']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminFeedback />
              </ProtectedRoute>
            }
          />

          {/* Default & Fallback */}
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
