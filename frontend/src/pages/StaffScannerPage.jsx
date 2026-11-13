import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Camera, CameraOff, Keyboard, Clock, RefreshCw } from 'lucide-react';

export default function StaffScannerPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'SUCCESS'|'ALREADY_USED'|'INVALID'|'WRONG_EVENT', message, data }
  const [recentLogs, setRecentLogs] = useState([]);
  const html5QrCodeRef = useRef(null);

  const loadEvents = async () => {
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

  const loadLogs = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await api.getCheckInLogs(eventId);
      setRecentLogs(res.data || []);
    } catch (err) {
      console.error('Error cargando logs de acceso:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadLogs(selectedEventId);
    }
  }, [selectedEventId]);

  // Manejo de la cámara con html5-qrcode
  const startCamera = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Detener o pausar temporalmente para procesar el código detectado
          await stopCamera();
          handleVerify(decodedText);
        },
        (errorMessage) => {
          // Errores menores de lectura continua ignorados
        }
      );
    } catch (err) {
      console.error('Error al inicializar cámara:', err);
      setIsScanning(false);
      alert('No se pudo acceder a la cámara. Asegúrate de otorgar permisos o usa el ingreso manual.');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error deteniendo cámara:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleVerify = async (codeToVerify) => {
    const raw = codeToVerify || manualCode;
    if (!raw.trim()) return;

    setLoading(true);
    setScanResult(null);

    try {
      const res = await api.verifyCheckIn(raw, selectedEventId, 'Puesto de Acceso Web');
      setScanResult({
        status: res.result || 'SUCCESS',
        message: res.message,
        ticket: res.data?.ticket
      });
      setManualCode('');
      loadLogs(selectedEventId);
    } catch (err) {
      setScanResult({
        status: err.message.includes('UTILIZADO') ? 'ALREADY_USED' : 'INVALID',
        message: err.message || 'Error al validar entrada.'
      });
      loadLogs(selectedEventId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
          <ScanLine className="w-3.5 h-3.5" />
          <span>Módulo Oficial de Control de Acceso</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Check-in de Asistentes
        </h1>
        <p className="text-xs text-slate-400">Escaneo óptico de entradas digitales y prevención de duplicidad</p>
      </div>

      {/* Selector de Evento */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <label className="text-xs font-bold text-slate-400 uppercase">Puesto de Control para:</label>
        <select
          value={selectedEventId || ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({ev.location})
            </option>
          ))}
        </select>
      </div>

      {/* Escáner & Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Escáner de Cámara y Manual */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Lector de Cámara QR</span>
              </h2>

              {isScanning ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Detener Cámara</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Camera className="w-4 h-4" />
                  <span>Activar Cámara</span>
                </button>
              )}
            </div>

            {/* Viewport de video para QR */}
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden min-h-[260px] flex items-center justify-center border border-slate-800 relative">
              <div id="qr-reader" className={`w-full ${isScanning ? 'block' : 'hidden'}`} />
              {!isScanning && (
                <div className="text-center p-6 space-y-2">
                  <ScanLine className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-400">Cámara inactiva. Pulsa "Activar Cámara" o ingresa el código manual abajo.</p>
                </div>
              )}
            </div>

            {/* Ingreso manual por teclado */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                O Validar por Código Manual:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Keyboard className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="Ej: TKT-A81E99B2-K92"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={loading || !manualCode.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  {loading ? 'Validando...' : 'Verificar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Veredicto Visual */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[340px] flex flex-col justify-center">
            {scanResult ? (
              <div className={`p-6 rounded-2xl border text-center space-y-4 animate-fadeIn ${
                scanResult.status === 'SUCCESS'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : scanResult.status === 'ALREADY_USED'
                  ? 'bg-rose-950/50 border-rose-600 text-rose-300'
                  : 'bg-amber-950/40 border-amber-500 text-amber-300'
              }`}>
                {scanResult.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400 animate-bounce" />
                ) : scanResult.status === 'ALREADY_USED' ? (
                  <XCircle className="w-16 h-16 mx-auto text-rose-500 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-16 h-16 mx-auto text-amber-400" />
                )}

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {scanResult.status === 'SUCCESS' 
                      ? 'ACCESO AUTORIZADO' 
                      : scanResult.status === 'ALREADY_USED' 
                      ? '¡BOLETO YA USADO!' 
                      : 'ENTRADA RECHAZADA'}
                  </h3>
                  <p className="text-xs mt-2 font-medium leading-relaxed">
                    {scanResult.message}
                  </p>
                </div>

                {scanResult.ticket && (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1 font-mono">
                    <p className="text-slate-400 font-sans text-[10px] uppercase">Datos del Asistente:</p>
                    <p className="font-bold text-white font-sans">{scanResult.ticket.buyer_name}</p>
                    <p className="text-emerald-400">Localidad: {scanResult.ticket.tier_name}</p>
                    <p className="text-slate-400">Código: {scanResult.ticket.ticket_code}</p>
                  </div>
                )}

                <button
                  onClick={() => { setScanResult(null); startCamera(); }}
                  className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
                >
                  Escanear Siguiente Entrada
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <ScanLine className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-xs">Esperando escaneo de código...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial Reciente de Check-ins (Auditoría) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Auditoría de Ingresos Recientes ({recentLogs.length})</span>
          </h3>
          <button
            onClick={() => loadLogs(selectedEventId)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No se han registrado validaciones todavía.</p>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {recentLogs.slice(0, 8).map((log) => {
              const timeStr = new Date(log.scan_timestamp).toLocaleTimeString();
              const isOk = log.result === 'SUCCESS';

              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    <div>
                      <span className="font-mono font-bold text-white">{log.ticket_code}</span>
                      <span className="text-slate-400 ml-2">({log.tier_name})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>{log.staff_name}</span>
                    <span>{timeStr}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isOk ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {log.result}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
