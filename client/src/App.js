import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SchoolDashboard from './pages/SchoolDashboard';
import DonorDashboard from './pages/DonorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import UserRoleDebug from './components/UserRoleDebug';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/school-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['school_admin']}>
                    <SchoolDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['donor']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
          <UserRoleDebug />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;