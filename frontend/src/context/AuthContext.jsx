import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // If no token, skip auth check
    if (!token) {
      setLoading(false);
      return;
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    authAPI.getCurrentUser()
      .then(res => {
        clearTimeout(timeoutId);
        const userData = res.data?.data || res.data || res;
        setUser(userData);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.warn('Auth check failed (expected if API not configured):', err.message || err);
        // Clear invalid token
        localStorage.removeItem('token');
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
      
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      const token = res.data?.token || res.token;
      const userData = res.data?.data?.user || res.data?.user || res.user;
      const studentProfile = res.data?.data?.studentProfile || res.data?.studentProfile || res.studentProfile;
      
      localStorage.setItem('token', token);
      setUser({ ...userData, studentProfile });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      const token = res.data?.token || res.token;
      const newUser = res.data?.data?.user || res.data?.user || res.user;
      
      localStorage.setItem('token', token);
      setUser({ ...newUser });
      return res.data || res;
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
