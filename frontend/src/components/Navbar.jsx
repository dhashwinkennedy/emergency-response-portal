import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldAlert, PhoneCall, LogOut, Menu, X, FileText, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {isAdmin && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link
              to={isAdmin ? '/admin' : '/citizen'}
              className="flex items-center gap-2.5 font-bold text-slate-900 tracking-tight text-lg"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span>
                Disaster<span className="text-blue-600">Response</span>
                {isAdmin && <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">Admin</span>}
              </span>
            </Link>
          </div>

          {/* Desktop Nav - Citizen */}
          {!isAdmin && user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/citizen"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/citizen'
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/citizen/report"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/citizen/report'
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Report Emergency
              </Link>
              <Link
                to="/citizen/my-reports"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/citizen/my-reports'
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Reports
              </Link>
            </nav>
          )}

          {/* Right actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* 112 Telephone Shortcut */}
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition-colors"
              title="National Emergency Dispatch Shortcut"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 112</span>
            </a>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{user.fullName}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button for citizens */}
          {!isAdmin && user && (
            <div className="sm:hidden flex items-center gap-2">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-600 text-white text-xs font-bold"
              >
                <PhoneCall className="w-3.5 h-3.5" /> 112
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Citizen Menu */}
      {!isAdmin && user && mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/citizen"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            to="/citizen/report"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <PlusCircle className="w-4 h-4" /> Report Emergency
          </Link>
          <Link
            to="/citizen/my-reports"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <FileText className="w-4 h-4" /> My Reports
          </Link>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">{user.fullName}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-red-600 font-medium flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
