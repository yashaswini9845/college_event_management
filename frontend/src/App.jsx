import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, PlusCircle, Settings, LogOut, ChevronDown, User, Users, BarChart2, FileText, SunMedium, Wheat, Cog } from 'lucide-react';
import './App.css';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import DataEntry from './pages/DataEntry';
import Login from './pages/Login';
import PublicRegistration from './pages/PublicRegistration';
import Participants from './pages/Participants';
import Reports from './pages/Reports';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    // If they are a student trying to access dashboard/data-entry, redirect to events
    return <Navigate to="/events" />;
  }
  
  return children;
}

function Topbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="topbar">
      <div 
        className="user-dropdown" 
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="user-info" style={{ textAlign: 'right' }}>
          <span className="user-name">{user.full_name}</span>
          {user.user_code && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.4px' }}>
              ID: {user.user_code}
            </span>
          )}
          <span className="user-role">{user.role_name}</span>
        </div>
        <div className="avatar">
          {user.full_name.substring(0, 2).toUpperCase()}
        </div>
        <ChevronDown size={16} color="#64748b" />
        
        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item">
              <User size={16} /> My Profile
            </div>
            <div className="dropdown-item">
              <Settings size={16} /> Preferences
            </div>
            <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
            <div className="dropdown-item danger" onClick={logout}>
              <LogOut size={16} /> Sign Out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

  if (!user) return null;

  const isStudent = user.role_name === 'Student';
  const isAdmin = user.role_name === 'Admin';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand-mark" aria-hidden="true">
          <div className="brand-mark-inner">
            <SunMedium size={18} className="brand-mark-sun" />
            <Wheat size={18} className="brand-mark-leaf" />
            <Cog size={18} className="brand-mark-cog" />
          </div>
        </div>
        <div className="brand-text">
          <span className="brand-university">CHANAKYA UNIVERSITY</span>
          <span className="brand-portal">Event Intelligence Portal</span>
        </div>
      </div>
      
      <div className="nav-links">
        {!isStudent && (
          <Link to="/" className={`nav-item ${currentPath === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
        )}
        
        <Link to="/events" className={`nav-item ${currentPath === '/events' ? 'active' : ''}`}>
          <CalendarDays size={20} />
          <span>Events</span>
        </Link>

        {!isStudent && (
          <>
            <Link to="/participants" className={`nav-item ${currentPath === '/participants' ? 'active' : ''}`}>
              <Users size={20} />
              <span>Participants</span>
            </Link>
            
            {isAdmin && (
              <>
                <Link to="/analytics" className={`nav-item ${currentPath === '/analytics' ? 'active' : ''}`}>
                  <BarChart2 size={20} />
                  <span>Analytics</span>
                </Link>

                <Link to="/reports" className={`nav-item ${currentPath === '/reports' ? 'active' : ''}`}>
                  <FileText size={20} />
                  <span>Reports</span>
                </Link>
              </>
            )}

            <Link to="/data-entry" className={`nav-item ${currentPath === '/data-entry' ? 'active' : ''}`}>
              <PlusCircle size={20} />
              <span>Data Entry</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function AppLayout() {
  const { user } = useAuth();
  
  return (
    <div className="app-container">
      {user && <Sidebar />}
      <main className="main-content" style={{ marginLeft: user ? '260px' : '0' }}>
        {user && <Topbar />}
        <div className="page-wrapper" style={{ padding: user ? '40px' : '0', maxWidth: user ? '1400px' : '100%' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/public/register/:eventId" element={<PublicRegistration />} />
            
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/events" element={
              <ProtectedRoute>
                <EventList />
              </ProtectedRoute>
            } />

            <Route path="/participants" element={
              <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                <Participants />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="/data-entry" element={
              <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                <DataEntry />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to={user ? '/events' : '/login'} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
