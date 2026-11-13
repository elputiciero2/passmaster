import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { 
  BarChart3, Users, Ticket, CheckCircle2, TrendingUp, RefreshCw, 
  PlusCircle, Edit3, Trash2, Calendar, MapPin, AlertCircle, Layers, 
  Settings2, Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'management'
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Modal Crear / Editar
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Estado del formulario de evento
  const initialFormState = {
    title: '',
    description: '',
    location: '',
    event_date: '',
    max_capacity: 500,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    status: 'PUBLISHED',
    tiers: [
      { name: 'General', description: 'Acceso Estándar', price: 30, total_quantity: 400 },
      { name: 'VIP', description: 'Acceso Preferencial', price: 80, total_quantity: 100 }
    ]
  };

  const [formData, setFormData] = useState(initialFormState);

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
    if (selectedEventId && activeTab === 'metrics') {
      loadOccupancyStats(selectedEventId);
    }
  }, [selectedEventId, activeTab]);

  // Refresco automático de aforo cada 5s
  useEffect(() => {
    if (!autoRefresh || !selectedEventId || activeTab !== 'metrics') return;
    const interval = setInterval(() => {
      loadOccupancyStats(selectedEventId);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedEventId, activeTab]);

  // Manejo de Localidades (Tiers) en el Formulario
  const handleTierChange = (index, field, value) => {
    const updated = [...formData.tiers];
    updated[index][field] = field === 'price' || field === 'total_quantity' 
      ? parseFloat(value) || 0 
      : value;
    setFormData({ ...formData, tiers: updated });
  };

  const addTier = () => {
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        { name: 'Nueva Localidad', description: 'Acceso', price: 50, total_quantity: 100 }
      ]
    });
  };

  const removeTier = (index) => {
    if (formData.tiers.length <= 1) {
      alert('El evento debe tener al menos una localidad.');
      return;
    }
    const updated = formData.tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, tiers: updated });
  };

  // Ajusta la suma de cupos de las localidades para que iguale exactamente el Aforo Máximo Total
  const autoBalanceCapacity = () => {
    const max = parseInt(formData.max_capacity, 10) || 100;
    if (formData.tiers.length === 1) {
      const updated = [{ ...formData.tiers[0], total_quantity: max }];
      setFormData({ ...formData, tiers: updated });
    } else {
      // Dejar los otros fijos y balancear el primero (General)
      const othersSum = formData.tiers.slice(1).reduce((sum, t) => sum + (parseInt(t.total_quantity, 10) || 0), 0);
      const firstTierQty = Math.max(0, max - othersSum);
      const updated = [...formData.tiers];
      updated[0].total_quantity = firstTierQty;
      setFormData({ ...formData, tiers: updated });
    }
  };

  const totalTiersQuantity = formData.tiers.reduce((sum, t) => sum + (parseInt(t.total_quantity, 10) || 0), 0);

  // Abrir Modal para Crear
  const openCreateModal = () => {
    setEditingEventId(null);
    setFormData(initialFormState);
    setFormError('');
    setShowEventModal(true);
  };

  // Abrir Modal para Editar
  const openEditModal = async (event) => {
    try {
      setModalLoading(true);
      setEditingEventId(event.id);
      setFormError('');

      // Cargar evento completo con sus localidades
      const res = await api.getEventById(event.id);
      const full = res.data;

      // Formatear fecha para datetime-local
      let dateFormatted = '';
      if (full.event_date) {
        const d = new Date(full.event_date);
        const pad = (n) => String(n).padStart(2, '0');
        dateFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }

      setFormData({
        title: full.title || '',
        description: full.description || '',
        location: full.location || '',
        event_date: dateFormatted,
        max_capacity: full.max_capacity || 500,
        banner_url: full.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        status: full.status || 'PUBLISHED',
        tiers: full.tiers && full.tiers.length > 0
          ? full.tiers.map(t => ({
              id: t.id,
              name: t.name,
              description: t.description || '',
              price: parseFloat(t.price),
              total_quantity: parseInt(t.total_quantity, 10),
              available_quantity: parseInt(t.available_quantity, 10)
            }))
          : initialFormState.tiers
      });

      setShowEventModal(true);
    } catch (err) {
      alert('Error cargando detalles del evento para edición.');
    } finally {
      setModalLoading(false);
    }
  };

  // Guardar (Crear o Editar)
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (totalTiersQuantity <= 0) {
      setFormError('Debes configurar al menos una localidad con cupos disponibles.');
      return;
    }

    try {
      setModalLoading(true);
      if (editingEventId) {
        await api.updateEvent(editingEventId, formData);
        alert('¡Evento actualizado exitosamente!');
      } else {
        await api.createEvent(formData);
        alert('¡Evento creado exitosamente con sus localidades!');
      }

      setShowEventModal(false);
      await loadEventsList();

      if (editingEventId === selectedEventId) {
        loadOccupancyStats(selectedEventId);
      }
    } catch (err) {
      setFormError(err.message || 'Error al guardar evento.');
    } finally {
      setModalLoading(false);
    }
  };

  // Eliminar Evento
  const handleDeleteEvent = async (eventId, eventTitle) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el evento "${eventTitle}"?`);
    if (!confirmed) return;

    try {
      await api.deleteEvent(eventId);
      alert('Evento eliminado correctamente.');
      await loadEventsList();
      if (selectedEventId === eventId) {
        setSelectedEventId(null);
        setOccupancy(null);
      }
    } catch (err) {
      alert(err.message || 'Error al eliminar el evento.');
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Panel Administrativo Exclusivo (Rol ADMIN)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Control de Eventos y Aforo
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas: Monitoreo de Aforo vs Gestión de Eventos */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'metrics'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Monitoreo de Aforo en Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('management')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'management'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Gestión de Eventos (Editar / Eliminar)</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-indigo-300 font-mono">
            {events.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: MONITOREO DE AFORO EN TIEMPO REAL */}
      {/* ========================================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Selector de Evento */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-400 uppercase shrink-0">Monitoreando:</label>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 text-xs">En vivo (5s)</span>
              </div>
              <button
                onClick={() => loadOccupancyStats(selectedEventId)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Refrescar métricas ahora"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas de Aforo */}
          {occupancy ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Capacidad Máxima */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Capacidad Total</span>
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-3xl font-black text-white mt-3">{occupancy.max_capacity}</p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                    Configurado en entradas: {occupancy.total_configured} cupos
                  </p>
                </div>

                {/* 2. Boletos Vendidos */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Entradas Vendidas</span>
                    <Ticket className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-emerald-400 mt-3">{occupancy.total_sold}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    {occupancy.sales_percentage}% de venta total
                  </p>
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
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    {Math.max(0, (occupancy.effective_capacity || occupancy.total_configured) - occupancy.total_checked_in)} espacios disponibles
                  </p>
                </div>
              </div>

              {/* Barra Visual de Ocupación */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Estado del Aforo en Vivo</h3>
                    <p className="text-xs text-slate-400">Proporción de personas actualmente en sala respecto al aforo configurado</p>
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
                  <span className="font-bold text-white">{occupancy.total_checked_in} personas adentro</span>
                  <span>{occupancy.effective_capacity || occupancy.total_configured} (Aforo Efectivo)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Selecciona un evento para visualizar su métrica de aforo.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: GESTIÓN DE EVENTOS (EDITAR / ELIMINAR) */}
      {/* ========================================================================= */}
      {activeTab === 'management' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Modifica los detalles, capacidad y precios por localidad de tus eventos, o elimínalos según se requiera.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {events.map((ev) => {
              const dateStr = new Date(ev.event_date).toLocaleDateString('es-ES', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={ev.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={ev.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300'}
                      alt={ev.title}
                      className="w-20 h-20 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-900">
                          {ev.status}
                        </span>
                        <h3 className="font-bold text-white text-base">{ev.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="capitalize">{dateStr}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.location}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300 font-mono pt-1">
                        <span>Aforo Máximo: <strong>{ev.max_capacity}</strong></span>
                        <span>•</span>
                        <span>Cupos en Localidades: <strong className="text-emerald-400">{ev.configured_capacity}</strong></span>
                        <span>•</span>
                        <span>Vendidos: <strong className="text-indigo-400">{ev.sold_tickets}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones para el Admin */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => { setSelectedEventId(ev.id); setActiveTab('metrics'); }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Ver monitoreo de aforo"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Aforo</span>
                    </button>

                    <button
                      onClick={() => openEditModal(ev)}
                      className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Editar evento y localidades"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.title)}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTELIGENTE PARA CREAR / EDITAR EVENTO Y SUS LOCALIDADES */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editingEventId ? 'Editar Evento y Aforo' : 'Crear Nuevo Evento'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitEvent} className="space-y-5">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Información General */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              1. Datos Principales del Evento
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Título del Evento</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Concierto En Vivo"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Lugar / Recinto</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Estadio Metropolitano"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Aforo Máximo Total del Recinto
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PUBLISHED">Publicado (Venta activa)</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="FINISHED">Finalizado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">URL de Imagen / Banner</label>
              <input
                type="url"
                value={formData.banner_url}
                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Descripción</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles sobre el evento..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Configuración Dinámica de Localidades (Tiers) */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Localidades y Cupos de Entradas</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Define el nombre, precio y cantidad de boletos para cada categoría.
                </p>
              </div>

              <button
                type="button"
                onClick={addTier}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Agregar Localidad</span>
              </button>
            </div>

            {/* Listado de Tiers */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formData.tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-4">
                    <label className="text-[10px] text-slate-400 block uppercase">Nombre</label>
                    <input
                      type="text"
                      required
                      value={tier.name}
                      onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                      placeholder="General, VIP..."
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-400 block uppercase">Precio ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={tier.price}
                      onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="text-[10px] text-slate-400 block uppercase">Cupos Asignados</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={tier.total_quantity}
                      onChange={(e) => handleTierChange(idx, 'total_quantity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="col-span-1 text-center pt-3">
                    <button
                      type="button"
                      onClick={() => removeTier(idx)}
                      title="Eliminar localidad"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sumario y Auto-ajuste de Capacidad */}
            <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
              totalTiersQuantity === parseInt(formData.max_capacity, 10)
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              <div>
                <span>Total cupos configurados: <strong>{totalTiersQuantity}</strong> / {formData.max_capacity}</span>
                {totalTiersQuantity !== parseInt(formData.max_capacity, 10) && (
                  <p className="text-[11px] text-amber-400/90 mt-0.5">
                    La suma de las localidades difiere del Aforo Máximo Total ({formData.max_capacity}).
                  </p>
                )}
              </div>

              {totalTiersQuantity !== parseInt(formData.max_capacity, 10) && (
                <button
                  type="button"
                  onClick={autoBalanceCapacity}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg font-bold text-[11px] shrink-0"
                >
                  Ajustar a {formData.max_capacity} cupos
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setShowEventModal(false)}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
            >
              {modalLoading ? 'Guardando...' : editingEventId ? 'Actualizar Evento' : 'Publicar Evento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
