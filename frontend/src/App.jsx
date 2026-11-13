import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './pages/AuthModal';
import CatalogPage from './pages/CatalogPage';
import EventDetailPage from './pages/EventDetailPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StaffScannerPage from './pages/StaffScannerPage';
import { ShieldCheck, Ticket } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setView] = useState('catalog');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setView('event-detail');
  };

  const handlePurchaseSuccess = () => {
    setView('my-tickets');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        onOpenAuth={() => setIsAuthOpen(true)} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {currentView === 'catalog' && (
          <CatalogPage onSelectEvent={handleSelectEvent} />
        )}

        {currentView === 'event-detail' && (
          <EventDetailPage
            eventId={selectedEventId}
            onBack={() => setView('catalog')}
            onPurchaseSuccess={handlePurchaseSuccess}
            onRequireAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === 'my-tickets' && (
          <MyTicketsPage />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboardPage />
        )}

        {currentView === 'staff-scan' && (
          <StaffScannerPage />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Ticket className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-200">PassMaster</span>
            <span>— Sistema de Ticketing y Acceso a Eventos</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transacciones ACID & HMAC SHA-256</span>
            </span>
            <span>•</span>
            <span>React + Node.js MVC + MySQL</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
