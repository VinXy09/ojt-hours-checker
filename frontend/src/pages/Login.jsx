
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isLocked) {
      setIsLocked(false);
      setError('');
    }
  }, [countdown, isLocked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isLocked) {
      return;
    }

    try {
      const data = await login(email, password);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      
      if (status === 429 && data?.locked) {
        setIsLocked(true);
        setCountdown(data.remainingSeconds);
        setError(data.message);
      } else {
        setError(data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>OJT Hours</h2>
        <p>Sign in to your account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLocked}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLocked}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLocked}>
            {isLocked ? `Wait ${countdown}s` : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

