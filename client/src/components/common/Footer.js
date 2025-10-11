import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-sm">EL</span>
              </div>
              <span className="text-xl font-bold">EduLink</span>
            </div>
            <p className="text-gray-300 text-sm max-w-md">
              Connecting rural and underfunded schools with donors and NGOs for 
              verified student scholarships and infrastructure support through 
              transparent, UDISE-verified platform.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white text-sm transition duration-300">
                  Home
                </a>
              </li>
              <li>
                <a href="/register" className="text-gray-300 hover:text-white text-sm transition duration-300">
                  Join Platform
                </a>
              </li>
              <li>
                <a href="/login" className="text-gray-300 hover:text-white text-sm transition duration-300">
                  Sign In
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              Features
            </h3>
            <ul className="space-y-2">
              <li className="text-gray-300 text-sm">🏫 UDISE Verification</li>
              <li className="text-gray-300 text-sm">📚 Request Management</li>
              <li className="text-gray-300 text-sm">🤝 Donor Connection</li>
              <li className="text-gray-300 text-sm">📊 Impact Tracking</li>
              <li className="text-gray-300 text-sm">✅ Admin Verification</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 EduLink Platform. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-400 text-sm">
                Powered by Supabase • Built with React & Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;