import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, REQUEST_STATUS, REQUEST_TYPES, INTEREST_STATUS } from '../lib/supabase';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [interests, setInterests] = useState([]);
  const [impactData, setImpactData] = useState([]);
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
      
      // Load all verified schools for donors to browse
      try {
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select(`
            *,
            requests!inner (
              id,
              title,
              type,
              status,
              amount_estimate,
              created_at
            )
          `)
          .eq('verified', true)
          .order('created_at', { ascending: false });

        if (schoolsError) {
          if (schoolsError.message.includes('relation') && schoolsError.message.includes('does not exist')) {
            setError('Database tables not set up yet. Please set up the database to view schools.');
            setRequests([]);
            setInterests([]);
            return;
          }
          throw schoolsError;
        }

        // Also load all verified schools (even without requests) for direct sponsorship
        const { data: allSchoolsData, error: allSchoolsError } = await supabase
          .from('schools')
          .select('*')
          .eq('verified', true)
          .order('created_at', { ascending: false });

        if (allSchoolsError) throw allSchoolsError;

        setRequests(allSchoolsData || []);



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

        setInterests(interestsData || []);

        // Load impact data (committed donations with progress updates)
        const { data: impactUpdates, error: impactError } = await supabase
          .from('interests')
          .select(`
            *,
            schools (
              name,
              udise_id,
              location
            ),
            impact_updates (
              id,
              title,
              description,
              progress_photos,
              student_reports,
              created_at,
              update_type
            )
          `)
          .eq('donor_id', user.id)
          .eq('status', 'committed')
          .order('created_at', { ascending: false });

        if (impactError) {
          console.warn('Impact data loading failed:', impactError);
          setImpactData([]);
        } else {
          setImpactData(impactUpdates || []);
        }
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

  const loadSchoolStudents = async (schoolId) => {
    try {
      console.log('Loading students for school ID:', schoolId);
      
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

      if (studentsError) {
        console.error('Students query error:', studentsError);
        throw studentsError;
      }
      
      console.log('Students loaded:', studentsData);
      setRequestStudents(studentsData || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err.message);
    }
  };

  const handleViewSchool = async (school) => {
    console.log('Viewing school:', school);
    setSelectedRequest(school);
    await loadSchoolStudents(school.id);
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

  const filteredSchools = requests.filter(school => {
    if (filters.region && !school.region?.toLowerCase().includes(filters.region.toLowerCase())) return false;
    if (filters.type && filters.type === 'category' && school.category !== filters.category) return false;
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Verified Schools</dt>
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
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Donations</dt>
                    <dd className="text-lg font-medium text-gray-900">{impactData.length}</dd>
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
                Verified Schools
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
              <button
                onClick={() => setActiveTab('impact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'impact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Impact Dashboard
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Filter Schools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Region</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter region (e.g., pune, mumbai)"
                        value={filters.region}
                        onChange={(e) => setFilters({...filters, region: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value, type: e.target.value ? 'category' : ''})}
                      >
                        <option value="">All Categories</option>
                        <option value="rural">Rural</option>
                        <option value="tribal">Tribal</option>
                        <option value="urban">Urban</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Schools List */}
                {filteredSchools.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchools.map((school) => (
                      <div key={school.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                ✓ Verified
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <p><strong>UDISE ID:</strong> {school.udise_id}</p>
                              <p><strong>Location:</strong> {school.location}</p>
                              <p><strong>Region:</strong> {school.region}</p>
                              <p><strong>Category:</strong> <span className="capitalize">{school.category}</span></p>
                              <p><strong>Registered:</strong> {new Date(school.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <button
                            onClick={() => handleViewSchool(school)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition duration-200"
                          >
                            View Students & Sponsor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No schools match your current filters.</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria.</p>
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

            {/* Impact Dashboard Tab */}
            {activeTab === 'impact' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Impact Dashboard</h3>
                <p className="text-gray-600 mb-6">
                  Track the progress of your donations and see the real impact you're making in students' lives.
                </p>
                
                {impactData.length > 0 ? (
                  <div className="space-y-8">
                    {impactData.map((donation) => (
                      <ImpactCard key={donation.id} donation={donation} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">📊</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Impact Data Yet</h4>
                    <p className="text-gray-600 mb-4">
                      Once you commit to donations and schools start uploading progress updates, 
                      you'll see the impact of your contributions here.
                    </p>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                    >
                      Browse Schools to Support
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* School Details Modal */}
        {selectedRequest && (
          <SchoolDetailsModal 
            school={selectedRequest}
            students={requestStudents}
            onClose={() => {
              setSelectedRequest(null);
              setRequestStudents([]);
            }}
            onSponsor={handleAcceptRequest}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

// Impact Card Component
const ImpactCard = ({ donation }) => {
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const updates = donation.impact_updates || [];
  const displayedUpdates = showAllUpdates ? updates : updates.slice(0, 2);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUpdateTypeIcon = (type) => {
    switch (type) {
      case 'infrastructure': return '🏗️';
      case 'student_progress': return '📚';
      case 'completion': return '✅';
      default: return '📋';
    }
  };

  const getUpdateTypeColor = (type) => {
    switch (type) {
      case 'infrastructure': return 'bg-orange-100 text-orange-800';
      case 'student_progress': return 'bg-blue-100 text-blue-800';
      case 'completion': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{donation.schools?.name}</h4>
            <p className="text-sm text-gray-600">UDISE ID: {donation.schools?.udise_id}</p>
            <p className="text-sm text-gray-600">{donation.schools?.location}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ₹{donation.commitment_amount?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              Committed on {formatDate(donation.commitment_date || donation.created_at)}
            </div>
          </div>
        </div>
        
        {donation.message && (
          <div className="mt-3 p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-700 italic">"{donation.message}"</p>
          </div>
        )}
      </div>

      {/* Progress Updates */}
      <div className="p-6">
        {updates.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-lg font-medium text-gray-900">
                Progress Updates ({updates.length})
              </h5>
              {updates.length > 2 && (
                <button
                  onClick={() => setShowAllUpdates(!showAllUpdates)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showAllUpdates ? 'Show Less' : 'Show All Updates'}
                </button>
              )}
            </div>

            <div className="space-y-6">
              {displayedUpdates.map((update) => (
                <div key={update.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getUpdateTypeIcon(update.update_type)}</span>
                    <h6 className="font-medium text-gray-900">{update.title}</h6>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUpdateTypeColor(update.update_type)}`}>
                      {update.update_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{update.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Updated on {formatDate(update.created_at)}
                  </div>

                  {/* Progress Photos */}
                  {update.progress_photos && update.progress_photos.length > 0 && (
                    <div className="mb-4">
                      <h7 className="text-sm font-medium text-gray-700 mb-2 block">Progress Photos:</h7>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {update.progress_photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Progress ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(photo, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student Reports */}
                  {update.student_reports && update.student_reports.length > 0 && (
                    <div>
                      <h7 className="text-sm font-medium text-gray-700 mb-2 block">Student Reports:</h7>
                      <div className="space-y-2">
                        {update.student_reports.map((report, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">
                                {report.student_name || `Report ${index + 1}`}
                              </span>
                              {report.grade && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Grade: {report.grade}
                                </span>
                              )}
                            </div>
                            <a
                              href={report.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Report
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-3">⏳</div>
            <h6 className="font-medium text-gray-900 mb-2">Waiting for Updates</h6>
            <p className="text-sm text-gray-600">
              The school will upload progress photos and student reports here. 
              You'll be notified when new updates are available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// School Details Modal Component
const SchoolDetailsModal = ({ school, students, onClose, onSponsor, user }) => {
  const [commitmentAmount, setCommitmentAmount] = useState('');
  const [commitmentMessage, setCommitmentMessage] = useState('');
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const handleCommit = async () => {
    if (commitmentAmount && commitmentAmount > 0 && selectedStudents.length > 0) {
      try {
        // Create a scholarship offer for the school
        const { error } = await supabase
          .from('interests')
          .insert([{
            donor_id: user.id,
            school_id: school.id,
            message: commitmentMessage || `I would like to sponsor ${selectedStudents.length} students with ₹${commitmentAmount}`,
            status: 'committed',
            commitment_amount: parseFloat(commitmentAmount),
            student_ids: selectedStudents
          }]);

        if (error) throw error;
        
        onClose();
        alert('Scholarship offer sent successfully!');
      } catch (err) {
        console.error('Error creating scholarship offer:', err);
        alert('Error sending offer: ' + err.message);
      }
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{school.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* School Details */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">School Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="font-medium text-gray-700">School Name:</span>
                <p className="text-gray-600 mt-1">{school.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">UDISE ID:</span>
                <p className="text-gray-600">{school.udise_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">{school.location}, {school.region}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <p className="text-gray-600 capitalize">{school.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Registered:</span>
                <p className="text-gray-600">{new Date(school.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  ✓ Verified
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
                    <div 
                      key={student.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedStudents.includes(student.id)
                          ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <h5 className="font-medium text-gray-900">{student.student_name}</h5>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">ID: {student.student_id}</p>
                          <p className="text-sm text-gray-600 ml-6">Class: {student.class_grade}</p>
                          {student.father_name && (
                            <p className="text-sm text-gray-600 ml-6">Father: {student.father_name}</p>
                          )}
                          {student.category && (
                            <p className="text-sm text-gray-600 ml-6">Category: {student.category.toUpperCase()}</p>
                          )}
                          {student.scholarship_amount && (
                            <p className="text-sm font-medium text-green-600 ml-6">
                              Suggested: ₹{student.scholarship_amount.toLocaleString()}
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
                  <p>No verified students found for this school.</p>
                  <p className="text-sm mt-2">Students need to be verified by admin first.</p>
                </div>
              )}
            </div>
            
            {selectedStudents.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected for sponsorship
                </p>
              </div>
            )}
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
              <button
                onClick={() => setShowCommitForm(true)}
                disabled={students.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium"
              >
                Sponsor Students
              </button>
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-lg">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Create Scholarship Offer</h5>
              
              {selectedStudents.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-sm text-yellow-800">Please select at least one student to sponsor.</p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Scholarship Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={commitmentAmount}
                    onChange={(e) => setCommitmentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter total amount for selected students"
                    min="1"
                  />
                  {selectedStudents.length > 0 && commitmentAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ ₹{Math.round(commitmentAmount / selectedStudents.length).toLocaleString()} per student
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message to School (Optional)
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
                  disabled={!commitmentAmount || commitmentAmount <= 0 || selectedStudents.length === 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md font-medium"
                >
                  Send Scholarship Offer
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