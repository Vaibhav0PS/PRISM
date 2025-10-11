import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { isAuthenticated, user, loading, error } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Auth Debug</h4>
      <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
      <p><strong>Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
      <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
      <p><strong>Error:</strong> {error || 'none'}</p>
      <p><strong>Token:</strong> {localStorage.getItem('token') ? 'exists' : 'none'}</p>
    </div>
  );
};

export default AuthDebug;