import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, REQUEST_STATUS, REQUEST_TYPES, INTEREST_STATUS } from '../lib/supabase';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [interests, setInterests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestStudents, setRequestStudents] = useState([]);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load approved and listed requests (admin verified)
      try {
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

        if (requestsError) {
          if (requestsError.message.includes('relation') && requestsError.message.includes('does not exist')) {
            setError('Database tables not set up yet. Please set up the database to view funding requests.');
            setRequests([]);
            setInterests([]);
            return;
          }
          throw requestsError;
        }

        setRequests(requestsData || []);

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
      } catch (dbError) {
        console.warn('Database error - running in auth-only mode:', dbError.message);
        setRequests([]);
        setInterests([]);
        setError('Database not set up yet. Authentication works, but donor features require database setup.');
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRequestStudents = async (requestId, schoolId) => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          schools (
            name,
            udise_id
          )
        `)
        .eq('school_id', schoolId)
        .eq('scholarship_eligible', true)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      
      setRequestStudents(studentsData || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err.message);
    }
  };

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    if (request.schools?.id) {
      await loadRequestStudents(request.id, request.schools.id);
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

  const handleAcceptRequest = async (requestId, commitmentAmount, message = '') => {
    try {
      // Update or create interest with committed status
      const { error: interestError } = await supabase
        .from('interests')
        .upsert([{
          donor_id: user.id,
          request_id: requestId,
          message: message || 'I am committed to supporting this request.',
          status: INTEREST_STATUS.COMMITTED,
          commitment_amount: commitmentAmount
        }], {
          onConflict: 'donor_id,request_id'
        });

      if (interestError) throw interestError;

      // Optionally update request status to show it has committed funding
      const { error: requestError } = await supabase
        .from('requests')
        .update({ 
          status: REQUEST_STATUS.COMPLETED,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Reload data
      loadDashboardData();
      setSelectedRequest(null);

    } catch (err) {
      console.error('Error accepting request:', err);
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Database Setup Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{error}</p>
                  <p className="mt-2">
                    Your account is working perfectly! To view and support funding requests, 
                    the database tables need to be set up first.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      loadDashboardData();
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
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
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                          >
                            View Details & Students
                          </button>
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

        {/* Request Details Modal */}
        {selectedRequest && (
          <RequestDetailsModal 
            request={selectedRequest}
            students={requestStudents}
            onClose={() => {
              setSelectedRequest(null);
              setRequestStudents([]);
            }}
            onAccept={handleAcceptRequest}
            hasInterest={hasUserInterest(selectedRequest.id)}
          />
        )}
      </div>
    </div>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({ request, students, onClose, onAccept, hasInterest }) => {
  const [commitmentAmount, setCommitmentAmount] = useState(request.amount_estimate || '');
  const [commitmentMessage, setCommitmentMessage] = useState('');
  const [showCommitForm, setShowCommitForm] = useState(false);

  const handleCommit = () => {
    if (commitmentAmount && commitmentAmount > 0) {
      onAccept(request.id, parseFloat(commitmentAmount), commitmentMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{request.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Request Details */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Request Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-600 mt-1">{request.description}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">School:</span>
                <p className="text-gray-600">{request.schools?.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">UDISE ID:</span>
                <p className="text-gray-600">{request.schools?.udise_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">{request.schools?.location}, {request.schools?.region}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-600 capitalize">{request.type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Estimated Amount:</span>
                <p className="text-gray-600 text-lg font-semibold">₹{request.amount_estimate?.toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {request.status}
                </span>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">
              Eligible Students ({students.length})
            </h4>
            <div className="max-h-96 overflow-y-auto">
              {students.length > 0 ? (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{student.student_name}</h5>
                          <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                          <p className="text-sm text-gray-600">Class: {student.class_grade}</p>
                          {student.father_name && (
                            <p className="text-sm text-gray-600">Father: {student.father_name}</p>
                          )}
                          {student.category && (
                            <p className="text-sm text-gray-600">Category: {student.category.toUpperCase()}</p>
                          )}
                          {student.scholarship_amount && (
                            <p className="text-sm font-medium text-green-600">
                              Scholarship: ₹{student.scholarship_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {student.documents_url && student.documents_url.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {student.documents_url.length} docs
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No docs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No verified students found for this request.</p>
                  <p className="text-sm mt-2">Students need to be verified by admin first.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          {!showCommitForm ? (
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {hasInterest ? (
                <button
                  onClick={() => setShowCommitForm(true)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  Commit to Fund
                </button>
              ) : (
                <button
                  onClick={() => setShowCommitForm(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  Accept & Fund Request
                </button>
              )}
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-lg">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Commit to Funding</h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={commitmentAmount}
                    onChange={(e) => setCommitmentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter amount"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={commitmentMessage}
                    onChange={(e) => setCommitmentMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Add a message for the school..."
                    rows="2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCommitForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!commitmentAmount || commitmentAmount <= 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md font-medium"
                >
                  Confirm Commitment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;