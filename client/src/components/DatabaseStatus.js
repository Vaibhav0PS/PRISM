import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DatabaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState('');

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      // Check if users table exists
      const { error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        if (error.message.includes('relation "public.users" does not exist')) {
          setStatus('missing');
          setDetails('Database tables not created yet. Run the SQL schema first.');
        } else {
          setStatus('error');
          setDetails(error.message);
        }
      } else {
        setStatus('ready');
        setDetails('Database is set up correctly!');
      }
    } catch (err) {
      setStatus('error');
      setDetails(err.message);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready': return 'bg-green-50 border-green-200 text-green-700';
      case 'missing': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready': return '✅';
      case 'missing': return '⚠️';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div>
          <div className="font-medium">
            Database Status: {status === 'checking' ? 'Checking...' : status.toUpperCase()}
          </div>
          <div className="text-sm mt-1">{details}</div>
          {status === 'missing' && (
            <div className="text-sm mt-2">
              <strong>Next step:</strong> Go to Supabase Dashboard → SQL Editor → Run database-schema-fixed.sql
            </div>
          )}
        </div>
      </div>
      <button
        onClick={checkDatabase}
        className="mt-2 text-sm underline hover:no-underline"
      >
        Recheck Database
      </button>
    </div>
  );
};

export default DatabaseStatus;