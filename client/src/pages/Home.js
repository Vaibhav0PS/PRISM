import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      {/* Hero Section with Background Image */}
      <section 
        className="relative min-h-screen flex items-center justify-center text-white"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1542810634-71277d95dcbb?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9vciUyMHNjaG9vbHxlbnwwfHwwfHx8MA%3D%3D)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Main content */}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                शिक्षा सेतु
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-yellow-300" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                Empowering Dreams Through Education
              </h2>
              <p className="text-lg md:text-xl mb-8 leading-relaxed max-w-2xl" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                Connecting rural schools with donors and NGOs to create verified 
                pathways for student scholarships and educational infrastructure 
                development.
              </p>
              
              {isAuthenticated && (
                <div className="bg-green-500 bg-opacity-90 text-white px-6 py-3 rounded-lg mb-6 inline-block">
                  ✅ Welcome back, {user.name}! Your account is active and ready.
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {isAuthenticated ? (
                  <Link 
                    to={getDashboardLink()} 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 text-center"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 text-center"
                    >
                      Donate Now
                    </Link>
                    <Link 
                      to="/login" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 text-center"
                    >
                      Apply for Scholarship
                    </Link>
                  </>
                )}
              </div>
              
              <div className="text-4xl md:text-5xl font-bold text-gray-300 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                BRIGHT FUTURES START<br />
                WITH A SPARK
              </div>
            </div>

            {/* Right side - Impact Stats */}
            <div className="bg-black bg-opacity-70 p-8 rounded-2xl backdrop-blur-sm border border-gray-600">
              <h3 className="text-2xl font-bold mb-8 text-center text-yellow-300">
                Donation Campaigns
              </h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Schools Supported</span>
                  <span className="text-2xl font-bold text-yellow-400">1,250+</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg">Students Benefited</span>
                  <span className="text-2xl font-bold text-yellow-400">50,000+</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg">Funds Raised</span>
                  <span className="text-2xl font-bold text-yellow-400">₹2.5 Crillion</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg">Active NGO Partners</span>
                  <span className="text-2xl font-bold text-yellow-400">150+</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-600">
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-2">Join thousands making a difference</div>
                  <Link 
                    to="/register" 
                    className="inline-block bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
                  >
                    Start Your Impact Journey
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              To bridge the educational divide by connecting underprivileged schools with 
              compassionate donors, creating verified pathways for student scholarships 
              and infrastructure development across rural India.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-orange-500">
              <div className="text-5xl mb-6 text-orange-500">🎓</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Student Scholarships</h3>
              <p className="text-gray-600 leading-relaxed">
                Direct financial support for deserving students with verified documentation 
                and transparent fund allocation to ensure maximum impact.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-blue-500">
              <div className="text-5xl mb-6 text-blue-500">🏫</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Infrastructure Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Building better learning environments through classroom construction, 
                library development, and essential facility upgrades.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-green-500">
              <div className="text-5xl mb-6 text-green-500">✅</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Verified Impact</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete transparency with document verification, progress tracking, 
                and photo documentation of every funded project.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-purple-500">
              <div className="text-5xl mb-6 text-purple-500">🤝</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Community Partnership</h3>
              <p className="text-gray-600 leading-relaxed">
                Connecting schools, donors, and NGOs in a collaborative ecosystem 
                focused on sustainable educational development.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-red-500">
              <div className="text-5xl mb-6 text-red-500">📱</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Digital Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                User-friendly technology platform making it easy for schools to 
                request support and donors to track their contributions.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-yellow-500">
              <div className="text-5xl mb-6 text-yellow-500">🌟</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Lasting Change</h3>
              <p className="text-gray-600 leading-relaxed">
                Creating sustainable impact that transforms not just individual lives 
                but entire communities through the power of education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How शिक्षा सेतु Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple, transparent, and verified process that ensures every donation 
              reaches the right students and creates lasting impact.
            </p>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-green-500 rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">School Registration</h3>
                <p className="text-gray-600 leading-relaxed">
                  Schools register with UDISE ID, upload verification documents, 
                  and create detailed profiles showcasing their needs.
                </p>
              </div>
              
              <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Admin Verification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our admin team thoroughly reviews documents, validates UDISE IDs, 
                  and ensures only genuine schools are approved.
                </p>
              </div>
              
              <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Donor Connection</h3>
                <p className="text-gray-600 leading-relaxed">
                  Verified requests appear on donor dashboards where compassionate 
                  individuals and organizations can choose to support.
                </p>
              </div>
              
              <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  4
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Impact Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Real-time progress updates with photo documentation and 
                  completion proof ensure complete transparency.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-2xl max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Lives?</h3>
              <p className="text-lg mb-6">
                Join our community of changemakers and help build a brighter future for students across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/register" 
                  className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                >
                  Start Donating
                </Link>
                <Link 
                  to="/register" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition duration-300"
                >
                  Register School
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Success Stories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Real impact, real change, real hope for the future
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Rural School Transformation</h3>
              <p className="text-gray-600 mb-4">
                "Thanks to शिक्षा सेतु, our village school now has a proper library and 
                computer lab. 50 students received scholarships this year."
              </p>
              <div className="text-sm text-gray-500">- Headmaster, Rajasthan</div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Student Achievement</h3>
              <p className="text-gray-600 mb-4">
                "The scholarship helped me continue my studies. Now I'm pursuing 
                engineering and want to give back to my community."
              </p>
              <div className="text-sm text-gray-500">- Priya, Scholarship Recipient</div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Donor Satisfaction</h3>
              <p className="text-gray-600 mb-4">
                "The transparency and regular updates make me confident that my 
                donations are creating real impact. I've supported 10 students so far."
              </p>
              <div className="text-sm text-gray-500">- Amit, Regular Donor</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        className="py-20 relative text-white"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://images.unsplash.com/photo-1542810634-71277d95dcbb?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9vciUyMHNjaG9vbHxlbnwwfHwwfHx8MA%3D%3D)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Every Child Deserves a Bright Future
          </h2>
          <p className="text-xl mb-8 leading-relaxed">
            Your contribution can light up a child's world with the power of education. 
            Join our mission to bridge the educational divide and create lasting change.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-lg font-bold text-lg transition duration-300 inline-block shadow-lg"
              >
                Start Making a Difference
              </Link>
              <Link 
                to="/login" 
                className="border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-gray-900 transition duration-300 inline-block"
              >
                Learn More
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;