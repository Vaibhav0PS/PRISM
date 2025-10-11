import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'school_admin':
        return '/school-dashboard';
      case 'donor':
        return '/donor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'school_admin':
        return 'School Admin';
      case 'donor':
        return 'Donor';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-sm">EL</span>
              </div>
              <span className="text-white text-xl font-bold">EduLink</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-yellow-300 transition duration-300">
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  className="text-white hover:text-yellow-300 transition duration-300"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="text-white text-sm">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-blue-200 text-xs">{getRoleDisplayName(user?.role)}</div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-white hover:text-yellow-300 transition duration-300"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-yellow-400 hover:bg-yellow-300 text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition duration-300"
                >
                  Join Platform
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-yellow-300 focus:outline-none focus:text-yellow-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-700">
              <Link 
                to="/" 
                className="text-white hover:text-yellow-300 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to={getDashboardLink()} 
                    className="text-white hover:text-yellow-300 block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="px-3 py-2">
                    <div className="text-white text-sm font-medium">{user?.name}</div>
                    <div className="text-blue-200 text-xs">{getRoleDisplayName(user?.role)}</div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-white hover:text-yellow-300 block px-3 py-2 text-base font-medium w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-white hover:text-yellow-300 block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-yellow-400 text-blue-600 hover:bg-yellow-300 block px-3 py-2 text-base font-medium rounded-md mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join Platform
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;