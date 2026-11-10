import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LayoutDashboard, AlertOctagon, Map, Cpu, LogOut, X, Users } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { name: 'All Incidents', to: '/admin/incidents', icon: AlertOctagon },
    { name: 'Response Teams', to: '/admin/teams', icon: Users },
    { name: 'Incident Map', to: '/admin/map', icon: Map },
    { name: 'AI Review', to: '/admin/ai-review', icon: Cpu },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:top-0 lg:h-[calc(100vh-4rem)] flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
            <span className="text-sm font-semibold text-slate-300">Admin Menu</span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
