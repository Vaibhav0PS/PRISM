import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, SCHOOL_CATEGORIES, REQUEST_TYPES, REQUEST_STATUS } from '../lib/supabase';
import StudentsManager from '../components/StudentsManager';


const SchoolDashboard = () => {
    const { user } = useAuth();
    const [school, setSchool] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // School registration form
    const [schoolForm, setSchoolForm] = useState({
        udise_id: '',
        name: '',
        location: '',
        category: SCHOOL_CATEGORIES.RURAL,
        region: ''
    });

    // Request form
    const [requestForm, setRequestForm] = useState({
        type: REQUEST_TYPES.SCHOLARSHIP,
        title: '',
        description: '',
        amount_estimate: ''
    });

    const [showSchoolForm, setShowSchoolForm] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors

            // Try to load school data, but handle database not existing
            try {
                const { data: schoolData, error: schoolError } = await supabase
                    .from('schools')
                    .select('*')
                    .eq('admin_id', user.id)
                    .single();

                if (schoolError && schoolError.code !== 'PGRST116') {
                    // If it's not a "no rows" error, it might be a table doesn't exist error
                    if (schoolError.message.includes('relation') && schoolError.message.includes('does not exist')) {
                        console.warn('Schools table does not exist - auth-only mode');
                        setSchool(null);
                        setRequests([]);
                        setError('Database tables not set up yet. You can still use authentication features.');
                        return;
                    }
                    throw schoolError;
                }

                setSchool(schoolData);

                // Load requests if school exists
                if (schoolData) {
                    const { data: requestsData, error: requestsError } = await supabase
                        .from('requests')
                        .select('*')
                        .eq('school_id', schoolData.id)
                        .order('created_at', { ascending: false });

                    if (requestsError) throw requestsError;
                    setRequests(requestsData || []);
                } else {
                    setRequests([]);
                }
            } catch (dbError) {
                console.warn('Database error - running in auth-only mode:', dbError.message);
                setSchool(null);
                setRequests([]);
                setError('Database not set up yet. Authentication works, but school features require database setup.');
            }

        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError(`Failed to load dashboard data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSchoolSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null); // Clear any previous errors

            const schoolData = {
                ...schoolForm,
                admin_id: user.id
            };

            const { data, error } = await supabase
                .from('schools')
                .insert([schoolData])
                .select()
                .single();

            if (error) throw error;

            setSchool(data);
            setShowSchoolForm(false);
            setSchoolForm({
                udise_id: '',
                name: '',
                location: '',
                category: SCHOOL_CATEGORIES.RURAL,
                region: ''
            });

        } catch (err) {
            console.error('Error creating school:', err);
            setError(`Failed to register school: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null); // Clear any previous errors

            const requestData = {
                ...requestForm,
                school_id: school.id,
                amount_estimate: parseFloat(requestForm.amount_estimate)
            };

            const { data, error } = await supabase
                .from('requests')
                .insert([requestData])
                .select()
                .single();

            if (error) throw error;

            setRequests([data, ...requests]);
            setShowRequestForm(false);
            setRequestForm({
                type: REQUEST_TYPES.SCHOLARSHIP,
                title: '',
                description: '',
                amount_estimate: ''
            });

        } catch (err) {
            console.error('Error creating request:', err);
            setError(`Failed to create request: ${err.message}`);
        } finally {
            setLoading(false);
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

    if (loading && !school) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to access the school dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Enhanced Header with Educational Background */}
                <div className="shadow-xl rounded-2xl mb-8 overflow-hidden relative">
                    {/* Background Image */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: 'url(https://i0.wp.com/world-education-blog.org/wp-content/uploads/2015/06/9952786683_979ae8bd7c_z.jpg?w=640&ssl=1)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    ></div>
                    
                    {/* Light overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/50"></div>
                    
                    <div className="px-8 py-12 relative z-10">
                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4 opacity-20">
                            <svg className="w-24 h-24 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="h-20 w-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                                        <span className="text-blue-600 font-bold text-3xl">शि</span>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                                            School Dashboard
                                        </h1>
                                        <p className="text-white text-xl mb-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                                            Welcome back, <span className="font-bold text-yellow-300">{user?.name}</span>! 
                                        </p>
                                        <p className="text-blue-100 text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                                            Manage your school and create funding requests with Shiksha Setu
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center space-x-4">
                                    <button
                                        onClick={() => loadDashboardData()}
                                        className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-4 py-2 rounded-xl font-medium flex items-center border border-white/20 transition-all duration-200"
                                        disabled={loading}
                                    >
                                        <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh
                                    </button>
                                    {school && (
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${school.verified
                                                ? 'bg-green-500 text-white'
                                                : 'bg-yellow-500 text-white'
                                                }`}>
                                                {school.verified ? '✅ Verified School' : '⏳ Pending Verification'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* School Info Card */}
                            {school && (
                                <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <svg className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                                                {school.name} • UDISE: {school.udise_id}
                                            </p>
                                            <p className="text-blue-100 text-sm mt-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                                                {school.location}, {school.region} • Category: {school.category}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Dashboard Error</div>
                                <div className="text-sm mt-1">{error}</div>
                                {error.includes('Database not set up') && (
                                    <div className="text-sm mt-2">
                                        <strong>Note:</strong> Authentication works, but school features require database setup.
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setError(null);
                                        loadDashboardData();
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced School Registration */}
                {!school && (
                    <div className="bg-white shadow-xl rounded-2xl mb-8 border border-gray-100">
                        <div className="px-8 py-8">
                            <div className="text-center mb-8">
                                <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Register Your School</h2>
                                <p className="text-gray-600 text-lg">
                                    Join Shiksha Setu by registering your school with UDISE ID to start creating funding requests
                                </p>
                            </div>

                            {!showSchoolForm ? (
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowSchoolForm(true)}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 mx-auto"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span>Register School</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <form onSubmit={handleSchoolSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    UDISE ID *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                    value={schoolForm.udise_id}
                                                    onChange={(e) => setSchoolForm({ ...schoolForm, udise_id: e.target.value })}
                                                    placeholder="Enter 11-digit UDISE ID"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    School Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                    value={schoolForm.name}
                                                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                                                    placeholder="Enter full school name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Location *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                    value={schoolForm.location}
                                                    onChange={(e) => setSchoolForm({ ...schoolForm, location: e.target.value })}
                                                    placeholder="Village/Town, District"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    School Category *
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                    value={schoolForm.category}
                                                    onChange={(e) => setSchoolForm({ ...schoolForm, category: e.target.value })}
                                                >
                                                    <option value={SCHOOL_CATEGORIES.RURAL}>🌾 Rural School</option>
                                                    <option value={SCHOOL_CATEGORIES.TRIBAL}>🏔️ Tribal School</option>
                                                    <option value={SCHOOL_CATEGORIES.URBAN}>🏙️ Urban School</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Region/District *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                    value={schoolForm.region}
                                                    onChange={(e) => setSchoolForm({ ...schoolForm, region: e.target.value })}
                                                    placeholder="Enter region or district name"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowSchoolForm(false)}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition duration-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition duration-200"
                                            >
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Registering...
                                                    </>
                                                ) : (
                                                    '🏫 Register School'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* School Info & Requests */}
                {school && (
                    <>
                        {/* School Info Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-6">
                            <div className="px-6 py-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900">{school.name}</h2>
                                            <div className="mt-1 space-y-1">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">UDISE ID:</span> {school.udise_id}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Location:</span> {school.location}, {school.region}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Category:</span>
                                                    <span className="ml-1 capitalize">
                                                        {(school.category === 'rural') && '🌾 Rural'}
                                                        {(school.category === 'tribal') && '🏔️ Tribal'}
                                                        {(school.category === 'urban') && '🏙️ Urban'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${(school.verified
                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200')
                                            }`}>
                                            {(school.verified ? '✅ Verified School' : '⏳ Pending Verification')}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Registered {new Date(school.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Students Section */}
                        <StudentsManager school={school} />

                        {/* Enhanced Requests Section */}
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 mb-8">
                            <div className="px-8 py-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Funding Requests</h2>
                                    </div>
                                    {school.verified && (
                                        <button
                                            onClick={() => setShowRequestForm(true)}
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span>Create Request</span>
                                        </button>
                                    )}
                                </div>

                                {!school.verified && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-xl mb-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-semibold text-yellow-800">Verification Required</h3>
                                                <p className="text-yellow-700 mt-1">
                                                    Your school must be verified by our admin team before you can create funding requests. 
                                                    This ensures authenticity and builds trust with donors.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Request Form */}
                                {showRequestForm && (
                                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                                        <h3 className="text-md font-medium text-gray-900 mb-4">Create New Request</h3>
                                        <form onSubmit={handleRequestSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Request Type</label>
                                                    <select
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={requestForm.type}
                                                        onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                                                    >
                                                        <option value={REQUEST_TYPES.SCHOLARSHIP}>Scholarship</option>
                                                        <option value={REQUEST_TYPES.INFRASTRUCTURE}>Infrastructure</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Amount Estimate (₹)</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="1"
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={requestForm.amount_estimate}
                                                        onChange={(e) => setRequestForm({ ...requestForm, amount_estimate: e.target.value })}
                                                        placeholder="Enter amount"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    value={requestForm.title}
                                                    onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                                                    placeholder="Enter request title"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    required
                                                    rows={4}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    value={requestForm.description}
                                                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                                    placeholder="Describe your request in detail"
                                                />
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                                                >
                                                    {loading ? 'Creating...' : 'Create Request'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRequestForm(false)}
                                                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Requests List */}
                                {requests.length > 0 ? (
                                    <div className="space-y-4">
                                        {requests.map((request) => (
                                            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="text-md font-medium text-gray-900">{request.title}</h3>
                                                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                                                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                                            <span>Type: {request.type}</span>
                                                            <span>Amount: ₹{request.amount_estimate?.toLocaleString()}</span>
                                                            <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No funding requests created yet.</p>
                                        {school.verified && (
                                            <p className="text-sm text-gray-400 mt-2">Click "Create Request" to get started.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SchoolDashboard;