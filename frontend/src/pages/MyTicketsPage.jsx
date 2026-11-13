import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Ticket as TicketIcon, QrCode, Calendar, MapPin, CheckCircle, Clock, ShieldCheck, Printer } from 'lucide-react';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getMyTickets();
      setTickets(res.data || []);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openTicketDetail = async (ticketId) => {
    try {
      setLoadingModal(true);
      const res = await api.getTicketById(ticketId);
      setSelectedTicket(res.data);
    } catch (err) {
      alert(err.message || 'Error al cargar código QR del ticket');
    } finally {
      setLoadingModal(false);
    }
  };

  return (
    <div className="space-y-6 py-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mis Boletos Digitales</h1>
        <p className="text-xs text-slate-400">Presenta el código QR en el acceso al evento para realizar tu Check-in</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-3xl">
          <TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Aún no tienes boletos comprados</h3>
          <p className="text-xs text-slate-400 mt-1">Explora los eventos disponibles en el catálogo para adquirir tus entradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((tkt) => {
            const dateStr = new Date(tkt.event_date).toLocaleDateString('es-ES', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isActive = tkt.status === 'ACTIVE';
            const isCheckedIn = tkt.status === 'CHECKED_IN';

            return (
              <div
                key={tkt.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">
                      {tkt.ticket_code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : isCheckedIn 
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isActive ? 'Activo / Válido' : isCheckedIn ? 'Ingresado (Check-in)' : tkt.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 line-clamp-1">{tkt.event_title}</h3>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">
                    Localidad: <span className="text-emerald-400">{tkt.tier_name}</span> ($ {Math.round(Number(tkt.tier_price) || 0).toLocaleString('es-CO')} COP)
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="capitalize">{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="line-clamp-1">{tkt.event_location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Firma HMAC verificada</span>
                  </div>
                  <button
                    onClick={() => openTicketDetail(tkt.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver Código QR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal con Código QR en vivo */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Pase de Entrada Digital"
      >
        {selectedTicket && (
          <div className="text-center space-y-5 animate-fadeIn">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTicket.status === 'ACTIVE' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
              }`}>
                {selectedTicket.status === 'ACTIVE' ? 'Listo para Check-in' : 'Boleto Ya Utilizado'}
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{selectedTicket.event_title}</h3>
              <p className="text-xs text-slate-400 mt-1">Localidad: <strong className="text-white">{selectedTicket.tier_name}</strong></p>
            </div>

            {/* Código QR renderizado */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl mx-auto">
              <img
                src={selectedTicket.qr_image}
                alt="Código QR del Boleto"
                className="w-56 h-56 mx-auto"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 font-mono">
              <p className="text-slate-400 text-[10px] uppercase font-sans">Código de Entrada Único</p>
              <p className="text-sm font-bold text-emerald-400">{selectedTicket.ticket_code}</p>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Titular: {selectedTicket.buyer_name} ({selectedTicket.buyer_email})</span>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Boleto Digital</span>
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
