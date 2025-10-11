import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        setResult(`Connection Error: ${error.message}`);
      } else {
        setResult('✅ Supabase connection successful!');
      }
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    try {
      // Test auth signup with a valid email format
      const testEmail = `test.user.${Date.now()}@gmail.com`;
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123'
      });
      
      if (error) {
        setResult(`Auth Error: ${error.message}`);
      } else {
        setResult(`✅ Auth test successful! User ID: ${data.user?.id}\nEmail: ${testEmail}`);
      }
    } catch (err) {
      setResult(`Auth Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTables = async () => {
    setLoading(true);
    try {
      // Check if tables exist
      const tables = ['users', 'schools', 'requests', 'interests', 'updates'];
      const results = [];
      
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1);
          if (error) {
            results.push(`❌ ${table}: ${error.message}`);
          } else {
            results.push(`✅ ${table}: OK`);
          }
        } catch (err) {
          results.push(`❌ ${table}: ${err.message}`);
        }
      }
      
      setResult(results.join('\n'));
    } catch (err) {
      setResult(`Error checking tables: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 m-4">
      <h3 className="text-lg font-bold mb-4">Supabase Connection Test</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Connection
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Auth
        </button>
        
        <button
          onClick={checkTables}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Check Tables
        </button>
      </div>
      
      {loading && <p className="text-blue-600">Testing...</p>}
      
      {result && (
        <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Supabase URL:</strong> {process.env.REACT_APP_SUPABASE_URL || 'Not set'}</p>
        <p><strong>Anon Key:</strong> {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  );
};

export default SupabaseTest;