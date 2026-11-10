import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import { Loader2 } from 'lucide-react';

// Lazy-loaded Pages for optimal bundle size
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard.jsx'));
const ReportEmergency = lazy(() => import('./pages/ReportEmergency.jsx'));
const MyReports = lazy(() => import('./pages/MyReports.jsx'));
const IncidentDetails = lazy(() => import('./pages/IncidentDetails.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminIncidents = lazy(() => import('./pages/AdminIncidents.jsx'));
const AdminIncidentDetails = lazy(() => import('./pages/AdminIncidentDetails.jsx'));
const AdminMap = lazy(() => import('./pages/AdminMap.jsx'));
const AIReview = lazy(() => import('./pages/AIReview.jsx'));
const ResponseTeams = lazy(() => import('./pages/ResponseTeams.jsx'));
const TeamDashboard = lazy(() => import('./pages/TeamDashboard.jsx'));

// Page loading fallback
function PageFallback() {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-xs">Loading page...</span>
    </div>
  );
}

// Citizen Layout wrapper
function CitizenLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <AlertBanner />
      <main className="flex-1 pb-12">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

// Admin Layout wrapper
function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <AlertBanner />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Root redirector based on session
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading system...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'team' ? '/team' : '/citizen'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Citizen Protected Routes */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CitizenDashboard />} />
                <Route path="report" element={<ReportEmergency />} />
                <Route path="my-reports" element={<MyReports />} />
                <Route path="incidents/:incidentId" element={<IncidentDetails />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="incidents" element={<AdminIncidents />} />
                <Route path="incidents/:incidentId" element={<AdminIncidentDetails />} />
                <Route path="map" element={<AdminMap />} />
                <Route path="ai-review" element={<AIReview />} />
                <Route path="teams" element={<ResponseTeams />} />
              </Route>

              <Route path="/team" element={<ProtectedRoute allowedRoles={['team']}><CitizenLayout /></ProtectedRoute>}>
                <Route index element={<TeamDashboard />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
