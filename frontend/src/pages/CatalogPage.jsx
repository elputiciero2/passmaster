import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Calendar, MapPin, Users, Ticket, Search, Sparkles } from 'lucide-react';

export default function CatalogPage({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents(search ? `search=${encodeURIComponent(search)}` : '');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Error cargando eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Inteligente de Ticketing y Acceso Seguro</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Descubre y Vive Experiencias Inolvidables
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Adquiere tus entradas digitales con validación criptográfica instantánea. Control de aforo en tiempo real y acceso sin filas mediante códigos QR infalsificables.
          </p>

          {/* Search bar */}
          <div className="pt-2">
            <div className="relative max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título de evento o ubicación..."
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Eventos Disponibles</h2>
            <p className="text-xs text-slate-400">Selecciona un evento para elegir tu localidad y comprar boletos</p>
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
            {events.length} convocatorias activas
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No se encontraron eventos disponibles con ese criterio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const dateStr = new Date(ev.event_date).toLocaleDateString('es-ES', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const availableCap = parseInt(ev.available_capacity || '0', 10);

              return (
                <div
                  key={ev.id}
                  className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col"
                >
                  {/* Banner Image */}
                  <div className="h-44 w-full relative overflow-hidden bg-slate-800">
                    <img
                      src={ev.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                        availableCap > 0 
                          ? 'bg-emerald-500/90 text-slate-950' 
                          : 'bg-rose-500/90 text-white'
                      }`}>
                        {availableCap > 0 ? `${availableCap} Cupos Libres` : 'Agotado'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {ev.title}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {ev.description || 'Sin descripción disponible.'}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="capitalize">{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Aforo Máximo: {ev.max_capacity} asistentes</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectEvent(ev.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-emerald-500/10"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Ver Entradas y Precios</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
