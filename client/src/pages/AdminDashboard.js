import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, REQUEST_STATUS } from '../lib/supabase';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [schools, setSchools] = useState([]);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]); // eslint-disable-line no-unused-vars
  const [stats, setStats] = useState({
    totalSchools: 0,
    verifiedSchools: 0,
    pendingRequests: 0,
    totalRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load schools
      try {
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select('*')
          .order('created_at', { ascending: false });

        if (schoolsError) {
          if (schoolsError.message.includes('relation') && schoolsError.message.includes('does not exist')) {
            setError('Database tables not set up yet. Admin features require database setup.');
            setSchools([]);
            setRequests([]);
            setStats({ totalSchools: 0, verifiedSchools: 0, pendingRequests: 0, totalRequests: 0 });
            return;
          }
          throw schoolsError;
        }

        // Load requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select(`
            *,
            schools (
              name,
              udise_id,
              location
            )
          `)
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        setSchools(schoolsData || []);
        setRequests(requestsData || []);

        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            *,
            schools (
              name,
              udise_id
            )
          `)
          .order('created_at', { ascending: false });

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Calculate stats
        const totalSchools = schoolsData?.length || 0;
        const verifiedSchools = schoolsData?.filter(s => s.verified).length || 0;
        const totalRequests = requestsData?.length || 0;
        const pendingRequests = requestsData?.filter(r => r.status === REQUEST_STATUS.PENDING).length || 0;

        setStats({
          totalSchools,
          verifiedSchools,
          totalRequests,
          pendingRequests
        });

      } catch (dbError) {
        console.warn('Database error - running in auth-only mode:', dbError.message);
        setSchools([]);
        setRequests([]);
        setStats({ totalSchools: 0, verifiedSchools: 0, pendingRequests: 0, totalRequests: 0 });
        setError('Database not set up yet. Authentication works, but admin features require database setup.');
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolVerification = async (schoolId, verified) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ verified })
        .eq('id', schoolId);

      if (error) throw error;

      // Update local state
      setSchools(schools.map(school =>
        school.id === schoolId ? { ...school, verified } : school
      ));

    } catch (err) {
      console.error('Error updating school verification:', err);
      setError(err.message);
    }
  };

  const handleRequestStatusUpdate = async (requestId, status) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(request =>
        request.id === requestId ? { ...request, status } : request
      ));

    } catch (err) {
      console.error('Error updating request status:', err);
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      [REQUEST_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [REQUEST_STATUS.VERIFIED]: 'bg-blue-100 text-blue-800',
      [REQUEST_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [REQUEST_STATUS.LISTED]: 'bg-purple-100 text-purple-800',
      [REQUEST_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800'
    };

    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.name}! Manage platform verification and monitoring.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🏫</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Schools</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalSchools}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Verified Schools</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.verifiedSchools}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalRequests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendingRequests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('schools')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'schools'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                School Verification
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Funding Requests
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Request Management
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Schools Tab */}
            {activeTab === 'schools' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">School Verification</h3>
                {schools.length > 0 ? (
                  <div className="space-y-4">
                    {schools.map((school) => (
                      <div key={school.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-md font-medium text-gray-900">{school.name}</h4>
                            <p className="text-sm text-gray-600">UDISE ID: {school.udise_id}</p>
                            <p className="text-sm text-gray-600">{school.location}, {school.region}</p>
                            <p className="text-sm text-gray-500">Category: {school.category}</p>
                            <p className="text-sm text-gray-500">
                              Registered: {new Date(school.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${school.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {school.verified ? 'Verified' : 'Pending'}
                            </span>
                            {!school.verified && (
                              <button
                                onClick={() => handleSchoolVerification(school.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Verify
                              </button>
                            )}
                            {school.verified && (
                              <button
                                onClick={() => handleSchoolVerification(school.id, false)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No schools registered yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Request Management</h3>
                {requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-md font-medium text-gray-900">{request.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-500">
                                School: {request.schools?.name} (UDISE: {request.schools?.udise_id})
                              </p>
                              <p className="text-sm text-gray-500">
                                Type: {request.type} | Amount: ₹{request.amount_estimate?.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                Created: {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                              {request.status}
                            </span>
                            {request.status === REQUEST_STATUS.PENDING && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleRequestStatusUpdate(request.id, REQUEST_STATUS.VERIFIED)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleRequestStatusUpdate(request.id, REQUEST_STATUS.APPROVED)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Approve
                                </button>
                              </div>
                            )}
                            {request.status === REQUEST_STATUS.VERIFIED && (
                              <button
                                onClick={() => handleRequestStatusUpdate(request.id, REQUEST_STATUS.APPROVED)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                              >
                                Approve
                              </button>
                            )}
                            {request.status === REQUEST_STATUS.APPROVED && (
                              <button
                                onClick={() => handleRequestStatusUpdate(request.id, REQUEST_STATUS.LISTED)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                              >
                                List
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No requests submitted yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;