import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, REQUEST_STATUS } from '../lib/supabase';
import StudentDataDebug from '../components/StudentDataDebug';

// Student Detail Card Component
const StudentDetailCard = ({ student, onVerificationUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerification = async (verified) => {
    try {
      setIsVerifying(true);
      
      const { error } = await supabase
        .from('students')
        .update({ 
          scholarship_eligible: verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) throw error;

      // Refresh the data
      onVerificationUpdate();
      
    } catch (err) {
      console.error('Error updating student verification:', err);
      alert('Error updating student verification: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentIcon = (docType) => {
    const icons = {
      'id_proof': '🆔',
      'income_certificate': '💰',
      'caste_certificate': '📋',
      'photo': '📷',
      'marksheet': '📊',
      'bank_passbook': '🏦',
      'other': '📄'
    };
    return icons[docType] || '📄';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h4 className="text-lg font-semibold text-gray-900">{student.student_name}</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                student.scholarship_eligible 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {student.scholarship_eligible ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Student ID:</span> {student.student_id}
              </div>
              <div>
                <span className="font-medium">Class:</span> {student.class_grade}
              </div>
              <div>
                <span className="font-medium">School:</span> {student.schools?.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Documents:</span> {student.documents_url?.length || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Personal Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Father's Name:</span>
                <p className="text-gray-600">{student.father_name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Mother's Name:</span>
                <p className="text-gray-600">{student.mother_name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date of Birth:</span>
                <p className="text-gray-600">{formatDate(student.date_of_birth)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Gender:</span>
                <p className="text-gray-600 capitalize">{student.gender || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <p className="text-gray-600 uppercase">{student.category || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-600">{student.phone_number || 'N/A'}</p>
              </div>
            </div>
            {student.address && (
              <div className="mt-3">
                <span className="font-medium text-gray-700">Address:</span>
                <p className="text-gray-600">{student.address}</p>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h5>
            {student.documents_url && student.documents_url.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {student.documents_url.map((docUrl, index) => {
                  const docType = student.document_types?.[index] || 'other';
                  const fileName = docUrl.split('/').pop() || `Document ${index + 1}`;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getDocumentIcon(docType)}</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {docType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate" title={fileName}>
                        {fileName}
                      </p>
                      <div className="flex space-x-2">
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          View
                        </a>
                        <a
                          href={docUrl}
                          download
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">No documents uploaded yet</p>
              </div>
            )}
          </div>

          {/* Scholarship Information */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Scholarship Status</h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Current Status:</span> 
                    <span className={`ml-2 ${student.scholarship_eligible ? 'text-green-600' : 'text-yellow-600'}`}>
                      {student.scholarship_eligible ? 'Verified & Eligible' : 'Pending Verification'}
                    </span>
                  </p>
                  {student.scholarship_amount && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Scholarship Amount:</span> ₹{student.scholarship_amount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Last Updated: {formatDate(student.updated_at)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!student.scholarship_eligible ? (
                    <button
                      onClick={() => handleVerification(true)}
                      disabled={isVerifying}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Student'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerification(false)}
                      disabled={isVerifying}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {isVerifying ? 'Updating...' : 'Revoke Verification'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visibility to Donors */}
          <div>
            <div className={`p-4 rounded-lg border-l-4 ${
              student.scholarship_eligible 
                ? 'bg-green-50 border-green-400' 
                : 'bg-yellow-50 border-yellow-400'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-lg">
                    {student.scholarship_eligible ? '✅' : '⏳'}
                  </span>
                </div>
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-gray-900">
                    Donor Visibility Status
                  </h6>
                  <p className="text-sm text-gray-700 mt-1">
                    {student.scholarship_eligible 
                      ? 'This student is verified and visible to donors for potential sponsorship.'
                      : 'This student is pending verification and not yet visible to donors.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [schools, setSchools] = useState([]);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentFilter, setStudentFilter] = useState('all'); // all, verified, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalSchools: 0,
    verifiedSchools: 0,
    pendingRequests: 0,
    totalRequests: 0,
    totalStudents: 0,
    verifiedStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter students based on search and filter criteria
  useEffect(() => {
    let filtered = students;

    // Apply verification filter
    if (studentFilter === 'verified') {
      filtered = filtered.filter(student => student.scholarship_eligible);
    } else if (studentFilter === 'pending') {
      filtered = filtered.filter(student => !student.scholarship_eligible);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.schools?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class_grade.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [students, studentFilter, searchTerm]);

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
        const totalStudents = studentsData?.length || 0;
        const verifiedStudents = studentsData?.filter(s => s.scholarship_eligible).length || 0;

        setStats({
          totalSchools,
          verifiedSchools,
          totalRequests,
          pendingRequests,
          totalStudents,
          verifiedStudents
        });

      } catch (dbError) {
        console.warn('Database error - running in auth-only mode:', dbError.message);
        setSchools([]);
        setRequests([]);
        setStudents([]);
        setStats({ totalSchools: 0, verifiedSchools: 0, pendingRequests: 0, totalRequests: 0, totalStudents: 0, verifiedStudents: 0 });
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
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

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Verified Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.verifiedStudents}</dd>
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
                Students
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'debug'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Debug Data
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

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Student Verification & Management</h3>
                  <div className="text-sm text-gray-500">
                    Showing {filteredStudents.length} of {students.length} students
                  </div>
                </div>

                {/* Verification Workflow Info */}
                {students.length > 0 && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-blue-600 text-lg">ℹ️</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Student Verification Workflow</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Review student details and documents → Verify eligible students → Verified students become visible to donors for sponsorship
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search and Filter Controls */}
                {students.length > 0 && (
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search students by name, ID, school, or class..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <select
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Students</option>
                        <option value="verified">Verified Only</option>
                        <option value="pending">Pending Verification</option>
                      </select>
                    </div>
                  </div>
                )}

                {students.length > 0 ? (
                  filteredStudents.length > 0 ? (
                    <div className="space-y-6">
                      {filteredStudents.map((student) => (
                        <StudentDetailCard 
                          key={student.id} 
                          student={student} 
                          onVerificationUpdate={loadDashboardData}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No students match your current filters.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStudentFilter('all');
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Clear filters
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No students registered yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Students will appear here once schools add them.</p>
                  </div>
                )}
              </div>
            )}

            {/* Debug Tab */}
            {activeTab === 'debug' && (
              <div>
                <StudentDataDebug />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;