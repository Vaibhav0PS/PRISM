import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, REQUEST_STATUS, REQUEST_TYPES, INTEREST_STATUS } from '../lib/supabase';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    region: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load verified and listed requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select(`
          *,
          schools (
            name,
            udise_id,
            location,
            region,
            category,
            verified
          )
        `)
        .in('status', [REQUEST_STATUS.APPROVED, REQUEST_STATUS.LISTED])
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Load user's interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select(`
          *,
          requests (
            title,
            type,
            amount_estimate,
            schools (
              name,
              location
            )
          )
        `)
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false });

      if (interestsError) throw interestsError;

      setRequests(requestsData || []);
      setInterests(interestsData || []);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowInterest = async (requestId, message = '') => {
    try {
      const { error } = await supabase
        .from('interests')
        .insert([{
          donor_id: user.id,
          request_id: requestId,
          message: message || 'I am interested in supporting this request.',
          status: INTEREST_STATUS.INTERESTED
        }]);

      if (error) throw error;

      // Reload interests
      loadDashboardData();

    } catch (err) {
      console.error('Error showing interest:', err);
      setError(err.message);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filters.type && request.type !== filters.type) return false;
    if (filters.region && !request.schools?.region?.toLowerCase().includes(filters.region.toLowerCase())) return false;
    if (filters.minAmount && request.amount_estimate < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && request.amount_estimate > parseFloat(filters.maxAmount)) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      [REQUEST_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [REQUEST_STATUS.LISTED]: 'bg-purple-100 text-purple-800',
      [REQUEST_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getInterestStatusBadge = (status) => {
    const badges = {
      [INTEREST_STATUS.INTERESTED]: 'bg-blue-100 text-blue-800',
      [INTEREST_STATUS.CONTACTED]: 'bg-yellow-100 text-yellow-800',
      [INTEREST_STATUS.COMMITTED]: 'bg-green-100 text-green-800',
      [INTEREST_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const hasUserInterest = (requestId) => {
    return interests.some(interest => interest.request_id === requestId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donor dashboard...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.name}! Browse verified requests and track your impact.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Available Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{requests.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Your Interests</dt>
                    <dd className="text-lg font-medium text-gray-900">{interests.length}</dd>
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
                    <span className="text-white text-sm font-bold">🎯</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Impact Score</dt>
                    <dd className="text-lg font-medium text-gray-900">{interests.length * 10}</dd>
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
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available Requests
              </button>
              <button
                onClick={() => setActiveTab('interests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'interests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Interests
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Filter Requests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                      >
                        <option value="">All Types</option>
                        <option value={REQUEST_TYPES.SCHOLARSHIP}>Scholarship</option>
                        <option value={REQUEST_TYPES.INFRASTRUCTURE}>Infrastructure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Region</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter region"
                        value={filters.region}
                        onChange={(e) => setFilters({...filters, region: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Amount (₹)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="0"
                        value={filters.minAmount}
                        onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Amount (₹)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="No limit"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Requests List */}
                {filteredRequests.length > 0 ? (
                  <div className="space-y-6">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                                {request.status}
                              </span>
                              {request.schools?.verified && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Verified School
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">{request.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                              <div>
                                <p><strong>School:</strong> {request.schools?.name}</p>
                                <p><strong>UDISE ID:</strong> {request.schools?.udise_id}</p>
                                <p><strong>Location:</strong> {request.schools?.location}</p>
                                <p><strong>Region:</strong> {request.schools?.region}</p>
                              </div>
                              <div>
                                <p><strong>Type:</strong> {request.type}</p>
                                <p><strong>Category:</strong> {request.schools?.category}</p>
                                <p><strong>Amount:</strong> ₹{request.amount_estimate?.toLocaleString()}</p>
                                <p><strong>Created:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          {hasUserInterest(request.id) ? (
                            <span className="inline-flex items-center px-3 py-2 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50">
                              ✓ Interest Shown
                            </span>
                          ) : (
                            <button
                              onClick={() => handleShowInterest(request.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                            >
                              Show Interest
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No requests match your current filters.</p>
                  </div>
                )}
              </div>
            )}

            {/* Interests Tab */}
            {activeTab === 'interests' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Interests</h3>
                {interests.length > 0 ? (
                  <div className="space-y-4">
                    {interests.map((interest) => (
                      <div key={interest.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-md font-medium text-gray-900">{interest.requests?.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{interest.message}</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-500">
                              <p>School: {interest.requests?.schools?.name}</p>
                              <p>Location: {interest.requests?.schools?.location}</p>
                              <p>Type: {interest.requests?.type}</p>
                              <p>Amount: ₹{interest.requests?.amount_estimate?.toLocaleString()}</p>
                              <p>Interest shown: {new Date(interest.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInterestStatusBadge(interest.status)}`}>
                            {interest.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't shown interest in any requests yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Browse available requests to get started.</p>
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

export default DonorDashboard;