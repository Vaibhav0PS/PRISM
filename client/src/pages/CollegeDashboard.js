import React, { useState, useEffect } from 'react';
import { collegeAPI, formatCurrency, formatDate, getStatusBadgeClass } from '../services/api';

const CollegeDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [fundedStudents, setFundedStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    collegeName: '',
    affiliationNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    contactPerson: '',
    phone: '',
    scholarshipsOffered: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, fundedRes, enrolledRes, impactRes] = await Promise.all([
        collegeAPI.getProfile().catch(() => ({ data: { data: null } })),
        collegeAPI.getFundedStudents().catch(() => ({ data: { data: [] } })),
        collegeAPI.getEnrolledStudents().catch(() => ({ data: { data: [] } })),
        collegeAPI.getImpact().catch(() => ({ data: { data: null } }))
      ]);

      setProfile(profileRes.data.data);
      setFundedStudents(fundedRes.data.data);
      setEnrolledStudents(enrolledRes.data.data);
      setImpact(impactRes.data.data);

      // Populate form if profile exists
      if (profileRes.data.data) {
        setProfileForm(profileRes.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await collegeAPI.createOrUpdateProfile(profileForm);
      setProfile(response.data.data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmission = async (studentId) => {
    try {
      setLoading(true);
      await collegeAPI.processAdmission({ studentId });
      setSuccess('Student admission processed successfully!');
      loadDashboardData(); // Refresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process admission');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (studentId) => {
    const feedback = prompt('Enter feedback for the student:');
    if (!feedback) return;

    try {
      setLoading(true);
      await collegeAPI.submitFeedback({ studentId, feedback });
      setSuccess('Feedback submitted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>College Dashboard</h1>
        <p style={styles.subtitle}>Manage your college profile and student admissions</p>
      </div>

      {error && (
        <div className="alert alert-danger" style={styles.alert}>
          {error}
          <button onClick={() => setError(null)} style={styles.closeBtn}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={styles.alert}>
          {success}
          <button onClick={() => setSuccess(null)} style={styles.closeBtn}>×</button>
        </div>
      )}

      {/* Impact Summary */}
      {impact && (
        <div style={styles.impactSummary}>
          <div className="row">
            <div className="col-md-3">
              <div className="card text-center">
                <h3 style={styles.impactNumber}>{impact.totalStudentsEnrolled}</h3>
                <p style={styles.impactLabel}>Students Enrolled</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <h3 style={styles.impactNumber}>{formatCurrency(impact.totalFundingReceived)}</h3>
                <p style={styles.impactLabel}>Funding Received</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <h3 style={styles.impactNumber}>{impact.uniqueSchoolsPartnered}</h3>
                <p style={styles.impactLabel}>Schools Partnered</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <h3 style={styles.impactNumber}>{impact.uniqueDonorsConnected}</h3>
                <p style={styles.impactLabel}>Donors Connected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
          style={styles.tab}
        >
          College Profile
        </button>
        <button
          className={activeTab === 'available' ? 'active' : ''}
          onClick={() => setActiveTab('available')}
          style={styles.tab}
        >
          Available Students ({fundedStudents.length})
        </button>
        <button
          className={activeTab === 'enrolled' ? 'active' : ''}
          onClick={() => setActiveTab('enrolled')}
          style={styles.tab}
        >
          Enrolled Students ({enrolledStudents.length})
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={styles.tabContent}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">College Profile</h3>
              {profile && (
                <span className={`badge ${getStatusBadgeClass(profile.verificationStatus)}`}>
                  {profile.verificationStatus?.toUpperCase()}
                </span>
              )}
            </div>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">College Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.collegeName}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        collegeName: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Affiliation Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.affiliationNumber}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        affiliationNumber: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Contact Person *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.contactPerson}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        contactPerson: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        phone: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address *</label>
                <div className="row">
                  <div className="col-md-12">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Street Address"
                      value={profileForm.address.street}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        address: { ...profileForm.address, street: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="City"
                      value={profileForm.address.city}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        address: { ...profileForm.address, city: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="State"
                      value={profileForm.address.state}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        address: { ...profileForm.address, state: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Pincode"
                      value={profileForm.address.pincode}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        address: { ...profileForm.address, pincode: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Available Students Tab */}
      {activeTab === 'available' && (
        <div style={styles.tabContent}>
          <h3>Funded Students Available for Admission</h3>
          
          {!profile || profile.verificationStatus !== 'verified' && (
            <div className="alert alert-warning">
              Your college must be verified before processing admissions.
            </div>
          )}

          <div className="row">
            {fundedStudents.map((student) => (
              <div key={student._id} className="col-md-6 mb-3">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <h5>{student.studentName}</h5>
                    <span className={`badge ${getStatusBadgeClass(student.status)}`}>
                      {student.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.cardBody}>
                    <p><strong>School:</strong> {student.schoolId?.schoolName}</p>
                    <p><strong>Grade:</strong> {student.grade}</p>
                    <p><strong>Category:</strong> {student.category}</p>
                    <p><strong>Financial Need:</strong> {formatCurrency(student.financialNeed)}</p>
                    <p><strong>Achievement:</strong> {student.achievementDetails}</p>
                    <p><strong>Donor:</strong> {student.donorId?.email}</p>
                    
                    <button
                      className="btn btn-success"
                      onClick={() => handleAdmission(student._id)}
                      disabled={loading || !profile || profile.verificationStatus !== 'verified'}
                    >
                      Process Admission
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {fundedStudents.length === 0 && (
            <div style={styles.emptyState}>
              <p>No funded students available for admission at the moment.</p>
            </div>
          )}
        </div>
      )}

      {/* Enrolled Students Tab */}
      {activeTab === 'enrolled' && (
        <div style={styles.tabContent}>
          <h3>Enrolled Students</h3>
          
          <div className="row">
            {enrolledStudents.map((student) => (
              <div key={student._id} className="col-md-6 mb-3">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <h5>{student.studentName}</h5>
                    <span className={`badge ${getStatusBadgeClass(student.status)}`}>
                      {student.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.cardBody}>
                    <p><strong>School:</strong> {student.schoolId?.schoolName}</p>
                    <p><strong>Grade:</strong> {student.grade}</p>
                    <p><strong>Category:</strong> {student.category}</p>
                    <p><strong>Financial Need:</strong> {formatCurrency(student.financialNeed)}</p>
                    <p><strong>Donor:</strong> {student.donorId?.email}</p>
                    <p><strong>Enrolled:</strong> {formatDate(student.updatedAt)}</p>
                    
                    <button
                      className="btn btn-info"
                      onClick={() => handleFeedbackSubmit(student._id)}
                      disabled={loading}
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {enrolledStudents.length === 0 && (
            <div style={styles.emptyState}>
              <p>No students enrolled yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#666',
    fontSize: '1.1rem'
  },
  alert: {
    position: 'relative',
    marginBottom: '1rem'
  },
  closeBtn: {
    position: 'absolute',
    right: '10px',
    top: '10px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  impactSummary: {
    marginBottom: '2rem'
  },
  impactNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '0.5rem'
  },
  impactLabel: {
    color: '#666',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #eee',
    marginBottom: '2rem'
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#666',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease'
  },
  tabContent: {
    minHeight: '400px'
  },
  cardBody: {
    padding: '1rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  }
};

export default CollegeDashboard;