import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Ticket, BarChart3, ScanLine, LogIn, LogOut, Calendar, PlusCircle } from 'lucide-react';

export default function Navbar({ currentView, setView, onOpenAuth }) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setView('catalog')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              PassMaster
            </span>
            <span className="block text-[10px] text-emerald-400 font-medium uppercase tracking-wider -mt-1">
              Ticketing & Access
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setView('catalog')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              currentView === 'catalog' 
                ? 'bg-slate-800 text-emerald-400' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Eventos</span>
          </button>

          {/* Comprador / General */}
          {isAuthenticated && (
            <button
              onClick={() => setView('my-tickets')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'my-tickets' 
                  ? 'bg-slate-800 text-emerald-400' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Boletos</span>
            </button>
          )}

          {/* Personal Staff / Admin Check-in */}
          {isAuthenticated && (user?.role === 'STAFF' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setView('staff-scan')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'staff-scan' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>Check-in Staff</span>
            </button>
          )}

          {/* Panel Admin de Aforo */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <button
              onClick={() => setView('admin-dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'admin-dashboard' 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'text-indigo-400 hover:bg-indigo-950/40'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard Aforo</span>
            </button>
          )}
        </nav>

        {/* User profile / auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                <span className="inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
