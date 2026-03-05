import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser()
        .then(res => {
          setUser(res.data || res);
        })
        .catch((err) => {
          console.error('Auth error:', err);
          localStorage.removeItem('token');
          setError(err.message || 'Authentication failed');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.token || res.token);
      setUser({ ...res.data.user, studentProfile: res.data.studentProfile });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      localStorage.setItem('token', res.data.token || res.token);
      let studentProfile = null;
      if (userData.role === 'student') {
        try {
          const profileRes = await authAPI.getCurrentUser();
          studentProfile = profileRes.data?.studentProfile || profileRes.studentProfile;
        } catch (err) {
          console.error('Error fetching student profile:', err);
        }
      }
      setUser({ ...res.data.user, studentProfile });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
