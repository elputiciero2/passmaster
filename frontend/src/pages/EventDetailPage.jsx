import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, Users, ShieldCheck, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EventDetailPage({ eventId, onBack, onPurchaseSuccess, onRequireAuth }) {
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTiers, setSelectedTiers] = useState({}); // { [tierId]: quantity }
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Precargado con la tarjeta de prueba aprobada del sandbox
  const [paymentData, setPaymentData] = useState({
    cardNumber: '4242 4242 4242 4242',
    cardHolder: 'Titular de Prueba',
    expDate: '12/30',
    cvv: '123'
  });
  const setPaymentField = (field) => (e) => setPaymentData({ ...paymentData, [field]: e.target.value });

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const res = await api.getEventById(eventId);
        setEvent(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [eventId]);

  const updateQuantity = (tierId, delta, maxAvailable) => {
    const current = selectedTiers[tierId] || 0;
    const next = Math.max(0, Math.min(maxAvailable, current + delta));
    setSelectedTiers({
      ...selectedTiers,
      [tierId]: next
    });
  };

  const totalQuantity = Object.values(selectedTiers).reduce((sum, q) => sum + q, 0);

  const calculateTotal = () => {
    if (!event || !event.tiers) return 0;
    return event.tiers.reduce((acc, tier) => {
      const q = selectedTiers[tier.id] || 0;
      return acc + q * parseFloat(tier.price);
    }, 0);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const items = Object.entries(selectedTiers)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, quantity]) => ({ tierId: parseInt(tierId, 10), quantity }));

    if (items.length === 0) {
      setError('Debes seleccionar al menos una entrada para comprar.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const res = await api.checkout(items, {
        method: 'card',
        card: {
          number: paymentData.cardNumber,
          holder: paymentData.cardHolder,
          expDate: paymentData.expDate,
          cvv: paymentData.cvv
        }
      });

      setSuccessData(res.data);
    } catch (err) {
      setError(err.message || 'Error al procesar el pago transaccional.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">¡Pago Exitoso y Boletos Emitidos!</h2>
            <p className="text-sm text-slate-300 mt-2">
              Se ha confirmado la orden <span className="font-mono text-emerald-400 font-semibold">{successData.orderNumber}</span>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Total Abonado:</span>
              <span className="font-bold text-white text-sm">${parseFloat(successData.totalAmount).toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pasarela de Pago:</span>
              <span className="text-emerald-400 uppercase font-semibold">{successData.gateway}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Boletos Generados:</span>
              <span className="font-semibold text-white">{successData.tickets?.length || 0} entrada(s) digitales</span>
            </div>
          </div>

          <button
            onClick={onPurchaseSuccess}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
          >
            Ver Mis Boletos y Códigos QR
          </button>
        </div>
      </div>
    );
  }

  const dateStr = new Date(event?.event_date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Botón Volver */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Eventos</span>
      </button>

      {/* Banner & Resumen */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="h-64 sm:h-80 w-full relative">
          <img
            src={event?.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
            alt={event?.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
              {event?.status}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              {event?.title}
            </h1>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 text-sm">
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Fecha y Hora</p>
              <p className="capitalize">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Lugar</p>
              <p>{event?.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Capacidad Total</p>
              <p>{event?.max_capacity} Asistentes</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Acerca del Evento</h3>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {event?.description}
          </p>
        </div>
      </div>

      {/* Selector de Localidades y Pasarela de Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Localidades disponibles */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">1. Selecciona tus Entradas</h2>

          {event?.tiers?.map((tier) => {
            const qty = selectedTiers[tier.id] || 0;
            const isSoldOut = tier.available_quantity <= 0;

            return (
              <div
                key={tier.id}
                className={`p-5 rounded-2xl border transition-all ${
                  qty > 0 
                    ? 'bg-emerald-950/20 border-emerald-500/50' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base">{tier.name}</h3>
                    <p className="text-xs text-slate-400">{tier.description || 'Acceso al evento'}</p>
                    <p className="text-xs font-medium text-emerald-400">
                      Disponibles: <span className="font-bold">{tier.available_quantity}</span> / {tier.total_quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">${parseFloat(tier.price).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 block uppercase">c/u USD</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Cantidad:</span>
                  {isSoldOut ? (
                    <span className="text-xs font-bold text-rose-400 uppercase">Agotado</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(tier.id, -1, tier.available_quantity)}
                        disabled={qty <= 0}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm"
                      >
                        -
                      </button>
                      <span className="font-mono text-base font-bold text-white w-6 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(tier.id, 1, tier.available_quantity)}
                        disabled={qty >= tier.available_quantity}
                        className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen de Compra y Pasarela */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">2. Pago Seguro</h2>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Simulación Pasarela de Pago */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                  <span>Pasarela de Pago (Sandbox)</span>
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Modo de Prueba</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>
                  <label htmlFor="card-holder" className="text-[10px] text-slate-400 block uppercase">Titular de la Tarjeta</label>
                  <input
                    id="card-holder"
                    type="text"
                    autoComplete="cc-name"
                    maxLength={100}
                    value={paymentData.cardHolder}
                    onChange={setPaymentField('cardHolder')}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="card-number" className="text-[10px] text-slate-400 block uppercase">Número de Tarjeta</label>
                  <input
                    id="card-number"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={23}
                    value={paymentData.cardNumber}
                    onChange={setPaymentField('cardNumber')}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="card-exp" className="text-[10px] text-slate-400 block uppercase">Expira (MM/AA)</label>
                    <input
                      id="card-exp"
                      type="text"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={paymentData.expDate}
                      onChange={setPaymentField('expDate')}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="card-cvv" className="text-[10px] text-slate-400 block uppercase">CVV</label>
                    <input
                      id="card-cvv"
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      value={paymentData.cvv}
                      onChange={setPaymentField('cvv')}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tarjetas de prueba: 4242 4242 4242 4242 se aprueba; 4000 0000 0000 0002 se rechaza;
                  4000 0000 0000 9995 no tiene fondos. No se realiza ningún cobro real.
                </p>
              </div>
            </div>

            {/* Subtotal y Total */}
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Entradas Seleccionadas:</span>
                <span className="font-bold text-white">{totalQuantity}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${calculateTotal().toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total a Pagar:</span>
                <span className="text-emerald-400">${calculateTotal().toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={totalQuantity === 0 || processing}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Procesando Pago Transaccional...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar y Comprar Entradas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
