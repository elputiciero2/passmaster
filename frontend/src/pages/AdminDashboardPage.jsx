import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { BarChart3, Users, Ticket, CheckCircle2, TrendingUp, RefreshCw, PlusCircle, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Formulario nuevo evento
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    max_capacity: 300,
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
    tiers: [
      { name: 'General', description: 'Acceso Estándar', price: 30, total_quantity: 200 },
      { name: 'VIP', description: 'Acceso Preferencial', price: 80, total_quantity: 100 }
    ]
  });

  const loadEventsList = async () => {
    try {
      const res = await api.getEvents();
      setEvents(res.data || []);
      if (!selectedEventId && res.data && res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando eventos:', err);
    }
  };

  const loadOccupancyStats = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getEventOccupancy(id);
      setOccupancy(res.data);
    } catch (err) {
      console.error('Error al cargar métricas de aforo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsList();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadOccupancyStats(selectedEventId);
    }
  }, [selectedEventId]);

  // Polling para monitoreo de aforo en tiempo real cada 5 segundos
  useEffect(() => {
    if (!autoRefresh || !selectedEventId) return;
    const interval = setInterval(() => {
      loadOccupancyStats(selectedEventId);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedEventId]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.createEvent(newEvent);
      setShowCreateModal(false);
      await loadEventsList();
      alert('¡Evento creado exitosamente!');
    } catch (err) {
      alert(err.message || 'Error al crear evento.');
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Panel Administrativo de Control y Monitoreo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Aforo y Ocupación en Tiempo Real
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Nuevo Evento</span>
          </button>

          <button
            onClick={() => loadOccupancyStats(selectedEventId)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refrescar métricas ahora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selector de Evento */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Monitoreando Evento:</label>
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.location})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Actualización en vivo cada 5s</span>
        </div>
      </div>

      {/* Tarjetas de Métricas de Aforo */}
      {occupancy && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Capacidad Máxima */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Capacidad Total</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-black text-white mt-3">{occupancy.max_capacity}</p>
              <p className="text-[11px] text-slate-400 mt-1">Configurado: {occupancy.total_configured} cupos</p>
            </div>

            {/* 2. Boletos Vendidos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Entradas Vendidas</span>
                <Ticket className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 mt-3">{occupancy.total_sold}</p>
              <p className="text-[11px] text-slate-400 mt-1">{occupancy.sales_percentage}% de venta total</p>
            </div>

            {/* 3. Asistentes Ingresados (Check-in) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Ingresos Físicos (Check-in)</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-purple-400 mt-3">{occupancy.total_checked_in}</p>
              <p className="text-[11px] text-slate-400 mt-1">Validados en puertas</p>
            </div>

            {/* 4. Porcentaje de Aforo Real en Recinto */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Ocupación Recinto</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-indigo-400 mt-3">{occupancy.occupancy_percentage}%</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {occupancy.total_configured - occupancy.total_checked_in} espacios disponibles
              </p>
            </div>
          </div>

          {/* Barra Visual de Ocupación */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Estado del Aforo en Vivo</h3>
                <p className="text-xs text-slate-400">Proporción de asistentes en el interior respecto a la capacidad permitida</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                occupancy.occupancy_percentage >= 90
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : occupancy.occupancy_percentage >= 70
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {occupancy.occupancy_percentage >= 90 ? 'Aforo Crítico' : occupancy.occupancy_percentage >= 70 ? 'Aforo Elevado' : 'Aforo Normal'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 rounded-full h-5 overflow-hidden p-1 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  occupancy.occupancy_percentage >= 90
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, occupancy.occupancy_percentage)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>0 (Vacío)</span>
              <span>{occupancy.total_checked_in} personas en sala</span>
              <span>{occupancy.total_configured} (Capacidad Máxima)</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Evento */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Evento con Localidades"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Título del Evento</label>
            <input
              type="text"
              required
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Ej: Festival Electrónico 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Lugar / Recinto</label>
              <input
                type="text"
                required
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Arena Central"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                required
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Descripción</label>
            <textarea
              rows={3}
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Detalles sobre las presentaciones y recomendaciones..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Aforo Máximo Total</label>
            <input
              type="number"
              min="10"
              value={newEvent.max_capacity}
              onChange={(e) => setNewEvent({ ...newEvent, max_capacity: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all mt-2"
          >
            Publicar Evento y Habilitar Venta
          </button>
        </form>
      </Modal>
    </div>
  );
}
