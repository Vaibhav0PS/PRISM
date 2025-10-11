import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SupabaseTest from '../components/SupabaseTest';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/register';
    
    switch (user.role) {
      case 'school_admin':
        return '/school-dashboard';
      case 'donor':
        return '/donor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/register';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-yellow-300">EduLink</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connecting rural and underfunded schools with donors and NGOs for 
              verified student scholarships and infrastructure support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link 
                  to={getDashboardLink()} 
                  className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition duration-300"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/register" 
                    className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition duration-300"
                  >
                    Join Platform
                  </Link>
                  <Link 
                    to="/login" 
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transparent, verified, and impactful educational support system
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="text-4xl mb-4">🏫</div>
              <h3 className="text-xl font-semibold mb-3">School Registration</h3>
              <p className="text-gray-600">
                UDISE-verified school registration with document upload and 
                category-based classification for rural, tribal, and urban schools.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-3">Request Management</h3>
              <p className="text-gray-600">
                Create and manage scholarship and infrastructure requests with 
                document verification and progress tracking.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-3">Donor Connection</h3>
              <p className="text-gray-600">
                Connect verified schools with donors and NGOs through transparent 
                request listings and impact tracking.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-3">Admin Verification</h3>
              <p className="text-gray-600">
                Comprehensive admin dashboard for request verification, 
                document review, and system monitoring.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Impact Tracking</h3>
              <p className="text-gray-600">
                Real-time progress updates with photo documentation and 
                completion proof for full transparency.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3">Secure Platform</h3>
              <p className="text-gray-600">
                Role-based access control, secure document storage, and 
                verified user authentication for trusted interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How EduLink Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, transparent, and verified process
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">School Registration</h3>
              <p className="text-gray-600">
                Schools register with UDISE ID and upload verification documents
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Admin Verification</h3>
              <p className="text-gray-600">
                Admin reviews documents and validates UDISE ID for approval
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Request Listing</h3>
              <p className="text-gray-600">
                Approved requests appear on donor dashboard for funding
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Impact Tracking</h3>
              <p className="text-gray-600">
                Progress updates with photos and completion proof for transparency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supabase Test - Remove in production */}
      <SupabaseTest />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of schools and donors creating positive change through education.
          </p>
          {!isAuthenticated && (
            <Link 
              to="/register" 
              className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition duration-300 inline-block"
            >
              Get Started Today
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;