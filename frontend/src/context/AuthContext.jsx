// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

// Create context
export const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data.data;

      if (!user || !token) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return user;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;

      if (!user || !token) {
        throw new Error('Invalid register response');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return user;
    } catch (err) {
      console.error('Register failed:', err);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Provide state and functions to children
  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-teal-600 font-bold text-xl">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
