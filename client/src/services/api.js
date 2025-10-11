import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  verifyToken: () => api.get('/auth/verify-token')
};

// School API
export const schoolAPI = {
  getProfile: () => api.get('/school/profile'),
  createOrUpdateProfile: (profileData) => api.post('/school/profile', profileData),
  getStudents: () => api.get('/school/students'),
  addStudent: (studentData) => api.post('/school/students', studentData),
  updateStudent: (id, studentData) => api.put(`/school/students/${id}`, studentData),
  getRequests: () => api.get('/school/requests'),
  createRequest: (requestData) => api.post('/school/requests', requestData),
  getRequestStatus: (id) => api.get(`/school/requests/${id}/status`)
};

// Donor API
export const donorAPI = {
  getVerifiedRequests: (params) => api.get('/donor/requests', { params }),
  getVerifiedStudents: (params) => api.get('/donor/students', { params }),
  donateToRequest: (donationData) => api.post('/donor/donate/request', donationData),
  sponsorStudent: (sponsorData) => api.post('/donor/donate/student', sponsorData),
  getDonationHistory: (params) => api.get('/donor/donations', { params }),
  getImpactMetrics: () => api.get('/donor/impact')
};

// College API
export const collegeAPI = {
  getProfile: () => api.get('/college/profile'),
  createOrUpdateProfile: (profileData) => api.post('/college/profile', profileData),
  getFundedStudents: (params) => api.get('/college/students', { params }),
  getEnrolledStudents: () => api.get('/college/enrolled-students'),
  processAdmission: (admissionData) => api.post('/college/admission', admissionData),
  submitFeedback: (feedbackData) => api.post('/college/feedback', feedbackData),
  getImpact: () => api.get('/college/impact')
};

// Verification API
export const verificationAPI = {
  verifySchool: (id) => api.post(`/verify/school/${id}`),
  verifyStudent: (id) => api.post(`/verify/student/${id}`),
  verifyRequest: (id) => api.post(`/verify/request/${id}`),
  verifyCollege: (id) => api.post(`/verify/college/${id}`),
  getPendingVerifications: () => api.get('/verify/pending'),
  getVerificationLogs: (entityId) => api.get(`/verify/logs/${entityId}`),
  manualReviewOverride: (id, reviewData) => api.put(`/verify/manual-review/${id}`, reviewData)
};

// Impact API
export const impactAPI = {
  getOverallStatistics: () => api.get('/impact/overall'),
  getRegionalAnalytics: () => api.get('/impact/regional'),
  getFundingTrends: (params) => api.get('/impact/trends', { params }),
  getVerificationAnalytics: () => api.get('/impact/verification-analytics')
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'approved':
    case 'funded':
    case 'enrolled':
    case 'completed':
      return 'badge-success';
    case 'pending':
    case 'in_review':
    case 'pending_manual_review':
      return 'badge-warning';
    case 'rejected':
    case 'failed':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

export const getVerificationScoreColor = (score) => {
  if (score >= 80) return '#28a745'; // Green
  if (score >= 50) return '#ffc107'; // Yellow
  return '#dc3545'; // Red
};

export default api;