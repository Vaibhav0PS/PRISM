import React, { useState } from 'react';
import axios from 'axios';

// Create the same axios instance as AuthContext
const authAPI = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const ApiTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing API connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:5000/api/health', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);
      setResult(`Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API Test Error:', error);
      if (error.name === 'AbortError') {
        setResult('Error: Request timeout (5 seconds)');
      } else {
        setResult(`Error: ${error.message}\nType: ${error.name}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test${Date.now()}@frontend.com`,
          password: 'password123',
          role: 'donor'
        })
      });
      const data = await response.json();
      setResult(`Response Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error.message}\nStack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'school@demo.com',
          password: 'password123'
        })
      });
      const data = await response.json();
      setResult(`Login Response Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Login Error: ${error.message}\nStack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing AuthAPI instance...');
      const response = await authAPI.post('/auth/login', {
        email: 'school@demo.com',
        password: 'password123'
      });
      console.log('AuthAPI Response:', response);
      setResult(`AuthAPI Success!\nStatus: ${response.status}\n\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.error('AuthAPI Error:', error);
      setResult(`AuthAPI Error: ${error.message}\nCode: ${error.code}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>API Test Component</h3>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={testAPI} disabled={loading}>
          Test Health API
        </button>
        <button onClick={testRegistration} disabled={loading} style={{ marginLeft: '10px' }}>
          Test Registration API
        </button>
        <button onClick={testLogin} disabled={loading} style={{ marginLeft: '10px' }}>
          Test Login API
        </button>
        <button onClick={testAuthAPI} disabled={loading} style={{ marginLeft: '10px' }}>
          Test AuthAPI Instance
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {result && (
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {result}
        </pre>
      )}
    </div>
  );
};

export default ApiTest;