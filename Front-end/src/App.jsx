import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InternshipDetailPage from './pages/InternshipDetailPage';
import StudentDashboard from './pages/student/StudentDashboard';
import EditProfilePage from './pages/student/EditProfilePage';
import DigitalCVPage from './pages/student/DigitalCVPage';
import NotificationsPage from './pages/student/NotificationsPage';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import CompanyNotificationsPage from './pages/company/CompanyNotificationsPage';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/internship/:id" element={<InternshipDetailPage />} />

          <Route path="/student/profile" element={<ProtectedRoute role="student"><EditProfilePage /></ProtectedRoute>} />
          <Route path="/student/cv" element={<ProtectedRoute role="student"><DigitalCVPage /></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute role="student"><NotificationsPage /></ProtectedRoute>} />
          <Route path="/student/*" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/company/profile" element={<ProtectedRoute role="company"><CompanyProfilePage /></ProtectedRoute>} />
          <Route path="/company/notifications" element={<ProtectedRoute role="company"><CompanyNotificationsPage /></ProtectedRoute>} />
          <Route path="/company/*" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
          
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><AdminNotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

