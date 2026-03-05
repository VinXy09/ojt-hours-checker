import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import WeeklyReportPrint from './pages/WeeklyReportPrint';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to={user.role === 'student' ? '/dashboard' : '/admin'} /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to={user.role === 'student' ? '/dashboard' : '/admin'} /> : <Register />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/weekly-report" 
        element={
          <PrivateRoute>
            <WeeklyReportPrint />
          </PrivateRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
